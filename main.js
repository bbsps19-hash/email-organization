const emlInput = document.getElementById('emlInput');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const emptyState = document.querySelector('.file-empty');
const warning = document.getElementById('warning');
const langButtons = document.querySelectorAll('.lang-btn');

const searchInput = document.getElementById('searchInput');
const fieldCheckboxes = document.querySelectorAll('.field-checkbox');
const pagination = document.getElementById('pagination');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('[data-panel]');
const geminiPrompt = document.getElementById('geminiPrompt');
const geminiRun = document.getElementById('geminiRun');
const geminiStatus = document.getElementById('geminiStatus');

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
  geminiMatches: null,
};

const translations = {
  ko: {
    title: '이메일 정리기',
    subtitle: '.eml 파일을 드래그하거나 선택해 정리 준비를 시작하세요.',
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
    geminiRun: 'Gemini로 분류',
    geminiHint: 'Gemini CLI 연동은 로컬 설정이 필요합니다. 연결되면 자동 분류됩니다.',
    geminiRunning: 'Gemini 분류 중...',
    geminiSuccess: (count) => `Gemini 분류 완료: ${count}개 매칭`,
    geminiError: 'Gemini 서버에 연결할 수 없습니다.',
    geminiSetup: 'Gemini CLI 인증이 필요합니다. 터미널에서 `gemini` 실행 후 인증을 완료하세요.',
    geminiStored: '이전에 실행한 Gemini 결과가 있습니다.',
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
    geminiRun: 'Classify with Gemini',
    geminiHint: 'Gemini CLI requires local setup. Once connected, it will auto-classify.',
    geminiRunning: 'Running Gemini...',
    geminiSuccess: (count) => `Gemini matched ${count} emails.`,
    geminiError: 'Could not reach Gemini server.',
    geminiSetup: 'Gemini CLI needs authentication. Run `gemini` in a terminal to finish setup.',
    geminiStored: 'Saved Gemini results are available.',
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
  value.replace(/(\?=)\s*,\s*(=\?)/g, '$1 $2');

const decodeMimeWords = (value) => {
  if (!value) return '';
  const normalized = normalizeEncodedWordSeparators(value);
  return normalized.replace(/=\?([^?]+)\?([bqBQ])\?([^?]+)\?=/g, (match, charset, enc, text) => {
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
    return decodeBytes(bytes, charset);
  });
};

const decodeAttachmentName = (value) => {
  if (!value) return '';
  let decoded = decodeMimeWords(value).trim();
  for (let i = 0; i < 2; i += 1) {
    if (!/=\?[^?]+\?[bqBQ]\?/.test(decoded)) break;
    decoded = decodeMimeWords(decoded).trim();
  }
  return decoded.replace(/\s{2,}/g, ' ');
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

  langButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === state.lang);
  });

  if (state.warning) {
    setWarning(state.warning.invalidCount, state.warning.total);
  }

  renderList();
  renderSummary(state.summaryId);
  try {
    localStorage.setItem('emailOrganizerLang', state.lang);
  } catch (error) {
    // Ignore storage errors.
  }
};

const setGeminiStatus = (message) => {
  if (!geminiStatus) return;
  geminiStatus.textContent = message || '';
};

