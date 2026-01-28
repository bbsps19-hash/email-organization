const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const extractTerms = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const chunks = normalized.split(/[,\n]/).flatMap((part) => part.split(/\s+/));
  return Array.from(new Set(chunks.filter(Boolean)));
};

const matchesTerms = (haystack, terms) => {
  if (!terms.length) return true;
  const hits = terms.filter((term) => haystack.includes(term));
  if (terms.length <= 3) return hits.length === terms.length;
  return hits.length >= 2;
};

const filterEmailsByCriteria = (emails, prompt, keywords = []) => {
  const terms = Array.from(new Set([...extractTerms(prompt), ...keywords.map(normalizeText)].filter(Boolean)));
  return emails.filter((email) => {
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
    return matchesTerms(haystack, terms);
  });
};

const emails = [
  {
    id: '1',
    subject: '미수라타 프로젝트 업데이트',
    body: '리비아 Misurata 관련 Fast Track 자료 첨부',
    snippet: 'Fast Track 관련',
    fileName: 'report.eml',
    attachments: ['P&ID.pdf'],
  },
  {
    id: '2',
    subject: '견적 요청',
    body: '도면 요청드립니다',
    snippet: '도면 요청',
    fileName: 'quote.eml',
    attachments: [],
  },
];

const result = filterEmailsByCriteria(emails, '미수라타 관련 리스트업해줘', [
  '미수라타',
  '리비아',
  'Fast Track',
  'P&ID',
]);

if (result.length !== 1 || result[0].id !== '1') {
  console.error('Filter test failed:', result);
  process.exit(1);
}

console.log('Filter test passed.');
