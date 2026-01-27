const list = document.getElementById('geminiList');
const emptyView = document.getElementById('emptyGemini');
const pagination = document.getElementById('geminiPagination');
const summary = document.getElementById('geminiSummary');
const userBubble = document.getElementById('geminiUser');
const assistantBubble = document.getElementById('geminiAssistant');

const lang = localStorage.getItem('emailOrganizerLang') || 'ko';
const t = {
  ko: {
    empty: '표시할 메일이 없습니다.',
    summary: '요청한 기준에 맞는 메일을 모두 표시합니다.',
    fallbackUser: '요청한 기준이 없습니다.',
    fallbackAssistant: '요청하신 기준으로 메일을 분류해드리겠습니다.',
    running: 'Gemini 분류 중...',
    error: 'Gemini 분류에 실패했습니다.',
  },
  en: {
    empty: 'No emails to display.',
    summary: 'Showing all emails that match your criteria.',
    fallbackUser: 'No criteria provided.',
    fallbackAssistant: 'I will classify emails based on your criteria.',
    running: 'Running Gemini...',
    error: 'Gemini classification failed.',
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
    const raw =
      localStorage.getItem('emailOrganizerGeminiPayload') ||
      sessionStorage.getItem('emailOrganizerGeminiPayload') ||
      localStorage.getItem('emailOrganizerGemini') ||
      sessionStorage.getItem('emailOrganizerGemini');
    const snapshotRaw = localStorage.getItem('emailOrganizerSnapshot');
    const params = new URLSearchParams(window.location.search);
    const paramRule = params.get('rule') || '';
    if (!raw) {
      return { matches: [], prompt: paramRule, reply: '', keywords: [], emails: [] };
    }
    const gemini = JSON.parse(raw);
    const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : { emails: [] };
    const matches = Array.isArray(gemini.matches) ? gemini.matches : [];
    const emails = Array.isArray(snapshot.emails) ? snapshot.emails : [];
    const selected = Array.isArray(gemini.results) && gemini.results.length
      ? gemini.results
      : emails.filter((email) => matches.includes(email.id));
    return {
      matches,
      prompt: gemini.prompt || paramRule || '',
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
      attachments: email.attachments,
    })),
  };
  const response = await fetch('http://localhost:8787/classify', {
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
  renderList(data.emails || []);
};

const snapshotRaw = localStorage.getItem('emailOrganizerSnapshot');
const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : { emails: [] };
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
    .catch(() => {
      assistantBubble.textContent = t[lang].error;
    });
}
