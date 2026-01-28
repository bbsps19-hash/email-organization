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

const filterEmailsByCriteria = (emails, prompt, keywords = []) => {
  const keywordTerms = keywords.map(normalizeText).filter(Boolean);
  const promptTerms = extractTerms(prompt);
  const terms = Array.from(new Set([...promptTerms, ...keywordTerms]));
  const minHits = keywordTerms.length ? Math.min(2, keywordTerms.length) : 1;
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
    return matchesTerms(haystack, terms, minHits);
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
