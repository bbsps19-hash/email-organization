const list = document.getElementById('emlList');
const emptyView = document.getElementById('emptyView');
const filterInfo = document.getElementById('filterInfo');
const pagination = document.getElementById('emlPagination');
const specTotal = document.getElementById('emlSpecTotal');
const specQuery = document.getElementById('emlSpecQuery');
const specCount = document.getElementById('emlSpecCount');
const metaSubject = document.getElementById('emlMetaSubject');
const metaFrom = document.getElementById('emlMetaFrom');
const metaTo = document.getElementById('emlMetaTo');
const metaDate = document.getElementById('emlMetaDate');
const metaAttachments = document.getElementById('emlMetaAttachments');
const metaCategory = document.getElementById('emlMetaCategory');
const metaSnippet = document.getElementById('emlMetaSnippet');

const lang = localStorage.getItem('emailOrganizerLang') || 'ko';
const t = {
  ko: {
    empty: '표시할 메일이 없습니다.',
    modeSearch: '모드: 검색',
    modeGemini: '모드: Gemini',
    criteria: '기준',
    query: '검색어',
    defaultInfo: '현재 필터 조건에 해당하는 .eml 목록입니다.',
  },
  en: {
    empty: 'No emails to display.',
    modeSearch: 'Mode: Search',
    modeGemini: 'Mode: Gemini',
    criteria: 'Criteria',
    query: 'Query',
    defaultInfo: 'Showing .eml emails matching the current filter.',
  },
};

const state = {
  page: 1,
  pageSize: 20,
  summaryId: null,
};

const categoryLabels = {
  uncategorized: lang === 'ko' ? '미분류' : 'Uncategorized',
  gemini: 'Gemini',
};

const renderSummary = (emailId) => {
  const email = emails.find((item) => item.id === emailId);
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
  metaCategory.textContent = categoryLabels[email.category] || '-';
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
      <span>${email.attachments?.length ? email.attachments.join(', ') : '-'}</span>
    `;

  const badge = document.createElement('span');
  badge.className = 'file-badge';
  badge.textContent = categoryLabels[email.category] || '-';

    const snippet = document.createElement('p');
    snippet.className = 'snippet';
    snippet.textContent = email.snippet || '-';

    li.append(title, meta, badge, snippet);
    li.addEventListener('click', () => {
      state.summaryId = email.id;
      renderList(emails);
      renderSummary(email.id);
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

const loadData = () => {
  try {
    const filteredRaw = localStorage.getItem('emailOrganizerFiltered');
    if (!filteredRaw) return { emails: [], filters: null };
    const parsed = JSON.parse(filteredRaw);
    return { emails: parsed.emails || [], filters: parsed.filters || null };
  } catch (error) {
    return { emails: [], filters: null };
  }
};

const loadTotal = () => {
  try {
    const snapshotRaw = localStorage.getItem('emailOrganizerSnapshot');
    if (!snapshotRaw) return 0;
    const parsed = JSON.parse(snapshotRaw);
    return Array.isArray(parsed.emails) ? parsed.emails.length : 0;
  } catch (error) {
    return 0;
  }
};

const { emails, filters } = loadData();
const totalCount = loadTotal();
if (specTotal) specTotal.textContent = `${totalCount}개`;
if (specCount) specCount.textContent = `${emails.length}개`;
if (filters) {
  const parts = [];
  if (filters.mode === 'gemini') {
    parts.push(t[lang].modeGemini);
    if (filters.geminiPrompt) {
      parts.push(`${t[lang].criteria}: ${filters.geminiPrompt}`);
      if (specQuery) specQuery.textContent = filters.geminiPrompt;
    }
  } else {
    parts.push(t[lang].modeSearch);
    if (filters.query) {
      parts.push(`${t[lang].query}: ${filters.query}`);
      if (specQuery) specQuery.textContent = filters.query;
    }
  }
  filterInfo.textContent = parts.length ? `${parts.join(' / ')}` : t[lang].defaultInfo;
} else {
  filterInfo.textContent = t[lang].defaultInfo;
}

if (emails.length) state.summaryId = emails[0]?.id ?? null;
renderList(emails);
renderSummary(state.summaryId);
