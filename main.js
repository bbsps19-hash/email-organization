const emlInput = document.getElementById('emlInput');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const emptyState = document.querySelector('.file-empty');
const warning = document.getElementById('warning');
const langButtons = document.querySelectorAll('.lang-btn');

const filterPanel = document.getElementById('filterPanel');
const resultButton = document.getElementById('resultButton');
const geminiResponse = document.getElementById('geminiResponse');
const geminiResponseText = document.getElementById('geminiResponseText');
const geminiKeywords = document.getElementById('geminiKeywords');
const fieldCheckboxes = document.querySelectorAll('.field-checkbox');
const pagination = document.getElementById('pagination');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('[data-panel]');

const BUILD_ID = '2026-01-28-attachment-fix';
const GEMINI_STORAGE_KEY = 'emailOrganizerGeminiPayload';
const TAB_STORAGE_KEY = 'email_toolkit_tab';

const metaSubject = document.getElementById('metaSubject');
const metaFrom = document.getElementById('metaFrom');
const metaTo = document.getElementById('metaTo');
const metaDate = document.getElementById('metaDate');
const metaAttachments = document.getElementById('metaAttachments');
const metaCategory = document.getElementById('metaCategory');
const metaSnippet = document.getElementById('metaSnippet');
const attachmentList = document.getElementById('attachmentList');
const attachmentEmpty = document.getElementById('attachmentEmpty');

const state = {
  lang: 'ko',
  summaryId: null,
  warning: null,
  emails: [],
  page: 1,
  mode: 'search',
  searchQuery: '',
  geminiRule: '',
  geminiMatches: null,
};

try {
  const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
  if (savedTab === 'search' || savedTab === 'gemini') {
    state.mode = savedTab;
  }
} catch (error) {
  // Ignore storage errors.
}

const translations = {
  ko: {
    title: '이메일 정리기',
    subtitle: '.eml 파일을 드래그하거나 선택해 정리 준비를 시작하세요.',
    tagLocal: '로컬 처리',
    tagFast: '빠른 필터',
    tagSafe: '첨부파일 안전',
    metricOneLabel: '업로드',
    metricOneValue: '다중 .eml',
    metricTwoLabel: '분류',
    metricTwoValue: '자동 규칙',
    metricThreeLabel: '요약',
    metricThreeValue: '미리보기',
    uploadTitle: '.eml 가져오기',
    uploadHint: '메시지 원본(.eml)만 업로드됩니다. 다중 선택 가능.',
    dropTitle: '파일을 드래그해서 놓기',
    dropSub: '또는 아래 버튼으로 선택',
    selectButton: '.eml 파일 선택',
    supported: '지원 형식: .eml',
    empty: '아직 선택된 파일이 없습니다.',
    emptyFiltered: '조건에 맞는 메일이 없습니다.',
    summaryTitle: '요약 & 분류',
    summaryHint: '선택한 .eml 파일의 메타데이터를 표시합니다.',
    summaryMeta: '메타데이터',
    metaSubject: '제목',
    metaFrom: '보낸 사람',
    metaTo: '받는 사람',
    metaDate: '날짜',
    metaAttachments: '첨부파일',
    summaryCategory: '자동 분류',
    summarySnippet: '본문 미리보기',
    summaryAttachments: '첨부파일 다운로드',
    filterTitle: '필터 & 분류 규칙',
    filterHint: '검색 또는 Gemini 분류 탭을 선택하세요.',
    filterSearch: '검색',
    filterPlaceholder: '키워드(쉼표로 구분), 제목, 본문, 발신자, 첨부파일명',
    tabSearch: '검색 엔진',
    tabGemini: 'Gemini 분류',
    geminiPrompt: '분류 기준 설명',
    geminiPlaceholder: '예: 견적/도면/계약 관련 메일만 보고 싶어',
    resultButton: '결과 보기',
    geminiHint: 'Cloudflare Pages Functions를 통해 분류합니다. 대시보드 환경 변수에 GEMINI_API_KEY를 설정하세요.',
    geminiCheck: '서버 상태 확인',
    geminiChecking: 'Gemini 서버 상태 확인 중...',
    geminiCheckOk: 'Gemini 서버 연결됨.',
    geminiCheckFail: 'Gemini 서버에 연결할 수 없습니다.',
    geminiRunning: 'Gemini 분류 중...',
    geminiSuccess: (count) => `Gemini 분류 완료: ${count}개 매칭`,
    geminiError: 'Gemini 서버에 연결할 수 없습니다.',
    geminiSetup: 'Gemini API 키가 필요합니다. Cloudflare Pages 환경 변수(GEMINI_API_KEY)를 설정하세요.',
    geminiStored: '이전에 실행한 Gemini 결과가 있습니다.',
    geminiDefaultReply: '요청하신 기준으로 메일을 분류해드리겠습니다.',
    geminiResponseLabel: 'Gemini 답변',
    geminiKeywordsLabel: 'Gemini 키워드',
    geminiRuleRequired: '분류 기준을 입력하세요.',
    fieldSubject: '제목',
    fieldBody: '본문',
    fieldFrom: '발신자',
    fieldAttachments: '첨부파일명',
    viewFiltered: '필터 결과 보기',
    dropAria: '.eml 파일을 여기로 드롭하세요',
    warningInvalid: (count) => `.eml이 아닌 파일 ${count}개는 제외되었습니다.`,
    warningNone: '선택한 파일 중 .eml 형식이 없습니다.',
    attachmentEmpty: '첨부파일이 없습니다.',
    attachmentDownload: '다운로드',
    attachmentUnavailable: '다운로드 불가',
  },
  en: {
    title: 'Email Organizer',
    subtitle: 'Drag and drop .eml files or select them to start organizing.',
    tagLocal: 'Local processing',
    tagFast: 'Fast filters',
    tagSafe: 'Safe attachments',
    metricOneLabel: 'Upload',
    metricOneValue: 'Multi .eml',
    metricTwoLabel: 'Classify',
    metricTwoValue: 'Auto rules',
    metricThreeLabel: 'Summary',
    metricThreeValue: 'Preview',
    uploadTitle: 'Import .eml',
    uploadHint: 'Only raw .eml messages are accepted. Multiple selection allowed.',
    dropTitle: 'Drop files here',
    dropSub: 'Or select using the button',
    selectButton: 'Choose .eml files',
    supported: 'Supported format: .eml',
    empty: 'No files selected yet.',
    emptyFiltered: 'No emails match the current filters.',
    summaryTitle: 'Summary & Classification',
    summaryHint: 'Shows metadata for the selected .eml file.',
    summaryMeta: 'Metadata',
    metaSubject: 'Subject',
    metaFrom: 'From',
    metaTo: 'To',
    metaDate: 'Date',
    metaAttachments: 'Attachments',
    summaryCategory: 'Auto Category',
    summarySnippet: 'Body Preview',
    summaryAttachments: 'Attachments',
    filterTitle: 'Filters & Classification',
    filterHint: 'Choose Search or Gemini tab.',
    filterSearch: 'Search',
    filterPlaceholder: 'Keywords (comma-separated), subject, body, sender, attachment name',
    tabSearch: 'Search',
    tabGemini: 'Gemini',
    geminiPrompt: 'Describe your criteria',
    geminiPlaceholder: 'e.g., Only quotes/drawings/contracts',
    resultButton: 'View results',
    geminiHint: 'Classification runs via Cloudflare Pages Functions. Set GEMINI_API_KEY in the Pages environment.',
    geminiCheck: 'Check server status',
    geminiChecking: 'Checking Gemini server...',
    geminiCheckOk: 'Gemini server connected.',
    geminiCheckFail: 'Could not reach Gemini server.',
    geminiRunning: 'Running Gemini...',
    geminiSuccess: (count) => `Gemini matched ${count} emails.`,
    geminiError: 'Could not reach Gemini server.',
    geminiSetup: 'Gemini API key is required. Set GEMINI_API_KEY in Cloudflare Pages.',
    geminiStored: 'Saved Gemini results are available.',
    geminiDefaultReply: 'I will classify emails based on your criteria.',
    geminiResponseLabel: 'Gemini Response',
    geminiKeywordsLabel: 'Gemini Keywords',
    geminiRuleRequired: 'Please enter a classification rule.',
    fieldSubject: 'Subject',
    fieldBody: 'Body',
    fieldFrom: 'Sender',
    fieldAttachments: 'Attachments',
    viewFiltered: 'View filtered emails',
    dropAria: 'Drop .eml files here',
    warningInvalid: (count) => `Excluded ${count} non-.eml file(s).`,
    warningNone: 'No valid .eml files were selected.',
    attachmentEmpty: 'No attachments.',
    attachmentDownload: 'Download',
    attachmentUnavailable: 'Unavailable',
  },
};

