from __future__ import annotations

import argparse
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple, Dict, Any

from email import policy
from email.parser import BytesParser

from mcp.server.fastmcp import FastMCP


mcp = FastMCP("EML Picker")


# ----------------------------
# Natural-language (Korean) query parsing
# ----------------------------

@dataclass
class ParsedQuery:
    op: str  # "AND" or "OR"
    sender: Optional[List[str]] = None
    subject: Optional[List[str]] = None
    body: Optional[List[str]] = None
    attach: Optional[List[str]] = None


def _split_keywords(s: str) -> List[str]:
    # Allow: "A 또는 B", "A,B", "A / B"
    parts = re.split(r"\s*(?:또는|or|,|/|\|)\s*", s, flags=re.IGNORECASE)
    out = []
    for p in parts:
        p = p.strip().strip('"').strip("'").strip()
        if p:
            out.append(p)
    return out


def _extract_field(text: str, keys: Iterable[str]) -> Optional[List[str]]:
    """
    Extract value after keys:
      e.g. "첨부파일명에 oil 들어간" -> "oil"
    We stop at common delimiters: 그리고/및/AND/OR/또는/중/것/메일/인/포함 etc.
    """
    for k in keys:
        # key + 조사/구분 + value
        pat = (
            rf"(?is)\b{k}\b"
            rf"(?:\s*(?:은|는|이|가|에|에서|으로|로|:))?\s*"
            rf"(?P<val>.+?)"
            rf"(?:\s*(?:그리고|및|and|or|또는|중|중에|메일|것|만|포함|들어간|있는|인)\b|$)"
        )
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            val = m.group("val").strip()
            # trim trailing fluff
            val = re.sub(r"(?is)\s*(포함|들어간|있는|인|메일|것|만)\s*$", "", val).strip()
            if val:
                return _split_keywords(val)
    return None


def parse_korean_query(query: str) -> ParsedQuery:
    q = query.strip()

    # Decide overall operator:
    # If the sentence includes "또는/OR" -> OR, else AND (default).
    op = "OR" if re.search(r"(?i)\b(또는|or)\b", q) else "AND"

    sender = _extract_field(q, ["보낸사람", "보낸이", "작성자", "from", "sender"])
    subject = _extract_field(q, ["제목", "subject"])
    body = _extract_field(q, ["내용", "본문", "body"])
    attach = _extract_field(q, ["첨부파일명", "첨부 파일명", "첨부파일", "첨부", "파일명", "filename", "name"])

    # If user says "파일명이 oil" we interpret it as attachment filename, not the .eml filename.
    # (You can expand later if you want .eml filename matching too.)
    return ParsedQuery(op=op, sender=sender, subject=subject, body=body, attach=attach)


# ----------------------------
# EML parsing (robust: uses Python email module)
# ----------------------------

def read_eml(path: Path) -> Tuple[str, str, str, List[str]]:
    """
    Returns: (from_text, subject_text, body_text, attachment_filenames)
    Uses policy.default -> RFC2047/RFC2231 decoding is handled by the email library.
    """
    with path.open("rb") as f:
        msg = BytesParser(policy=policy.default).parse(f)

    from_text = str(msg.get("From", "") or "")
    subject_text = str(msg.get("Subject", "") or "")

    # Body: prefer plain, fallback to html, else join any text parts
    body_text = ""
    try:
        b = msg.get_body(preferencelist=("plain", "html"))
        if b is not None:
            body_text = b.get_content() or ""
        else:
            chunks = []
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype.startswith("text/") and not part.get_filename():
                    try:
                        chunks.append(part.get_content() or "")
                    except Exception:
                        pass
            body_text = "\n".join(chunks)
    except Exception:
        body_text = ""

    # Attachments
    attach_names: List[str] = []
    try:
        for part in msg.iter_attachments():
            fn = part.get_filename()
            if fn:
                attach_names.append(str(fn))
    except Exception:
        # Fallback: walk and check filename
        for part in msg.walk():
            fn = part.get_filename()
            if fn:
                attach_names.append(str(fn))

    # Deduplicate, keep order
    seen = set()
    uniq = []
    for n in attach_names:
        if n not in seen:
            seen.add(n)
            uniq.append(n)
    return from_text, subject_text, body_text, uniq


def contains_any(hay: str, needles: Optional[List[str]]) -> bool:
    if not needles:
        return True
    hay_l = hay.lower()
    return any(n.lower() in hay_l for n in needles)


def attach_contains_any(names: List[str], needles: Optional[List[str]]) -> bool:
    if not needles:
        return True
    needles_l = [n.lower() for n in needles]
    for fn in names:
        f_l = fn.lower()
        if any(n in f_l for n in needles_l):
            return True
    return False


