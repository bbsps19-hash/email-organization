const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.GEMINI_PORT || 8787;

const jsonResponse = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
};

const parseJsonFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (innerError) {
        return null;
      }
    }
  }
  return null;
};

const buildPrompt = (prompt, emails) => {
  const payload = emails.map((email) => ({
    id: email.id,
    subject: email.subject || '',
    from: email.from || '',
    snippet: email.snippet || '',
    attachments: email.attachments || [],
  }));

  return [
    'You are a classification assistant.',
    '당신은 이메일 분류 도우미입니다.',
    `Task: Select email ids that match this criteria: "${prompt}".`,
    `기준: "${prompt}" 에 해당하는 이메일 id만 선택하세요.`,
    'Also extract 3-8 concise keywords that summarize the criteria and matches.',
    '조건과 매칭 결과를 요약하는 키워드 3~8개를 추출하세요.',
    'Return only JSON with this shape: {"matches":["id1","id2"],"keywords":["k1","k2"],"notes":"optional"}',
    'JSON만 출력하고 다른 설명/마크다운은 포함하지 마세요.',
    'Use only the provided email data. No extra commentary.',
    'Emails:',
    JSON.stringify(payload),
  ].join('\n');
};

const runGemini = (prompt, emails) =>
  new Promise((resolve, reject) => {
    const args = ['--output-format', 'json', '--prompt', buildPrompt(prompt, emails)];
    const child = spawn('gemini', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    const killTimer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('GEMINI_TIMEOUT'));
    }, 15000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8');
    });

    child.on('error', (error) => {
      clearTimeout(killTimer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(killTimer);
      if (code !== 0) {
        const msg = stderr || `Gemini exited with code ${code}`;
        if (msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('login')) {
          reject(new Error('GEMINI_SETUP'));
        } else {
          reject(new Error(msg));
        }
        return;
      }
      const parsed = parseJsonFromText(stdout.trim());
      if (!parsed || !Array.isArray(parsed.matches)) {
        reject(new Error('Invalid Gemini response'));
        return;
      }
      resolve(parsed);
    });
  });

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/classify') {
    jsonResponse(res, 404, { error: 'Not found' });
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString('utf-8');
  });

  req.on('end', async () => {
    try {
      const payload = JSON.parse(body);
      const { prompt, emails } = payload;
      if (!prompt || !Array.isArray(emails)) {
        jsonResponse(res, 400, { error: 'Invalid payload' });
        return;
      }
      const result = await runGemini(prompt, emails);
      jsonResponse(res, 200, result);
    } catch (error) {
      jsonResponse(res, 500, { error: error.message });
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Gemini bridge listening on http://localhost:${PORT}`);
});