const categoryLabels = {
  uncategorized: { ko: '미분류', en: 'Uncategorized' },
  gemini: { ko: 'Gemini', en: 'Gemini' },
};

const isEmlFile = (file) =>
  file.name.toLowerCase().endsWith('.eml') || file.type === 'message/rfc822';

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / 1024 ** idx).toFixed(idx === 0 ? 0 : 1);
  return `${size} ${units[idx]}`;
};

const normalizeCharset = (value) => {
  if (!value) return 'utf-8';
  const cleaned = value.toLowerCase().replace(/["']/g, '').trim();
  const map = {
    utf8: 'utf-8',
    'utf-8': 'utf-8',
    'us-ascii': 'windows-1252',
    latin1: 'iso-8859-1',
    'iso-8859-1': 'iso-8859-1',
    'iso8859-1': 'iso-8859-1',
    'windows-1252': 'windows-1252',
    'ks_c_5601-1987': 'euc-kr',
    'euc-kr': 'euc-kr',
    'cp949': 'euc-kr',
    'shift_jis': 'shift_jis',
    'sjis': 'shift_jis',
    'cp932': 'shift_jis',
    'gbk': 'gbk',
    'gb2312': 'gbk',
  };
  return map[cleaned] || cleaned;
};

const decodeBytes = (bytes, charset) => {
  const normalized = normalizeCharset(charset);
  try {
    return new TextDecoder(normalized, { fatal: false }).decode(bytes);
  } catch (error) {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
};

const decodeQpToBytes = (input) => {
  const cleaned = input.replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (char === '=' && /[0-9A-Fa-f]{2}/.test(cleaned.slice(i + 1, i + 3))) {
      bytes.push(parseInt(cleaned.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(char.charCodeAt(0));
    }
  }
  return new Uint8Array(bytes);
};

const normalizeEncodedWordSeparators = (value) =>
  value.replace(/(\?=)\s*,\s*(=\?)/g, '$1 $2').replace(/(\?=)\s+(=\?)/g, '$1 $2');

const fixBrokenEncodedWords = (value) => {
  let fixed = value;
  // Remove dangling empty encoded-word tokens like "=?=".
  fixed = fixed.replace(/=\?=\s*/g, '');
  // Close encoded-word that accidentally swallows an email address.
  fixed = fixed.replace(/(=\?[^?]+\?[bqBQ]\?[^?]*?)<([^>]+)>\?=/g, '$1?= <$2>');
  fixed = fixed.replace(/(=\?[^?]+\?[bqBQ]\?[^?]*?)<([^>]+)>/g, '$1?= <$2>');
  // Close encoded-words that are followed by an address without ?=
  fixed = fixed.replace(/(=\?[^?]+\?[bqBQ]\?[^?]*)(\s*<[^>]+>)/g, (match, token, addr) => {
    return token.endsWith('?=') ? match : `${token}?=${addr}`;
  });
  // Ensure split encoded-words are closed before another encoded-word begins.
  fixed = fixed.replace(/(=\?[^?]+\?[bqBQ]\?)([^?]*?)(?==\?)/g, (match, prefix, body) => {
    if (body.endsWith('?=')) return match;
    return `${prefix}${body}?=`;
  });
  // Close any trailing encoded-word without ?=
  fixed = fixed.replace(/(=\?[^?]+\?[bqBQ]\?[^?]*$)/g, (match) =>
    match.endsWith('?=') ? match : `${match}?=`
  );
  return fixed;
};

const scoreDecodedText = (value) => {
  const replacements = (value.match(/�/g) || []).length;
  const hangul = (value.match(/[가-힣]/g) || []).length;
  return { replacements, hangul };
};

const pickBestText = (candidates) => {
  const filtered = candidates.map((value) => (value ? value.trim() : '')).filter(Boolean);
  if (!filtered.length) return '';
  let best = filtered[0];
  let bestScore = scoreDecodedText(best);
  for (let i = 1; i < filtered.length; i += 1) {
    const score = scoreDecodedText(filtered[i]);
    if (
      score.replacements < bestScore.replacements ||
      (score.replacements === bestScore.replacements && score.hangul > bestScore.hangul) ||
      (score.replacements === bestScore.replacements &&
        score.hangul === bestScore.hangul &&
        filtered[i].length > best.length)
    ) {
      best = filtered[i];
      bestScore = score;
    }
  }
  return best;
};

const decodeAddressHeader = (value) => {
  if (!value) return '';
  const raw = String(value);
  const decoded = decodeMimeWords(raw).replace(/\s{2,}/g, ' ').trim();
  const repaired = repairMojibake(decoded);
  const rawBytes = latin1ToBytes(raw);
  const utf8FromLatin1 = decodeBytes(rawBytes, 'utf-8');
  const eucFromLatin1 = decodeBytes(rawBytes, 'euc-kr');
  return pickBestText([repaired, decoded, utf8FromLatin1, eucFromLatin1, raw]);
};

const pickBestDecoded = (bytes, charset) => {
  const normalized = normalizeCharset(charset);
  const candidates = [normalized, 'utf-8', 'euc-kr', 'windows-1252']
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
  let best = decodeBytes(bytes, candidates[0]);
  let bestScore = scoreDecodedText(best);
  for (let i = 1; i < candidates.length; i += 1) {
    const decoded = decodeBytes(bytes, candidates[i]);
    const score = scoreDecodedText(decoded);
    if (
      score.replacements < bestScore.replacements ||
      (score.replacements === bestScore.replacements && score.hangul > bestScore.hangul)
    ) {
      best = decoded;
      bestScore = score;
    }
  }
  return best;
};

const decodeMimeWords = (value) => {
  if (!value) return '';
  const normalized = fixBrokenEncodedWords(normalizeEncodedWordSeparators(value));
  const decoded = normalized.replace(/=\?([^?]+)\?([bqBQ])\?([^?]+)\?=/g, (match, charset, enc, text) => {
    const encoding = enc.toLowerCase();
    let bytes;
    if (encoding === 'b') {
      try {
        const sanitized = text.replace(/\s+/g, '');
        const padding = '='.repeat((4 - (sanitized.length % 4)) % 4);
        const binary = atob(sanitized + padding);
        bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
      } catch (error) {
        return match;
      }
    } else {
      const normalized = text.replace(/_/g, ' ');
      bytes = decodeQpToBytes(normalized);
    }
    return pickBestDecoded(bytes, charset);
  });
  const cleaned = decoded.replace(/=\?=\s*/g, '').replace(/\s{2,}/g, ' ').trim();
  return repairMojibake(cleaned);
};

const decodeAttachmentName = (value) => {
  if (!value) return '';
  const raw = String(value);
  let decoded = decodeMimeWords(raw).trim();
  for (let i = 0; i < 2; i += 1) {
    if (!/=\?[^?]+\?[bqBQ]\?/.test(decoded)) break;
    decoded = decodeMimeWords(decoded).trim();
  }
  decoded = decoded.replace(/\s{2,}/g, ' ');
  const repaired = repairMojibake(decoded);
  const rawBytes = latin1ToBytes(raw);
  const utf8FromLatin1 = decodeBytes(rawBytes, 'utf-8');
  const eucFromLatin1 = decodeBytes(rawBytes, 'euc-kr');
  return pickBestText([repaired, decoded, utf8FromLatin1, eucFromLatin1, raw]);
};

const decodeHeaderParamValue = (rawValue) => {
  if (!rawValue) return '';
  const cleaned = rawValue.trim().replace(/(^\"|\"$)/g, '');
  const decodedRfc = decodeRfc2231(cleaned);
  const decoded = decodeMimeWords(decodedRfc).trim();
  const repaired = repairMojibake(decoded);
  if (repaired && repaired !== decoded) return repaired;
  if (!/�/.test(decoded)) return decoded;
  const bytes = windows1252ToBytes(cleaned);
  const candidates = [
    decoded,
    decodeBytes(bytes, 'euc-kr'),
    decodeBytes(bytes, 'utf-8'),
  ];
  let best = candidates[0];
  let bestScore = scoreDecodedText(best);
  for (let i = 1; i < candidates.length; i += 1) {
    const score = scoreDecodedText(candidates[i]);
    if (
      score.replacements < bestScore.replacements ||
      (score.replacements === bestScore.replacements && score.hangul > bestScore.hangul)
    ) {
      best = candidates[i];
      bestScore = score;
    }
  }
  return repairMojibake(best.trim());
};

const repairMojibake = (value) => {
  if (!value) return '';
  const suspicious = /�|Ã.|Â.|â|ê|ë|ì|í|ï/.test(value);
  if (!suspicious) return value;
  const bytes = windows1252ToBytes(value);
  const candidates = [value, decodeBytes(bytes, 'utf-8'), decodeBytes(bytes, 'euc-kr')].filter(Boolean);
  let best = candidates[0];
  let bestScore = scoreDecodedText(best);
  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const score = scoreDecodedText(candidate);
    if (
      score.replacements < bestScore.replacements ||
      (score.replacements === bestScore.replacements && score.hangul > bestScore.hangul)
    ) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
};

const parseHeaderParams = (value) => {
  if (!value) return { mime: '', params: {} };
  const tokens = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (ch === ';' && !inQuotes) {
      tokens.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);

  const [mimeToken, ...rest] = tokens;
  const params = {};
  rest.forEach((part) => {
    const [key, ...valParts] = part.split('=');
    if (!key) return;
    const rawValue = valParts.join('=').trim();
    if (!rawValue) return;
    params[key.trim().toLowerCase()] = rawValue.replace(/(^\"|\"$)/g, '');
  });

  const expanded = { ...params };
  const continuations = {};
  Object.entries(params).forEach(([key, rawValue]) => {
    const match = key.match(/^(.*)\*(\d+)(\*)?$/);
    if (!match) return;
    const base = match[1];
    const idx = Number(match[2]);
    const encoded = Boolean(match[3]);
    if (!continuations[base]) continuations[base] = [];
    continuations[base].push({ idx, value: rawValue, encoded });
  });

  Object.entries(continuations).forEach(([base, segments]) => {
    segments.sort((a, b) => a.idx - b.idx);
    let charset = null;
    const bytes = [];
    segments.forEach((segment, index) => {
      let part = segment.value;
      if (segment.encoded && index === 0 && part.includes("''")) {
        const [cs, restPart] = part.split("''");
        charset = normalizeCharset(cs);
        part = restPart;
      }
      if (segment.encoded) {
        bytes.push(...percentToBytes(part));
      } else {
        bytes.push(...latin1ToBytes(part));
      }
    });
    expanded[base] = decodeBytes(Uint8Array.from(bytes), charset || 'utf-8');
  });

  return { mime: (mimeToken || '').trim().toLowerCase(), params: expanded };
};

const latin1FromBuffer = (buffer) =>
  new TextDecoder('iso-8859-1', { fatal: false }).decode(buffer);

const latin1ToBytes = (text) => Uint8Array.from(text, (ch) => ch.charCodeAt(0));

const windows1252ToBytes = (text) => {
  if (!text) return new Uint8Array(0);
  return Uint8Array.from(text, (ch) => ch.charCodeAt(0));
};

const percentToBytes = (value) => {
  const bytes = [];
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '%' && /[0-9A-Fa-f]{2}/.test(value.slice(i + 1, i + 3))) {
      bytes.push(parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(ch.charCodeAt(0));
    }
  }
  return bytes;
};

const decodeBodyToBytes = (bodyText, transferEncoding) => {
  const encoding = (transferEncoding || '').toLowerCase();
  if (encoding === 'base64') {
    try {
      const sanitized = bodyText.replace(/\s+/g, '');
      const binary = atob(sanitized);
      return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    } catch (error) {
      return latin1ToBytes(bodyText);
    }
  }
  if (encoding === 'quoted-printable') {
    return decodeQpToBytes(bodyText);
  }
  return latin1ToBytes(bodyText);
};

const splitMultipart = (bodyText, boundary) => {
  if (!boundary) return [];
  const boundaryText = `--${boundary}`;
  const parts = bodyText.split(boundaryText).slice(1);
  return parts
    .map((part) => part.replace(/^\r?\n/, '').replace(/\r?\n--\s*$/, '').trim())
    .filter(Boolean);
};

const looksLikeEml = (buffer) => {
  const sample = latin1FromBuffer(buffer).slice(0, 65536);
  const hasHeader = /^(from|subject|to|date|mime-version|content-type):/gim.test(sample);
  const hasBlankLine = /\r?\n\r?\n/.test(sample);
  return hasHeader && hasBlankLine;
};

const setWarning = (invalidCount, total) => {
  const t = translations[state.lang];
  if (total === 0 || invalidCount === 0) {
    warning.hidden = true;
    state.warning = null;
    return;
  }

  warning.hidden = false;
  warning.textContent = total === invalidCount ? t.warningNone : t.warningInvalid(invalidCount);
  state.warning = { invalidCount, total };
};

const applyTranslations = () => {
  const t = translations[state.lang];
  document.documentElement.lang = state.lang;
  document.title = t.title;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (t[key]) {
      node.textContent = t[key];
    }
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
    const key = node.dataset.i18nAria;
    if (t[key]) {
      node.setAttribute('aria-label', t[key]);
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (t[key]) {
      node.setAttribute('placeholder', t[key]);
    }
  });
  if (resultButton) {
    resultButton.textContent = t.resultButton;
    resultButton.disabled = state.mode === 'gemini' && !state.geminiRule.trim();
  }
  if (resultButton) {
    resultButton.disabled = state.mode === 'gemini' && !state.geminiRule.trim();
  }
  if (geminiResponseText) {
    geminiResponseText.textContent = t.geminiDefaultReply;
  }
  if (geminiKeywords) {
    geminiKeywords.textContent = '-';
  }

  langButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === state.lang);
  });

  if (state.warning) {
    setWarning(state.warning.invalidCount, state.warning.total);
  }

  renderFilterPanel();
  renderList();
  renderSummary(state.summaryId);
  try {
    localStorage.setItem('emailOrganizerLang', state.lang);
  } catch (error) {
    // Ignore storage errors.
  }
};

const setGeminiStatus = (message) => {
  const status = document.getElementById('geminiStatus');
  if (!status) return;
  status.textContent = message || '';
};

const setGeminiResponse = (message) => {
  if (!geminiResponse || !geminiResponseText) return;
  if (!message) {
    geminiResponse.hidden = true;
    return;
  }
  geminiResponse.hidden = false;
  geminiResponseText.textContent = message;
};

const setGeminiKeywords = (keywords) => {
  if (!geminiKeywords) return;
  if (!Array.isArray(keywords) || !keywords.length) {
    geminiKeywords.textContent = '-';
    return;
  }
  geminiKeywords.textContent = keywords.join(', ');
};

const setGeminiStatusFromStorage = () => {
  const status = document.getElementById('geminiStatus');
  if (!status) return;
  const t = translations[state.lang];
  try {
    const raw = localStorage.getItem(GEMINI_STORAGE_KEY) || sessionStorage.getItem(GEMINI_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.matches)) return;
    const time = data.updatedAt ? new Date(data.updatedAt) : null;
    const timestamp = time ? time.toLocaleString(state.lang === 'ko' ? 'ko-KR' : 'en-US') : '';
    const message = t.geminiSuccess(data.matches.length);
    const base = timestamp ? `${message} (${timestamp})` : message;
    status.textContent = `${base} · ${t.geminiStored}`;
    if (data.reply) {
      setGeminiResponse(data.reply);
    }
    if (data.keywords) {
      setGeminiKeywords(data.keywords);
    }
  } catch (error) {
    // Ignore storage errors.
  }
};

const checkGeminiServer = async () => {
  const t = translations[state.lang];
  setGeminiStatus(t.geminiChecking);
  try {
    const response = await fetch('/api/health', { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    const data = await response.json();
    if (!data || data.ok !== true) {
      throw new Error('BAD_RESPONSE');
    }
    setGeminiStatus(t.geminiCheckOk);
  } catch (error) {
    setGeminiStatus(t.geminiCheckFail);
  }
};

const renderFilterPanel = () => {
  if (!filterPanel) return;
  const t = translations[state.lang];
  if (state.mode === 'search') {
    filterPanel.innerHTML = `
      <label class="filter-label" for="searchInput" data-i18n="filterSearch">${t.filterSearch}</label>
      <input id="searchInput" type="text" placeholder="${t.filterPlaceholder}" />
    `;
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = state.searchQuery;
      input.addEventListener('input', () => {
        state.searchQuery = input.value;
      });
    }
  } else {
    filterPanel.innerHTML = `
      <label class="filter-label" for="geminiPrompt" data-i18n="geminiPrompt">${t.geminiPrompt}</label>
      <textarea id="geminiPrompt" rows="4" placeholder="${t.geminiPlaceholder}">${state.geminiRule}</textarea>
      <p class="hint" data-i18n="geminiHint">${t.geminiHint}</p>
      <div class="gemini-tools">
        <button type="button" class="file-button status-button" id="geminiCheck" data-i18n="geminiCheck">${t.geminiCheck}</button>
      </div>
      <p class="hint" id="geminiStatus" aria-live="polite"></p>
    `;
    const textarea = document.getElementById('geminiPrompt');
    if (textarea) {
      textarea.value = state.geminiRule;
      textarea.addEventListener('input', () => {
        state.geminiRule = textarea.value;
        if (resultButton) {
          resultButton.disabled = !state.geminiRule.trim();
        }
        try {
          const seed = JSON.stringify({
            prompt: state.geminiRule.trim(),
            matches: [],
            keywords: [],
            reply: t.geminiDefaultReply,
            results: [],
            updatedAt: Date.now(),
          });
          localStorage.setItem(GEMINI_STORAGE_KEY, seed);
          sessionStorage.setItem(GEMINI_STORAGE_KEY, seed);
        } catch (error) {
          // Ignore storage errors.
        }
      });
    }
    const checkButton = document.getElementById('geminiCheck');
    if (checkButton) {
      checkButton.addEventListener('click', checkGeminiServer);
    }
    setGeminiStatusFromStorage();
    setGeminiResponse(t.geminiDefaultReply);
  }
};

const applyGeminiMatches = (ids) => {
  state.geminiMatches = new Set(ids);
  state.emails = state.emails.map((email) => ({
    ...email,
    category: state.geminiMatches.has(email.id) ? 'gemini' : 'uncategorized',
  }));
  state.page = 1;
  renderList();
  renderSummary(state.summaryId);
};

const runGeminiClassification = async () => {
  const t = translations[state.lang];
  if (!state.geminiRule.trim()) {
    setGeminiStatus(t.geminiRuleRequired);
    if (resultButton) resultButton.disabled = true;
    return;
  }
  setGeminiStatus(t.geminiRunning);
  setGeminiResponse(t.geminiDefaultReply);
  try {
    const seed = JSON.stringify({
      prompt: state.geminiRule.trim(),
      matches: [],
      keywords: [],
      reply: t.geminiDefaultReply,
      results: [],
      updatedAt: Date.now(),
    });
    localStorage.setItem(GEMINI_STORAGE_KEY, seed);
    sessionStorage.setItem(GEMINI_STORAGE_KEY, seed);
  } catch (error) {
    // Ignore storage errors.
  }

  const truncate = (value, max = 2000) => {
    if (!value) return '';
    const text = String(value);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };
  const payload = {
    prompt: state.geminiRule.trim(),
    emails: state.emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      snippet: truncate(email.snippet, 600),
      body: truncate(email.body, 2000),
      fileName: email.fileName,
      attachments: email.attachments,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    console.log('[gemini] request', payload);
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      const message = data?.error || 'Gemini server error';
      throw new Error(message);
    }
    console.log('[gemini] rule', state.geminiRule.trim());
    console.log('[gemini] response', data);
    const ids = Array.isArray(data.matches) ? data.matches : [];
    const keywords = Array.isArray(data.keywords) ? data.keywords : [];
    applyGeminiMatches(ids);
    const reply = data.reply || data.notes || t.geminiDefaultReply;
    const resultEmails = state.emails
      .filter((email) => ids.includes(email.id))
      .map((email) => ({
        id: email.id,
        fileName: email.fileName,
        subject: email.subject,
        from: email.from,
        date: email.date,
        snippet: email.snippet,
        attachments: email.attachments,
        category: email.category,
      }));
    const payload = {
      prompt: state.geminiRule || '',
      matches: ids,
      keywords,
      reply,
      results: resultEmails,
      updatedAt: Date.now(),
    };
    try {
      const packed = JSON.stringify(payload);
      localStorage.setItem(GEMINI_STORAGE_KEY, packed);
      sessionStorage.setItem(GEMINI_STORAGE_KEY, packed);
    } catch (error) {
      // Ignore storage errors.
    }
    setGeminiStatus(t.geminiSuccess(ids.length));
    setGeminiResponse(reply);
    setGeminiKeywords(keywords);
    persistSnapshots();
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('GEMINI_SETUP')) {
      setGeminiStatus(t.geminiSetup);
    } else if (message.includes('GEMINI_TIMEOUT')) {
      setGeminiStatus(t.geminiSetup);
    } else {
      setGeminiStatus(t.geminiError);
    }
    setGeminiResponse(t.geminiDefaultReply);
  } finally {
    clearTimeout(timeout);
  }
};

const refreshCategories = () => {
  state.emails = state.emails.map((email) => ({
    ...email,
    category: classify(email.subject, email.body, email.attachments),
  }));
  renderList();
  renderSummary(state.summaryId);
};

const setMode = (mode) => {
  if (mode !== 'search' && mode !== 'gemini') return;
  state.mode = mode;
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  state.page = 1;
  if (mode !== 'gemini') {
    state.geminiMatches = null;
    setGeminiStatus('');
  }
  if (resultButton) {
    resultButton.disabled = mode === 'gemini' && !state.geminiRule.trim();
  }
  try {
    localStorage.setItem(TAB_STORAGE_KEY, mode);
  } catch (error) {
    // Ignore storage errors.
  }
  refreshCategories();
  renderFilterPanel();
};

const persistSnapshots = () => {
  try {
    const serialize = (email) => ({
      id: email.id,
      fileName: email.fileName,
      subject: email.subject,
      from: email.from,
      to: email.to,
      date: email.date,
      snippet: email.snippet,
      body: email.body,
      category: email.category,
      attachments: email.attachments,
      size: email.size,
    });
    const filtered = getFilteredEmails();
    localStorage.setItem(
      'emailOrganizerSnapshot',
      JSON.stringify({ updatedAt: Date.now(), emails: state.emails.map(serialize) })
    );
    localStorage.setItem(
      'emailOrganizerFiltered',
      JSON.stringify({
        updatedAt: Date.now(),
        emails: filtered.map(serialize),
        filters: {
          mode: state.mode,
          query: state.searchQuery,
          fields: getActiveFields(),
          geminiPrompt: state.geminiRule || '',
        },
      })
    );
  } catch (error) {
    // Ignore storage errors (quota or privacy mode).
  }
};

const renderList = () => {
  const filtered = getFilteredEmails();
  fileList.innerHTML = '';
  const pageSize = 100;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  if (!filtered.length) {
    emptyState.textContent = state.emails.length ? translations[state.lang].emptyFiltered : translations[state.lang].empty;
    emptyState.hidden = false;
    fileList.hidden = true;
    pagination.hidden = true;
    pagination.innerHTML = '';
    persistSnapshots();
    return;
  }

  emptyState.hidden = true;
  fileList.hidden = false;

  paged.forEach((email, index) => {
    const li = document.createElement('li');
    li.dataset.id = email.id;
    if (email.id === state.summaryId) {
      li.classList.add('is-active');
    }
    if (index >= 5) {
      li.classList.add('is-hidden');
    }

    const title = document.createElement('strong');
    title.textContent = email.subject || email.fileName;

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.innerHTML = `
      <span>${email.from || '-'}</span>
      <span>${email.date || '-'}</span>
      <span>${formatSize(email.size)}</span>
    `;

    const category = document.createElement('span');
    category.className = 'file-badge';
    category.textContent = categoryLabels[email.category]?.[state.lang] ?? '-';

    li.append(title, meta, category);
    li.addEventListener('click', () => {
      state.summaryId = email.id;
      renderSummary(email.id);
      renderList();
    });
    fileList.appendChild(li);
  });

  if (paged.length > 5) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'page-tab';
    let expanded = false;
    const renderToggle = () => {
      toggle.textContent = state.lang === 'ko'
        ? (expanded ? '접기' : '더 보기')
        : (expanded ? 'Show less' : 'Show more');
    };
    renderToggle();
    toggle.addEventListener('click', () => {
      expanded = !expanded;
      const items = fileList.querySelectorAll('li');
      items.forEach((item, idx) => {
        if (idx >= 5) {
          item.classList.toggle('is-hidden', !expanded);
        }
      });
      renderToggle();
    });
    fileList.appendChild(toggle);
  }
  renderPagination(totalPages);
  persistSnapshots();
};