const setGeminiStatusFromStorage = () => {
  if (!geminiStatus) return;
  const t = translations[state.lang];
  try {
    const raw = localStorage.getItem('emailOrganizerGemini');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.matches)) return;
    const time = data.updatedAt ? new Date(data.updatedAt) : null;
    const timestamp = time ? time.toLocaleString(state.lang === 'ko' ? 'ko-KR' : 'en-US') : '';
    const message = t.geminiSuccess(data.matches.length);
    const base = timestamp ? `${message} (${timestamp})` : message;
    geminiStatus.textContent = `${base} · ${t.geminiStored}`;
  } catch (error) {
    // Ignore storage errors.
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
  if (!geminiPrompt?.value?.trim()) {
    setGeminiStatus(t.geminiPlaceholder);
    return;
  }
  setGeminiStatus(t.geminiRunning);

  const payload = {
    prompt: geminiPrompt.value.trim(),
    emails: state.emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      snippet: email.snippet,
      attachments: email.attachments,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('http://localhost:8787/classify', {
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
    const ids = Array.isArray(data.matches) ? data.matches : [];
    applyGeminiMatches(ids);
    const payload = {
      prompt: geminiPrompt?.value || '',
      matches: ids,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem('emailOrganizerGemini', JSON.stringify(payload));
    } catch (error) {
      // Ignore storage errors.
    }
    setGeminiStatus(t.geminiSuccess(ids.length));
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
  state.mode = mode;
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== mode;
  });
  state.page = 1;
  refreshCategories();
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
          query: searchInput.value,
          fields: getActiveFields(),
          geminiPrompt: geminiPrompt?.value || '',
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

  paged.forEach((email) => {
    const li = document.createElement('li');
    li.dataset.id = email.id;
    if (email.id === state.summaryId) {
      li.classList.add('is-active');
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
  lines.forEach((line) => {
    if (/^[\t ]/.test(line) && unfolded.length) {
      unfolded[unfolded.length - 1] += ` ${line.trim()}`;
    } else {
      unfolded.push(line.trim());
    }
  });

  const headers = {};
  unfolded.forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).toLowerCase();
    const value = decodeMimeWords(line.slice(idx + 1).trim());
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;
  });
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

const extractFilenameFromHeaders = (headers) => {
  const disposition = headers['content-disposition'] || '';
  const type = headers['content-type'] || '';
  const dispositionParams = parseHeaderParams(disposition).params;
  const typeParams = parseHeaderParams(type).params;
  const raw =
    dispositionParams.filename ||
    dispositionParams['filename*'] ||
    typeParams.name ||
    typeParams['name*'];
  if (!raw) return '';
  return decodeMimeWords(decodeRfc2231(raw)).trim();
};

const extractAttachments = (text) => {
  const names = new Set();
  const filenameRegex = /filename\\*?=\\??\"?([^\";\\r\\n]+)/gi;
  const nameRegex = /name\\*?=\\??\"?([^\";\\r\\n]+)/gi;
  let match = filenameRegex.exec(text);
  while (match) {
    names.add(decodeMimeWords(decodeRfc2231(match[1].trim())));
    match = filenameRegex.exec(text);
  }
  match = nameRegex.exec(text);
  while (match) {
    names.add(decodeMimeWords(decodeRfc2231(match[1].trim())));
    match = nameRegex.exec(text);
  }
  return Array.from(names).filter(Boolean);
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
  const email = state.emails.find((item) => item.id === id);
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
  const subject = headers.subject || '';
  const from = headers.from || '';
  const to = headers.to || '';
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
  const attachments = attachmentsData.map((item) => decodeAttachmentName(item.name));
  const category = classify(subject, body, attachments);

  return { subject, from, to, date, body, snippet, attachments, attachmentsData, category };
};

const getActiveFields = () => {
  const activePanel = document.querySelector('[data-panel]:not([hidden])');
  const scope = activePanel ? activePanel.querySelectorAll('.field-checkbox') : fieldCheckboxes;
  return Array.from(scope)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
};

const getFilteredEmails = () => {
  const query = searchInput.value.trim().toLowerCase();
  const keywords = query
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
  const fields = getActiveFields();

  return state.emails.filter((email) => {
    if (state.mode === 'gemini') {
      if (!state.geminiMatches) return false;
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

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const next = button.dataset.tab;
    if (next && next !== state.mode) {
      setMode(next);
    }
  });
});

if (geminiRun) {
  geminiRun.addEventListener('click', () => {
    if (state.mode !== 'gemini') {
      setMode('gemini');
    }
    runGeminiClassification();
  });
}

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextLang = button.dataset.lang;
    if (nextLang && nextLang !== state.lang) {
      state.lang = nextLang;
      applyTranslations();
    }
  });
});

searchInput.addEventListener('input', () => {
  state.page = 1;
  renderList();
});
fieldCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    state.page = 1;
    renderList();
  });
});

setMode(state.mode);
applyTranslations();
setGeminiStatusFromStorage();
