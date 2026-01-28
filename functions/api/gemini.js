const jsonResponse = (payload, status = 200) => {
  const body = JSON.stringify(payload);
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

const parseJsonFromText = (text) => {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.response === 'string') {
      const nested = parseJsonFromText(parsed.response);
      return nested || parsed;
    }
    return parsed;
  } catch (error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(text.slice(start, end + 1));
        if (parsed && typeof parsed.response === 'string') {
          const nested = parseJsonFromText(parsed.response);
          return nested || parsed;
        }
        return parsed;
      } catch (innerError) {
        return null;
      }
    }
  }
  return null;
};

const buildPrompt = (prompt, emailsJson) => {
  return [
    'You are a classification assistant.',
    '당신은 이메일 분류 도우미입니다.',
    `Task: Select email ids that match this criteria: "${prompt}".`,
    `기준: "${prompt}" 에 해당하는 이메일 id만 선택하세요.`,
    'Also extract 3-8 concise keywords that summarize the criteria and matches.',
    '조건과 매칭 결과를 요약하는 키워드 3~8개를 추출하세요.',
    'Return only JSON with this shape: {"matches":["id1","id2"],"keywords":["k1","k2"],"notes":"optional"}',
    'JSON만 출력하고 다른 설명/마크다운은 포함하지 마세요.',
    'Emails JSON:',
    emailsJson,
  ].join('\n');
};

const buildEmailPayload = (emails) =>
  emails.map((email) => ({
    id: email.id,
    subject: email.subject || '',
    from: email.from || '',
    snippet: email.snippet || '',
  attachments: Array.isArray(email.attachments) ? email.attachments : [],
  fileName: email.fileName || '',
  body: email.body || '',
}));

export const onRequest = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_SETUP' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { prompt, emails } = payload || {};
  if (!prompt || !Array.isArray(emails)) {
    return jsonResponse({ error: 'Invalid payload' }, 400);
  }

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const emailsJson = JSON.stringify(buildEmailPayload(emails));
  const promptText = buildPrompt(String(prompt), emailsJson);

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let apiResponse;
  try {
    apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
      }),
    });
  } catch (error) {
    return jsonResponse({ error: 'Gemini API unreachable' }, 502);
  }

  let apiData;
  try {
    apiData = await apiResponse.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid Gemini response' }, 502);
  }

  if (!apiResponse.ok) {
    const message = apiData?.error?.message || 'Gemini API error';
    return jsonResponse({ error: message }, apiResponse.status || 500);
  }

  const text = apiData?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || '';
  const parsed = parseJsonFromText(text.trim());
  if (!parsed || !Array.isArray(parsed.matches)) {
    return jsonResponse({
      error: 'Invalid Gemini output',
      raw: text,
    }, 502);
  }

  return jsonResponse({
    matches: parsed.matches,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    notes: parsed.notes || '',
    reply: parsed.reply || parsed.notes || '',
  });
};