const renderPagination = (totalPages) => {
  if (totalPages <= 1) {
    pagination.hidden = true;
    pagination.innerHTML = '';
    return;
  }
  pagination.hidden = false;
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-tab';
    button.textContent = i;
    if (i === state.page) button.classList.add('is-active');
    button.addEventListener('click', () => {
      state.page = i;
      renderList();
    });
    pagination.appendChild(button);
  }
};

const parseHeaders = (rawHeaders) => {
  const lines = rawHeaders.split(/\r?\n/);
  const unfolded = [];
  const rawUnfolded = [];
  lines.forEach((line) => {
    if (/^[\t ]/.test(line) && unfolded.length) {
      unfolded[unfolded.length - 1] += ` ${line.trim()}`;
      rawUnfolded[rawUnfolded.length - 1] += line.replace(/^[\t ]+/, '');
    } else {
      unfolded.push(line.trim());
      rawUnfolded.push(line);
    }
  });

  const headers = {};
  const rawMap = {};
  unfolded.forEach((line, index) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).toLowerCase();
    const rawValue = line.slice(idx + 1).trim();
    const shouldDecode =
      key !== 'content-type' &&
      key !== 'content-disposition' &&
      key !== 'content-transfer-encoding' &&
      key !== 'mime-version';
    const value = shouldDecode ? decodeMimeWords(rawValue) : rawValue;
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;
    const rawLine = rawUnfolded[index] || line;
    const rawIdx = rawLine.indexOf(':');
    const rawHeaderValue = rawIdx === -1 ? '' : rawLine.slice(rawIdx + 1).replace(/^\s+/, '');
    rawMap[key] = rawMap[key] ? `${rawMap[key]}, ${rawHeaderValue}` : rawHeaderValue;
  });
  headers.__raw = rawMap;
  return headers;
};

