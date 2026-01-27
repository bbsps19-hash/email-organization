const list = document.getElementById('emlList');
const emptyView = document.getElementById('emptyView');
const filterInfo = document.getElementById('filterInfo');

const categoryLabels = {
  work: '업무',
  finance: '결제/영수증',
  marketing: '프로모션',
  security: '보안/계정',
  personal: '개인',
};

const renderList = (emails) => {
  list.innerHTML = '';
  if (!emails.length) {
    emptyView.hidden = false;
    list.hidden = true;
    return;
  }

  emptyView.hidden = true;
  list.hidden = false;
  emails.forEach((email) => {
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
  if (filters.category && filters.category !== 'all') {
    parts.push(`카테고리: ${categoryLabels[filters.category] || filters.category}`);
  }
  if (filters.query) {
    parts.push(`검색어: ${filters.query}`);
  }
  filterInfo.textContent = parts.length ? `현재 필터: ${parts.join(' / ')}` : '현재 필터 조건에 해당하는 .eml 목록입니다.';
}

renderList(emails);
