const emlInput = document.getElementById('emlInput');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const emptyState = document.querySelector('.file-empty');
const warning = document.getElementById('warning');
const langButtons = document.querySelectorAll('.lang-btn');

const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const fieldCheckboxes = document.querySelectorAll('.field-checkbox');
const ruleInputs = document.querySelectorAll('[data-rule]');

const metaSubject = document.getElementById('metaSubject');
const metaFrom = document.getElementById('metaFrom');
const metaTo = document.getElementById('metaTo');
const metaDate = document.getElementById('metaDate');
const metaAttachments = document.getElementById('metaAttachments');
const metaCategory = document.getElementById('metaCategory');
const metaSnippet = document.getElementById('metaSnippet');

const state = {
  lang: 'ko',
  summaryId: null,
  warning: null,
  emails: [],
  rules: {
    work: ['meeting', 'project', 'deadline', 'report', 'proposal', 'client', '회의', '프로젝트', '마감', '보고', '업무'],
    finance: ['invoice', 'receipt', 'payment', 'order', 'refund', 'billing', '결제', '영수증', '청구', '주문', '환불'],
    marketing: ['sale', 'discount', 'promo', 'newsletter', 'subscribe', 'unsubscribe', '광고', '할인', '프로모션', '뉴스레터'],
    security: ['password', 'verification', 'security', 'alert', 'otp', '보안', '인증', '확인 코드', '로그인'],
    personal: ['family', 'friend', 'party', 'invitation', 'personal', '가족', '친구', '모임', '초대'],
  },
};

const translations = {
  ko: {
    title: '이메일 정리기',
    subtitle: '.eml 파일을 드래그하거나 선택해 정리 준비를 시작하세요.',
    uploadTitle: '.eml 가져오기',
    uploadHint: '메시지 원본(.eml)만 업로드됩니다. 최대 10개까지 선택 가능.',
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
    filterTitle: '필터 & 분류 규칙',
    filterHint: '분류 기준을 수정하고, 조건에 맞는 메일만 확인하세요.',
    filterCategory: '카테고리',
    filterAll: '전체',
    filterSearch: '검색',
    filterPlaceholder: '제목, 본문, 발신자, 첨부파일명',
    fieldSubject: '제목',
    fieldBody: '본문',
    fieldFrom: '발신자',
    fieldAttachments: '첨부파일명',
    ruleTitle: '키워드 규칙',
    ruleHint: '쉼표로 키워드를 구분하세요. 수정하면 자동 분류가 갱신됩니다.',
    categoryWork: '업무',
    categoryFinance: '결제/영수증',
    categoryMarketing: '프로모션',
    categorySecurity: '보안/계정',
    categoryPersonal: '개인',
    dropAria: '.eml 파일을 여기로 드롭하세요',
    warningInvalid: (count) => `.eml이 아닌 파일 ${count}개는 제외되었습니다.`,
    warningNone: '선택한 파일 중 .eml 형식이 없습니다.',
  },
  en: {
    title: 'Email Organizer',
    subtitle: 'Drag and drop .eml files or select them to start organizing.',
    uploadTitle: 'Import .eml',
    uploadHint: 'Only raw .eml messages are accepted. Up to 10 files.',
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
    filterTitle: 'Filters & Rules',
    filterHint: 'Edit classification rules and show only matching emails.',
    filterCategory: 'Category',
    filterAll: 'All',
    filterSearch: 'Search',
    filterPlaceholder: 'Subject, body, sender, attachment name',
    fieldSubject: 'Subject',
    fieldBody: 'Body',
    fieldFrom: 'Sender',
    fieldAttachments: 'Attachments',
    ruleTitle: 'Keyword Rules',
    ruleHint: 'Separate keywords with commas. Updates classification automatically.',
    categoryWork: 'Work',
    categoryFinance: 'Payments/Receipts',
    categoryMarketing: 'Promotion',
    categorySecurity: 'Security/Account',
    categoryPersonal: 'Personal',
    dropAria: 'Drop .eml files here',
    warningInvalid: (count) => `Excluded ${count} non-.eml file(s).`,
    warningNone: 'No valid .eml files were selected.',
  },
};

const categoryLabels = {
  work: { ko: '업무', en: 'Work' },
  finance: { ko: '결제/영수증', en: 'Payments/Receipts' },
  marketing: { ko: '프로모션', en: 'Promotion' },
  security: { ko: '보안/계정', en: 'Security/Account' },
  personal: { ko: '개인', en: 'Personal' },
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
};

const renderList = () => {
  const filtered = getFilteredEmails();
  fileList.innerHTML = '';

  if (!filtered.length) {
    emptyState.textContent = state.emails.length ? translations[state.lang].emptyFiltered : translations[state.lang].empty;
    emptyState.hidden = false;
    fileList.hidden = true;
    return;
  }

  emptyState.hidden = true;
  fileList.hidden = false;

  filtered.forEach((email) => {
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
    const value = line.slice(idx + 1).trim();
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;
  });
  return headers;
};