const cleanBody = (body) => {
  const withoutHtml = body.replace(/<[^>]+>/g, ' ');
  return withoutHtml.replace(/\s+/g, ' ').trim();
};

const decodeRfc2231 = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/(^\"|\"$)/g, '');
  if (!cleaned.includes("''")) return cleaned;
  const [charset, encoded] = cleaned.split("''");
  try {
    const bytes = percentToBytes(encoded);
    return decodeBytes(Uint8Array.from(bytes), normalizeCharset(charset));
  } catch (error) {
    return cleaned;
  }
};

const extractRfc2231Continuations = (headerValue, baseKey) => {
  if (!headerValue) return '';
  const regex = new RegExp(`${baseKey}\\*(\\d+)\\*?=([^;\\r\\n]+)`, 'gi');
  const segments = [];
  let match = regex.exec(headerValue);
  while (match) {
    const idx = Number(match[1]);
    const encoded = new RegExp(`${baseKey}\\*${match[1]}\\*=`).test(match[0]);
    const raw = match[2].trim().replace(/(^\"|\"$)/g, '');
    segments.push({ idx, encoded, value: raw });
    match = regex.exec(headerValue);
  }
  if (!segments.length) return '';
  segments.sort((a, b) => a.idx - b.idx);
  let charset = null;
  const bytes = [];
  segments.forEach((segment, index) => {
    let part = segment.value;
    if (segment.encoded && index === 0 && part.includes("''")) {
      const [cs, restPart] = part.split("''");
      charset = normalizeCharset(cs);
      part = restPart;
    }
    if (segment.encoded) {
      bytes.push(...percentToBytes(part));
    } else {
      bytes.push(...latin1ToBytes(part));
    }
  });
  return decodeBytes(Uint8Array.from(bytes), charset || 'utf-8');
};

const extractFilenameFromHeaders = (headers) => {
  const disposition = headers.__raw?.['content-disposition'] || headers['content-disposition'] || '';
  const type = headers.__raw?.['content-type'] || headers['content-type'] || '';
  const continuation =
    extractRfc2231Continuations(disposition, 'filename') ||
    extractRfc2231Continuations(type, 'name');
  if (continuation) {
    return decodeMimeWords(continuation).trim();
  }
  const dispositionParams = parseHeaderParams(disposition).params;
  const typeParams = parseHeaderParams(type).params;
  const cleanParamValue = (value) => {
    if (!value) return '';
    const trimmed = value.trim();
    const separators = [
      /,\s*filename\*=/i,
      /,\s*filename=/i,
      /;\s*filename\*=/i,
      /;\s*filename=/i,
      /,\s*name\*=/i,
      /,\s*name=/i,
      /;\s*name\*=/i,
      /;\s*name=/i,
    ];
    let cleaned = trimmed;
    separators.forEach((regex) => {
      const idx = cleaned.search(regex);
      if (idx !== -1) cleaned = cleaned.slice(0, idx).trim();
    });
    return cleaned;
  };
  const raw =
    dispositionParams['filename*'] ||
    dispositionParams.filename ||
    typeParams['name*'] ||
    typeParams.name;
  if (!raw) return '';
  return decodeHeaderParamValue(cleanParamValue(raw));
};

const extractAttachments = (text) => {
  const searchText = text.replace(/\r?\n[ \t]+/g, '');
  const names = new Set();
  const filenameRegex = /filename\\*?=\\??\"?([^\";\\r\\n]+)/gi;
  const nameRegex = /name\\*?=\\??\"?([^\";\\r\\n]+)/gi;
  const continuationRegex = /(filename|name)\\*(\\d+)\\*?=([^;\\r\\n]+)/gi;
  const continuationBuckets = { filename: new Map(), name: new Map() };
  let contMatch = continuationRegex.exec(searchText);
  while (contMatch) {
    const base = contMatch[1].toLowerCase();
    const idx = Number(contMatch[2]);
    const raw = contMatch[3].trim().replace(/(^\"|\"$)/g, '');
    const encoded = contMatch[0].includes('*=');
    if (!continuationBuckets[base].has(idx)) {
      continuationBuckets[base].set(idx, { idx, encoded, value: raw });
    }
    contMatch = continuationRegex.exec(searchText);
  }
  ['filename', 'name'].forEach((base) => {
    if (!continuationBuckets[base].size) return;
    const segments = Array.from(continuationBuckets[base].values()).sort((a, b) => a.idx - b.idx);
    let charset = null;
    const bytes = [];
    segments.forEach((segment, index) => {
      let part = segment.value;
      if (segment.encoded && index === 0 && part.includes("''")) {
        const [cs, restPart] = part.split("''");
        charset = normalizeCharset(cs);
        part = restPart;
      }
      if (segment.encoded) {
        bytes.push(...percentToBytes(part));
      } else {
        bytes.push(...latin1ToBytes(part));
      }
    });
    const combined = decodeBytes(Uint8Array.from(bytes), charset || 'utf-8');
    if (combined) names.add(decodeMimeWords(combined));
  });
  let match = filenameRegex.exec(searchText);
  while (match) {
    names.add(decodeHeaderParamValue(match[1].trim()));
    match = filenameRegex.exec(searchText);
  }
  match = nameRegex.exec(searchText);
  while (match) {
    names.add(decodeHeaderParamValue(match[1].trim()));
    match = nameRegex.exec(searchText);
  }
  return Array.from(names).filter(Boolean);
};

const extractEncodedWordFilenames = (text) => {
  const searchText = text.replace(/\r?\n[ \t]+/g, '');
  const names = new Set();
  const regex = /\b(?:filename|name)\*?=\\??\"?([^\";\\r\\n]+)/gi;
  let match = regex.exec(searchText);
  while (match) {
    const decoded = decodeHeaderParamValue(match[1].trim());
    if (decoded) names.add(decoded);
    match = regex.exec(searchText);
  }
  return Array.from(names).filter(Boolean);
};

const extractHeaderFilenamesFromRaw = (text) => {
  const names = new Set();
  const quoted = /(?:filename|name)\*?=\\s*\"([\\s\\S]*?)\"/gi;
  let match = quoted.exec(text);
  while (match) {
    const cleaned = match[1].replace(/\\r?\\n[ \\t]+/g, '');
    const decoded = decodeHeaderParamValue(cleaned);
    if (decoded) names.add(decoded);
    match = quoted.exec(text);
  }
  const searchText = text.replace(/\\r?\\n[ \\t]+/g, '');
  const unquoted = /(?:filename|name)\\*?=\\s*([^;\\r\\n]+)/gi;
  match = unquoted.exec(searchText);
  while (match) {
    const decoded = decodeHeaderParamValue(match[1].trim());
    if (decoded) names.add(decoded);
    match = unquoted.exec(searchText);
  }
  return Array.from(names).filter(Boolean);
};

const extractHeaderFilenameEntries = (text) => {
  const entries = [];
  const quoted = /(filename|name)\\*?=\\s*\"([\\s\\S]*?)\"/gi;
  let match = quoted.exec(text);
  while (match) {
    const kind = match[1].toLowerCase();
    const cleaned = match[2].replace(/\\r?\\n[ \\t]+/g, '');
    const decoded = decodeHeaderParamValue(cleaned);
    if (decoded) entries.push({ kind, value: decoded });
    match = quoted.exec(text);
  }
  const searchText = text.replace(/\\r?\\n[ \\t]+/g, '');
  const unquoted = /(filename|name)\\*?=\\s*([^;\\r\\n]+)/gi;
  match = unquoted.exec(searchText);
  while (match) {
    const kind = match[1].toLowerCase();
    const decoded = decodeHeaderParamValue(match[2].trim());
    if (decoded) entries.push({ kind, value: decoded });
    match = unquoted.exec(searchText);
  }
  return entries;
};

const repairAttachmentData = (emailAttachments, rawText) => {
  if (!Array.isArray(emailAttachments) || !emailAttachments.length || !rawText) return emailAttachments;
  const entries = extractHeaderFilenameEntries(rawText);
  const filenameList = entries.filter((item) => item.kind === 'filename').map((item) => item.value);
  const nameList = entries.filter((item) => item.kind === 'name').map((item) => item.value);
  let orderedNames = filenameList.length ? filenameList : nameList;
  if (!orderedNames.length) {
    const decodedMatches = [];
    const filenameMatches = rawText.matchAll(/filename=\"([\s\S]*?)\"/gi);
    for (const match of filenameMatches) {
      if (!match?.[1]) continue;
      const cleaned = match[1].replace(/\r?\n[ \t]+/g, '');
      const decoded = decodeMimeWords(cleaned);
      if (decoded) decodedMatches.push(decoded);
    }
    const cdMatches = rawText.matchAll(/content-disposition:[\s\S]*?filename=\"([\s\S]*?)\"/gi);
    for (const match of cdMatches) {
      if (!match?.[1]) continue;
      const cleaned = match[1].replace(/\r?\n[ \t]+/g, '');
      const decoded = decodeMimeWords(cleaned);
      if (decoded) decodedMatches.push(decoded);
    }
    if (decodedMatches.length) orderedNames = decodedMatches;
  }
  const encodedNames = extractEncodedWordFilenames(rawText);
  const rawNames = extractHeaderFilenamesFromRaw(rawText);
  const combinedNames = Array.from(new Set([...orderedNames, ...rawNames, ...encodedNames]));
  if (!combinedNames.length) return emailAttachments;
  const rankedNames = [...combinedNames].sort((a, b) => {
    const scoreA = scoreDecodedText(a);
    const scoreB = scoreDecodedText(b);
    if (scoreA.replacements !== scoreB.replacements) {
      return scoreA.replacements - scoreB.replacements;
    }
    if (scoreA.hangul !== scoreB.hangul) {
      return scoreB.hangul - scoreA.hangul;
    }
    return b.length - a.length;
  });
  const bestName = rankedNames[0];
  return emailAttachments.map((item, index) => {
    if (typeof item.name !== 'string') return item;
    const trimmed = item.name.trim();
    const looksBroken = /�|Ã.|Â.|â|ê|ë|ì|í|ï/.test(trimmed) || trimmed.endsWith('-');
    if (!looksBroken && trimmed.includes('.')) return item;
    let match = combinedNames.find((name) => name.startsWith(trimmed));
    if (!match && orderedNames.length) {
      match = orderedNames[Math.min(index, orderedNames.length - 1)];
    } else if (!match && combinedNames.length === emailAttachments.length) {
      match = combinedNames[index];
    }
    if (!match) {
      match = bestName;
    }
    return match ? { ...item, name: match } : item;
  });
};

const extractFirstFilenameFromRaw = (rawText) => {
  if (!rawText) return '';
  const match = rawText.match(/filename=\"([\\s\\S]*?)\"/i);
  if (!match?.[1]) return '';
  const cleaned = match[1].replace(/\\r?\\n[ \\t]+/g, '');
  return decodeAttachmentName(cleaned);
};

const parsePart = (rawPart, inheritedCharset = 'utf-8') => {
  const [rawHeaders = '', rawBody = ''] = rawPart.split(/\r?\n\r?\n/);
  const headers = parseHeaders(rawHeaders);
  const contentType = headers['content-type'] || 'text/plain';
  const { mime, params } = parseHeaderParams(contentType);
  const charset = params.charset || inheritedCharset;
  const transfer = headers['content-transfer-encoding'] || '';

  if (mime.startsWith('multipart/')) {
    const boundary = params.boundary;
    const subparts = splitMultipart(rawBody, boundary);
    return subparts.reduce(
      (acc, part) => {
        const parsed = parsePart(part, charset);
        acc.texts.push(...parsed.texts);
        acc.attachments.push(...parsed.attachments);
        return acc;
      },
      { texts: [], attachments: [] }
    );
  }

  const filename = extractFilenameFromHeaders(headers);
  const disposition = (headers['content-disposition'] || '').toLowerCase();
  const isAttachment = Boolean(filename) || disposition.includes('attachment');
  const bodyBytes = decodeBodyToBytes(rawBody, transfer);
  const attachments = [];

  if (isAttachment) {
    attachments.push({
      name: decodeAttachmentName(filename || 'attachment'),
      type: mime || 'application/octet-stream',
      bytes: bodyBytes,
      rawHeaders,
      rawContentType: headers['content-type'] || '',
      rawDisposition: headers['content-disposition'] || '',
    });
  }

  if (mime.startsWith('text/')) {
    const decoded = decodeBytes(bodyBytes, charset);
    return { texts: [{ mime, text: decoded }], attachments };
  }

  return { texts: [], attachments };
};

const classify = (subject, body, attachments) => {
  return 'uncategorized';
};

const renderSummary = (id) => {
  let email = state.emails.find((item) => item.id === id);
  if (!email) {
    metaSubject.textContent = '-';
    metaFrom.textContent = '-';
    metaTo.textContent = '-';
    metaDate.textContent = '-';
    metaAttachments.textContent = '-';
    metaCategory.textContent = '-';
    metaSnippet.textContent = '-';
    attachmentEmpty.textContent = '-';
    attachmentList.hidden = true;
    attachmentList.innerHTML = '';
    return;
  }

  if (email?.rawText && Array.isArray(email.attachmentsData) && email.attachmentsData.length) {
    const repaired = repairAttachmentData(email.attachmentsData, email.rawText);
    const repairedAttachments = repaired.map((item) => decodeAttachmentName(item.name));
    if (
      repairedAttachments.join('\u0000') !== email.attachments.join('\u0000') ||
      repaired.some((item, index) => item.name !== email.attachmentsData[index]?.name)
    ) {
      email = { ...email, attachmentsData: repaired, attachments: repairedAttachments };
      state.emails = state.emails.map((item) => (item.id === email.id ? email : item));
    }
  }
  const label = categoryLabels[email.category]?.[state.lang] ?? '-';
  metaSubject.textContent = email.subject || '-';
  metaFrom.textContent = email.from || '-';
  metaTo.textContent = email.to || '-';
  metaDate.textContent = email.date || '-';
  metaAttachments.textContent = email.attachments.length
    ? email.attachments.map(decodeAttachmentName).join(', ')
    : '-';
  metaCategory.textContent = label;
  metaSnippet.textContent = email.snippet || '-';
  renderAttachmentList(email);
};

const renderAttachmentList = (email) => {
  const t = translations[state.lang];
  attachmentList.innerHTML = '';
  const items = (email.attachmentsData || []).map((item) => ({
    ...item,
    name: decodeAttachmentName(item.name),
  }));
  if (!items.length) {
    attachmentEmpty.textContent = t.attachmentEmpty;
    attachmentList.hidden = true;
    return;
  }

  attachmentEmpty.textContent = '';
  attachmentList.hidden = false;
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'attachment-item';
    const name = document.createElement('span');
    name.textContent = item.name;
    const button = document.createElement('button');
    if (item.bytes && item.bytes.length) {
      button.textContent = t.attachmentDownload;
      button.addEventListener('click', () => downloadAttachment(item));
    } else {
      button.textContent = t.attachmentUnavailable;
      button.disabled = true;
    }
    li.append(name, button);
    attachmentList.appendChild(li);
  });
};

const downloadAttachment = (item) => {
  const blob = new Blob([item.bytes], { type: item.type || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = item.name || 'attachment';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const parseEml = (buffer) => {
  const rawText = latin1FromBuffer(buffer);
  const [rawHeaders = '', rawBody = ''] = rawText.split(/\r?\n\r?\n/);
  const headers = parseHeaders(rawHeaders);
  const subject = decodeAttachmentName(headers.subject || '');
  const from = decodeAddressHeader(headers.from || '');
  const to = decodeAddressHeader(headers.to || '');
  const date = headers.date || '';

  const { mime, params } = parseHeaderParams(headers['content-type'] || 'text/plain');
  let texts = [];
  let attachmentsData = [];
  if (mime.startsWith('multipart/')) {
    const boundary = params.boundary;
    const parts = splitMultipart(rawBody, boundary);
    parts.forEach((part) => {
      const parsed = parsePart(part, params.charset || 'utf-8');
      texts = texts.concat(parsed.texts);
      attachmentsData = attachmentsData.concat(parsed.attachments);
    });
  } else {
    const transfer = headers['content-transfer-encoding'] || '';
    const charset = params.charset || 'utf-8';
    const bodyBytes = decodeBodyToBytes(rawBody, transfer);
    const decoded = decodeBytes(bodyBytes, charset);
    texts = [{ mime: mime || 'text/plain', text: decoded }];
  }

  if (!attachmentsData.length) {
    attachmentsData = extractAttachments(rawText).map((name) => ({
      name: decodeAttachmentName(name),
      type: 'application/octet-stream',
      bytes: null,
    }));
  }

  const preferred = texts.find((part) => part.mime === 'text/plain') || texts[0];
  const body = preferred ? cleanBody(preferred.text) : '';
  const snippet = body.slice(0, 200);
  attachmentsData = repairAttachmentData(attachmentsData, rawText);
  const attachments = attachmentsData.map((item) => decodeAttachmentName(item.name));
  const category = classify(subject, body, attachments);
  const hasTruncatedAttachment = attachmentsData.some(
    (item) => typeof item.name === 'string' && item.name.trim().endsWith('-')
  );
  const hasMojibakeAttachment = attachmentsData.some((item) => {
    const name = typeof item.name === 'string' ? item.name : '';
    return /�|Ã.|Â.|â|ê|ë|ì|í|ï/.test(name);
  });

  return {
    subject,
    from,
    to,
    date,
    body,
    snippet,
    attachments,
    attachmentsData,
    category,
    rawText,
  };
};

const getActiveFields = () => {
  if (!fieldCheckboxes.length) {
    return ['subject', 'body', 'from', 'attachments'];
  }
  const activePanel = document.querySelector('[data-panel]:not([hidden])');
  const scope = activePanel ? activePanel.querySelectorAll('.field-checkbox') : fieldCheckboxes;
  return Array.from(scope)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
};

const getFilteredEmails = () => {
  const query = state.searchQuery.trim().toLowerCase();
  const keywords = query
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
  const fields = getActiveFields();

  return state.emails.filter((email) => {
    if (state.mode === 'gemini') {
      if (!state.geminiMatches) return true;
      return state.geminiMatches.has(email.id);
    }
    if (!query && !keywords.length) return true;
    if (!fields.length) return false;

    const haystacks = [];
    if (fields.includes('subject')) haystacks.push(email.subject);
    if (fields.includes('body')) haystacks.push(email.body);
    if (fields.includes('from')) haystacks.push(email.from);
    if (fields.includes('attachments')) haystacks.push(email.attachments.join(' '));

    const combined = haystacks.join(' ').toLowerCase();
    if (!keywords.length) return combined.includes(query);
    return keywords.every((term) => combined.includes(term));
  });
};


const handleFiles = async (fileListInput) => {
  const allFiles = Array.from(fileListInput);
  const limitedFiles = allFiles;
  const parsed = [];
  let invalidCount = 0;

  for (const file of limitedFiles) {
    try {
      const buffer = await file.arrayBuffer();
      const valid = isEmlFile(file) || looksLikeEml(buffer);
      if (!valid) {
        invalidCount += 1;
        continue;
      }
      const data = parseEml(buffer);
      const repaired = repairAttachmentData(data.attachmentsData, data.rawText);
      data.attachmentsData = repaired;
      data.attachments = repaired.map((item) => decodeAttachmentName(item.name));
      const forcedName = extractFirstFilenameFromRaw(data.rawText);
      if (forcedName && data.attachmentsData.length === 1) {
        const current = data.attachmentsData[0]?.name || '';
        const looksBroken = /�|Ã.|Â.|â|ê|ë|ì|í|ï/.test(current) || current.endsWith('-');
        if (looksBroken || !current.includes('.')) {
          data.attachmentsData = [{ ...data.attachmentsData[0], name: forcedName }];
          data.attachments = [forcedName];
        }
      }
      parsed.push({
        id: crypto.randomUUID(),
        fileName: file.name,
        size: file.size,
        ...data,
      });
    } catch (error) {
      invalidCount += 1;
    }
  }

  setWarning(invalidCount, allFiles.length);

  if (!parsed.length) {
    state.emails = [];
    state.summaryId = null;
    state.page = 1;
    renderList();
    renderSummary(null);
    return;
  }

  state.emails = parsed;
  state.summaryId = parsed[parsed.length - 1]?.id ?? null;
  state.page = 1;
  renderList();
  renderSummary(state.summaryId);
};


emlInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
  event.target.value = '';
});

dropZone.addEventListener('click', () => emlInput.click());

dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emlInput.click();
  }
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('is-dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('is-dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-dragover');
  if (event.dataTransfer?.files?.length) {
    handleFiles(event.dataTransfer.files);
  }
});

window.emailOrganizerBuild = BUILD_ID;
console.info('[email-organizer] build', BUILD_ID);

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const next = button.dataset.tab;
    if (next && next !== state.mode) {
      setMode(next);
    }
  });
});

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextLang = button.dataset.lang;
    if (nextLang && nextLang !== state.lang) {
      state.lang = nextLang;
      applyTranslations();
    }
  });
});

