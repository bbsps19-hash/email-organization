const list = document.getElementById('geminiList');
const emptyView = document.getElementById('emptyGemini');
const pagination = document.getElementById('geminiPagination');
const summary = document.getElementById('geminiSummary');
const userBubble = document.getElementById('geminiUser');
const assistantBubble = document.getElementById('geminiAssistant');
const metaSubject = document.getElementById('geminiMetaSubject');
const metaFrom = document.getElementById('geminiMetaFrom');
const metaTo = document.getElementById('geminiMetaTo');
const metaDate = document.getElementById('geminiMetaDate');
const metaAttachments = document.getElementById('geminiMetaAttachments');
const metaCategory = document.getElementById('geminiMetaCategory');
const metaSnippet = document.getElementById('geminiMetaSnippet');

const lang = localStorage.getItem('emailOrganizerLang') || 'ko';
const t = {
  ko: {
    empty: '표시할 메일이 없습니다.',
    summary: '요청한 기준에 맞는 메일을 모두 표시합니다.',
    fallbackUser: '요청한 기준이 없습니다.',
    fallbackAssistant: '요청하신 기준으로 메일을 분류해드리겠습니다.',
    running: 'Gemini 분류 중...',
    error: 'Gemini 분류에 실패했습니다.',
    connectError: 'Gemini API에 연결할 수 없습니다. Cloudflare Pages 환경 변수(GEMINI_API_KEY)를 확인하세요.',
    setupError: 'Gemini API 키가 필요합니다. Cloudflare Pages 환경 변수(GEMINI_API_KEY)를 설정하세요.',
  },
  en: {
    empty: 'No emails to display.',
    summary: 'Showing all emails that match your criteria.',
    fallbackUser: 'No criteria provided.',
    fallbackAssistant: 'I will classify emails based on your criteria.',
    running: 'Running Gemini...',
    error: 'Gemini classification failed.',
    connectError: 'Cannot reach the Gemini API. Check the Cloudflare Pages GEMINI_API_KEY setting.',
    setupError: 'Gemini API key is required. Set GEMINI_API_KEY in Cloudflare Pages.',
  },
};

const categoryLabels = {
  uncategorized: lang === 'ko' ? '미분류' : 'Uncategorized',
  gemini: 'Gemini',
};

const state = {
  page: 1,
  pageSize: 100,
  summaryId: null,
  emails: [],
};

const DEBUG =
  window.location.hostname === 'localhost' ||
  window.location.search.includes('debug=1') ||
  window.location.search.includes('debug=true');

const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const STOPWORDS = new Set([
  '관련',
  '요청',
  '목록',
  '리스트',
  '리스트업',
  '리스트업해줘',
  '해줘',
  '해주세요',
  '부탁',
  'please',
  'list',
]);

const extractTerms = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const chunks = normalized.split(/[,\n]/).flatMap((part) => part.split(/\s+/));
  return Array.from(
    new Set(
      chunks
        .map((term) => term.replace(/[^\p{L}\p{N}&.\-]/gu, ''))
        .filter((term) => term && term.length >= 2 && !STOPWORDS.has(term))
    )
  );
};

const matchesTerms = (haystack, terms, minHits = 1) => {
  if (!terms.length) return true;
  const hits = terms.filter((term) => haystack.includes(term));
  return hits.length >= minHits;
};

const loadSnapshotEmails = () => {
  try {
    const snapshotRaw = localStorage.getItem('emailOrganizerSnapshot');
    const filteredRaw = localStorage.getItem('emailOrganizerFiltered');
    const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : null;
    if (snapshot && Array.isArray(snapshot.emails) && snapshot.emails.length) {
      return snapshot.emails;
    }
    const filtered = filteredRaw ? JSON.parse(filteredRaw) : null;
    if (filtered && Array.isArray(filtered.emails) && filtered.emails.length) {
      return filtered.emails;
    }
  } catch (error) {
    // ignore storage errors
  }
  return [];
};

const filterEmailsByCriteria = (emails, prompt, keywords = []) => {
  const keywordTerms = keywords.map(normalizeText).filter(Boolean);
  const promptTerms = extractTerms(prompt);
  const terms = Array.from(new Set([...promptTerms, ...keywordTerms]));
  const minHits = 1;
  const results = emails.filter((email) => {
    const haystack = normalizeText(
      [
        email.subject,
        email.body,
        email.snippet,
        email.fileName,
        email.from,
        email.to,
        Array.isArray(email.attachments) ? email.attachments.join(' ') : '',
      ].join(' ')
    );
    return matchesTerms(haystack, terms, minHits);
  });
  if (DEBUG) {
    console.log('[gemini][filter] prompt', prompt);
    console.log('[gemini][filter] terms', terms);
    console.log('[gemini][filter] minHits', minHits);
    console.log('[gemini][filter] total emails', emails.length);
    console.log('[gemini][filter] matched emails', results.length);
  }
  return { results, terms };
};

const formatSize = (size) => {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const display = value >= 100 ? Math.round(value) : value.toFixed(1);
  return `${display} ${units[unitIndex]}`;
};

const renderSummary = (emailId) => {
  const email = state.emails.find((item) => item.id === emailId);
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
  metaSubject.textContent = email.subject || email.fileName || '-';
  metaFrom.textContent = email.from || '-';
  metaTo.textContent = email.to || '-';
  metaDate.textContent = email.date || '-';
  metaAttachments.textContent = email.attachments?.length ? email.attachments.join(', ') : '-';
  metaCategory.textContent = categoryLabels[email.category] || 'Gemini';
  metaSnippet.textContent = email.snippet || '-';
};

