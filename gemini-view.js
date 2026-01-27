const list = document.getElementById('geminiList');
const emptyView = document.getElementById('emptyGemini');
const pagination = document.getElementById('geminiPagination');
const summary = document.getElementById('geminiSummary');
const userBubble = document.getElementById('geminiUser');
const assistantBubble = document.getElementById('geminiAssistant');
const summary = document.getElementById('geminiSummary');

const lang = localStorage.getItem('emailOrganizerLang') || 'ko';
const t = {
  ko: {
    empty: '표시할 메일이 없습니다.',
    summary: '요청한 기준에 맞는 메일을 모두 표시합니다.',
    fallbackUser: '요청한 기준이 없습니다.',
    fallbackAssistant: '요청하신 기준으로 메일을 분류해드리겠습니다.',
  },
  en: {
    empty: 'No emails to display.',
    summary: 'Showing all emails that match your criteria.',
    fallbackUser: 'No criteria provided.',
    fallbackAssistant: 'I will classify emails based on your criteria.',
  },
};

const categoryLabels = {
  uncategorized: lang === 'ko' ? '미분류' : 'Uncategorized',
  gemini: 'Gemini',
};

const state = {
  page: 1,
  pageSize: 100,
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
    badge.textContent = categoryLabels[email.category] || 'Gemini';

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

const loadGeminiData = () => {
  try {
    const raw = localStorage.getItem('emailOrganizerGemini');
    const snapshotRaw = localStorage.getItem('emailOrganizerSnapshot');
    if (!raw || !snapshotRaw) return { matches: [], prompt: '', reply: '', emails: [] };
    const gemini = JSON.parse(raw);
    const snapshot = JSON.parse(snapshotRaw);
    const matches = Array.isArray(gemini.matches) ? gemini.matches : [];
    const emails = Array.isArray(snapshot.emails) ? snapshot.emails : [];
    const selected = emails.filter((email) => matches.includes(email.id));
    return {
      matches,
      prompt: gemini.prompt || '',
      reply: gemini.reply || '',
      keywords: Array.isArray(gemini.keywords) ? gemini.keywords : [],
      emails: selected,
    };
  } catch (error) {
    return { matches: [], prompt: '', reply: '', emails: [] };
  }
};

const data = loadGeminiData();
summary.textContent = t[lang].summary;
userBubble.textContent = data.prompt || t[lang].fallbackUser;
assistantBubble.textContent = data.reply || t[lang].fallbackAssistant;
if (data.keywords && data.keywords.length) {
  const label = lang === 'ko' ? '키워드' : 'Keywords';
  assistantBubble.textContent += `\n${label}: ${data.keywords.join(', ')}`;
}

renderList(data.emails);