if (resultButton) {
  resultButton.addEventListener('click', () => {
    if (state.mode === 'gemini') {
      const textarea = document.getElementById('geminiPrompt');
      if (textarea) {
        state.geminiRule = textarea.value;
      }
      if (!state.geminiRule.trim()) {
        const t = translations[state.lang];
        setGeminiStatus(t.geminiRuleRequired);
        resultButton.disabled = true;
        return;
      }
      const t = translations[state.lang];
      try {
        const seed = JSON.stringify({
          prompt: state.geminiRule.trim(),
          matches: [],
          keywords: [],
          reply: t.geminiDefaultReply,
          results: [],
          status: 'pending',
          updatedAt: Date.now(),
        });
        localStorage.setItem(GEMINI_STORAGE_KEY, seed);
        sessionStorage.setItem(GEMINI_STORAGE_KEY, seed);
      } catch (error) {
        // Ignore storage errors.
      }
      persistSnapshots();
      const ruleParam = encodeURIComponent(state.geminiRule.trim());
      window.location.href = `/gemini?rule=${ruleParam}`;
      return;
    }
    state.page = 1;
    renderList();
    persistSnapshots();
    window.location.href = '/eml.html';
  });
}
fieldCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    state.page = 1;
    renderList();
  });
});

setMode(state.mode);
applyTranslations();
setGeminiStatusFromStorage();