const cleanBody = (body) => {
  const withoutHtml = body.replace(/<[^>]+>/g, ' ');
  return withoutHtml.replace(/\s+/g, ' ').trim();
};

const extractAttachments = (text) => {
  const names = new Set();
  const filenameRegex = /filename\\*?=\\??\"?([^\";\\r\\n]+)/gi;
  const nameRegex = /name\\*?=\\??\"?([^\";\\r\\n]+)/gi;
  let match = filenameRegex.exec(text);
  while (match) {
    names.add(match[1].trim());
    match = filenameRegex.exec(text);
  }
  match = nameRegex.exec(text);
  while (match) {
    names.add(match[1].trim());
    match = nameRegex.exec(text);
  }
  return Array.from(names).filter(Boolean);
};

const classify = (subject, body, attachments) => {
  const text = `${subject} ${body} ${attachments.join(' ')}`.toLowerCase();
  let best = { key: 'personal', score: 0 };

  Object.entries(state.rules).forEach(([key, terms]) => {
    const score = terms.reduce((acc, term) => acc + (text.includes(term.toLowerCase()) ? 1 : 0), 0);
    if (score > best.score) {
      best = { key, score };
    }
  });

  return best.key;
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
    return;
  }

  const label = categoryLabels[email.category]?.[state.lang] ?? '-';
  metaSubject.textContent = email.subject || '-';
  metaFrom.textContent = email.from || '-';
  metaTo.textContent = email.to || '-';
  metaDate.textContent = email.date || '-';
  metaAttachments.textContent = email.attachments.length ? email.attachments.join(', ') : '-';
  metaCategory.textContent = label;
  metaSnippet.textContent = email.snippet || '-';
};

const parseEml = (text) => {
  const [rawHeaders = '', rawBody = ''] = text.split(/\\r?\\n\\r?\\n/);
  const headers = parseHeaders(rawHeaders);
  const subject = headers.subject || '';
  const from = headers.from || '';
  const to = headers.to || '';
  const date = headers.date || '';
  const attachments = extractAttachments(text);
  const body = cleanBody(rawBody);
  const snippet = body.slice(0, 200);
  const category = classify(subject, body, attachments);

  return { subject, from, to, date, body, snippet, attachments, category };
};

const getActiveFields = () =>
  Array.from(fieldCheckboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

const getFilteredEmails = () => {
  const category = categoryFilter.value;
  const query = searchInput.value.trim().toLowerCase();
  const fields = getActiveFields();

  return state.emails.filter((email) => {
    if (category !== 'all' && email.category !== category) {
      return false;
    }
    if (!query) return true;
    if (!fields.length) return false;

    const haystacks = [];
    if (fields.includes('subject')) haystacks.push(email.subject);
    if (fields.includes('body')) haystacks.push(email.body);
    if (fields.includes('from')) haystacks.push(email.from);
    if (fields.includes('attachments')) haystacks.push(email.attachments.join(' '));

    return haystacks.some((text) => (text || '').toLowerCase().includes(query));
  });
};

const updateRulesFromInputs = () => {
  ruleInputs.forEach((input) => {
    const key = input.dataset.rule;
    if (!key) return;
    const terms = input.value
      .split(',')
      .map((term) => term.trim())
      .filter(Boolean);
    state.rules[key] = terms.length ? terms : [];
  });
};

const refreshClassifications = () => {
  state.emails = state.emails.map((email) => ({
    ...email,
    category: classify(email.subject, email.body, email.attachments),
  }));
  renderList();
  renderSummary(state.summaryId);
};

const handleFiles = async (fileListInput) => {
  const allFiles = Array.from(fileListInput);
  const validFiles = allFiles.filter(isEmlFile).slice(0, 10);
  const invalidCount = allFiles.length - validFiles.length;

  setWarning(invalidCount, allFiles.length);

  if (!validFiles.length) {
    state.emails = [];
    state.summaryId = null;
    renderList();
    renderSummary(null);
    return;
  }

  const parsed = await Promise.all(
    validFiles.map(async (file) => {
      const content = await file.text();
      const data = parseEml(content);
      return {
        id: crypto.randomUUID(),
        fileName: file.name,
        size: file.size,
        ...data,
      };
    })
  );

  state.emails = parsed;
  state.summaryId = parsed[parsed.length - 1]?.id ?? null;
  renderList();
  renderSummary(state.summaryId);
};

const setupRuleInputs = () => {
  ruleInputs.forEach((input) => {
    const key = input.dataset.rule;
    if (!key) return;
    input.value = state.rules[key].join(', ');
  });
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

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextLang = button.dataset.lang;
    if (nextLang && nextLang !== state.lang) {
      state.lang = nextLang;
      applyTranslations();
    }
  });
});

categoryFilter.addEventListener('change', renderList);
searchInput.addEventListener('input', renderList);
fieldCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', renderList);
});

ruleInputs.forEach((input) => {
  input.addEventListener('input', () => {
    updateRulesFromInputs();
    refreshClassifications();
  });
});

setupRuleInputs();
applyTranslations();