def match_query(pq: ParsedQuery, from_text: str, subject: str, body: str, attach_names: List[str]) -> Dict[str, bool]:
    m_sender = contains_any(from_text, pq.sender)
    m_subject = contains_any(subject, pq.subject)
    m_body = contains_any(body, pq.body)
    m_attach = attach_contains_any(attach_names, pq.attach)

    # If a field wasn't specified, treat it as "pass" (True).
    # contains_any / attach_contains_any already do that when needles is None.
    if pq.op == "OR":
        # OR among specified fields only
        checks = []
        if pq.sender is not None: checks.append(m_sender)
        if pq.subject is not None: checks.append(m_subject)
        if pq.body is not None: checks.append(m_body)
        if pq.attach is not None: checks.append(m_attach)
        overall = any(checks) if checks else True
    else:
        overall = m_sender and m_subject and m_body and m_attach

    return {
        "sender": m_sender,
        "subject": m_subject,
        "body": m_body,
        "attach": m_attach,
        "overall": overall,
    }


def ensure_unique_dest(dest_dir: Path, filename: str) -> Path:
    dest = dest_dir / filename
    if not dest.exists():
        return dest
    stem = dest.stem
    suf = dest.suffix
    i = 1
    while True:
        cand = dest_dir / f"{stem}_{i}{suf}"
        if not cand.exists():
            return cand
        i += 1


# ----------------------------
# MCP Tool
# ----------------------------

@mcp.tool()
def pick_eml(
    spec: str = "",
    mail_folder: str = "",
    query: str = "",
    out_folder: str = "",
    dry_run: bool = True,
    max_list: int = 200,
) -> Dict[str, Any]:
    """
    EML(.eml) files filter & copy.

    You can call it in two ways:

    1) spec one-liner:
       "메일폴더/조건문/저장폴더"
       e.g. "D:\\교육용\\AI활용 사례발표\\받은 편지함/첨부파일명에 oil 들어간 메일/D:\\OIL_EMAIL"

    2) explicit args:
       mail_folder="...", query="...", out_folder="..."
       query is natural Korean text:
         - "첨부파일명에 oil 들어간 메일"
         - "보낸사람 김효일 그리고 첨부파일명 oil"
         - "제목 P&ID 또는 내용 P&ID"
    """
    # Parse spec if provided
    if spec.strip():
        parts = spec.split("/", 2)
        if len(parts) != 3:
            raise ValueError("spec 형식 오류: '메일폴더/조건/저장폴더' 로 3구간을 '/'로 구분하세요.")
        mail_folder, query, out_folder = (p.strip() for p in parts)

    if not mail_folder or not query or not out_folder:
        raise ValueError("입력값 누락: (spec) 또는 (mail_folder, query, out_folder)를 채워야 합니다.")

    src = Path(mail_folder)
    dst = Path(out_folder)

    if not src.exists():
        raise ValueError(f"메일 폴더가 존재하지 않습니다: {src}")
    dst.mkdir(parents=True, exist_ok=True)

    pq = parse_korean_query(query)

    scanned = 0
    matched = 0
    copied = 0

    hit_sender = 0
    hit_subject = 0
    hit_body = 0
    hit_attach = 0

    matched_items: List[Dict[str, Any]] = []
    errors: List[str] = []

    for path in src.rglob("*.eml"):
        scanned += 1
        try:
            from_text, subject_text, body_text, attach_names = read_eml(path)
            flags = match_query(pq, from_text, subject_text, body_text, attach_names)

            # per-field counts (reference)
            if flags["sender"]: hit_sender += 1
            if flags["subject"]: hit_subject += 1
            if flags["body"]: hit_body += 1
            if flags["attach"]: hit_attach += 1

            if flags["overall"]:
                matched += 1
                if len(matched_items) < max_list:
                    matched_items.append({
                        "path": str(path),
                        "from": from_text,
                        "subject": subject_text,
                        "attachments": attach_names,
                    })

                if not dry_run:
                    dest_path = ensure_unique_dest(dst, path.name)
                    shutil.copy2(path, dest_path)
                    copied += 1

        except Exception as e:
            errors.append(f"{path} :: {e}")

    return {
        "input": {
            "mail_folder": str(src),
            "out_folder": str(dst),
            "query": query,
            "parsed": pq.__dict__,
            "dry_run": dry_run,
        },
        "summary": {
            "scanned": scanned,
            "matched": matched,
            "copied": copied if not dry_run else 0,
            "field_hits_ref": {
                "sender": hit_sender,
                "subject": hit_subject,
                "body": hit_body,
                "attach": hit_attach,
            },
            "errors": len(errors),
        },
        "matched_sample": matched_items,
        "errors_sample": errors[:50],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--transport", choices=["stdio", "streamable-http"], default="stdio")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()

    if args.transport == "streamable-http":
        # HTTP endpoint: http://127.0.0.1:8000/mcp
        mcp.run(transport="streamable-http", host=args.host, port=args.port, json_response=True)
    else:
        # default: stdio (best for local MCP hosts)
        mcp.run()


if __name__ == "__main__":
    main()
