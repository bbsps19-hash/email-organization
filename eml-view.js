const list = document.getElementById('emlList');
const emptyView = document.getElementById('emptyView');
const filterInfo = document.getElementById('filterInfo');
const pagination = document.getElementById('emlPagination');

const state = {
  page: 1,
  pageSize: 100,
};

const categoryLabels = {
  uncategorized: '미분류',
  gemini: 'Gemini',
};

const renderList = (emails) => {
  list.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(emails.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  const paged = emails.slice(start, start + state.pageSize);
  if (!emails.length) {
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

const { emails, filters } = loadData();
if (filters) {
  const parts = [];
  if (filters.mode === 'gemini') {
    parts.push('모드: Gemini');
    if (filters.geminiPrompt) {
      parts.push(`기준: ${filters.geminiPrompt}`);
    }
  } else {
    parts.push('모드: 검색');
    if (filters.query) {
      parts.push(`검색어: ${filters.query}`);
    }
  }
  filterInfo.textContent = parts.length ? `현재 필터: ${parts.join(' / ')}` : '현재 필터 조건에 해당하는 .eml 목록입니다.';
}

renderList(emails);