const renderList = (emails) => {
  list.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(emails.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  const paged = emails.slice(start, start + state.pageSize);
  if (!emails.length) {
    emptyView.textContent = t[lang].empty;
    emptyView.hidden = false;
    list.hidden = true;
    pagination.hidden = true;
    pagination.innerHTML = '';
    renderSummary(null);
    return;
  }

  emptyView.hidden = true;
  list.hidden = false;
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

    const badge = document.createElement('span');
    badge.className = 'file-badge';
    badge.textContent = categoryLabels[email.category] || 'Gemini';

    li.append(title, meta, badge);
    li.addEventListener('click', () => {
      state.summaryId = email.id;
      renderSummary(email.id);
      renderList(state.emails);
    });
    list.appendChild(li);
  });

  renderPagination(totalPages, emails);
};

const renderPagination = (totalPages, emails) => {
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
      renderList(emails);
    });
    pagination.appendChild(button);
  }
};

const loadGeminiData = () => {
  try {
    const raw =
      localStorage.getItem('emailOrganizerGeminiPayload') ||
      sessionStorage.getItem('emailOrganizerGeminiPayload') ||
      localStorage.getItem('emailOrganizerGemini') ||
      sessionStorage.getItem('emailOrganizerGemini');
    const params = new URLSearchParams(window.location.search);
    const paramRule = params.get('rule') || '';
    const normalizedRule = paramRule.trim();
    if (!raw) {
      return {
        matches: [],
        prompt: normalizedRule,
        reply: '',
        keywords: [],
        emails: [],
        status: normalizedRule ? 'pending' : 'done',
      };
    }
    const gemini = JSON.parse(raw);
    if (normalizedRule && gemini.prompt && gemini.prompt.trim() !== normalizedRule) {
      return {
        matches: [],
        prompt: normalizedRule,
        reply: '',
        keywords: [],
        emails: [],
        status: 'pending',
      };
    }
    const snapshot = { emails: loadSnapshotEmails() };
    const matches = Array.isArray(gemini.matches) ? gemini.matches : [];
    const emails = Array.isArray(snapshot.emails) ? snapshot.emails : [];
    let selected = Array.isArray(gemini.results) && gemini.results.length
      ? gemini.results
      : emails.filter((email) => matches.includes(email.id));
    let appliedTerms = [];
    if (!selected.length && (gemini.prompt || normalizedRule)) {
      const fallback = filterEmailsByCriteria(
        emails,
        gemini.prompt || normalizedRule,
        Array.isArray(gemini.keywords) ? gemini.keywords : []
      );
      selected = fallback.results;
      appliedTerms = fallback.terms;
    }
    if (DEBUG) {
      console.log('[gemini] snapshot emails', emails.length);
      console.log('[gemini] matches from api', matches.length);
      console.log('[gemini] selected emails', selected.length);
      if (appliedTerms.length) console.log('[gemini] applied fallback terms', appliedTerms);
      if (!emails.length) {
        console.warn('[gemini] no snapshot emails loaded; check emailOrganizerSnapshot storage');
      }
    }
    return {
      matches,
      prompt: gemini.prompt || normalizedRule || '',
      reply: gemini.reply || '',
      keywords: Array.isArray(gemini.keywords) ? gemini.keywords : [],
      status: gemini.status || 'done',
      emails: selected,
    };
  } catch (error) {
    return { matches: [], prompt: '', reply: '', emails: [] };
  }
};

const callGemini = async (prompt, emails) => {
  const payload = {
    prompt,
    emails: emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      snippet: email.snippet,
      body: email.body,
      fileName: email.fileName,
      attachments: email.attachments,
    })),
  };
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Gemini error');
  return data;
};

const renderAll = (data) => {
  summary.textContent = t[lang].summary;
  userBubble.textContent = data.prompt || t[lang].fallbackUser;
  assistantBubble.textContent = data.reply || t[lang].fallbackAssistant;
  if (data.keywords && data.keywords.length) {
    const label = lang === 'ko' ? '키워드' : 'Keywords';
    assistantBubble.textContent += `\n${label}: ${data.keywords.join(', ')}`;
  }
  state.emails = data.emails || [];
  if (!state.emails.find((email) => email.id === state.summaryId)) {
    state.summaryId = state.emails.length ? state.emails[0].id : null;
  }
  renderList(state.emails);
  renderSummary(state.summaryId);
};

const snapshot = { emails: loadSnapshotEmails() };
const baseData = loadGeminiData();
console.log('[gemini] loaded', baseData);
renderAll(baseData);

const shouldRunGemini = baseData.prompt && (baseData.status === 'pending' || (baseData.matches || []).length === 0);
if (shouldRunGemini) {
  assistantBubble.textContent = t[lang].running;
  callGemini(baseData.prompt, snapshot.emails || [])
    .then((data) => {
      const ids = Array.isArray(data.matches) ? data.matches : [];
      const keywords = Array.isArray(data.keywords) ? data.keywords : [];
      const results = (snapshot.emails || []).filter((email) => ids.includes(email.id));
      const payload = {
        prompt: baseData.prompt,
        matches: ids,
        keywords,
        reply: data.reply || data.notes || t[lang].fallbackAssistant,
        results,
        status: 'done',
        updatedAt: Date.now(),
      };
      localStorage.setItem('emailOrganizerGeminiPayload', JSON.stringify(payload));
      sessionStorage.setItem('emailOrganizerGeminiPayload', JSON.stringify(payload));
      renderAll(payload);
    })
    .catch((error) => {
      const message = String(error?.message || '');
      if (message.includes('GEMINI_SETUP')) {
        assistantBubble.textContent = t[lang].setupError;
      } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        assistantBubble.textContent = t[lang].connectError;
      } else {
        assistantBubble.textContent = t[lang].error;
      }
    });
}
