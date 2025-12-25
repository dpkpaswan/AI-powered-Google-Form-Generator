import fs from 'node:fs';
import http from 'node:http';

function parseDotEnv(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

const env = parseDotEnv(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8'));
const apiKey = env.API_KEY;
if (!apiKey) {
  console.error('API_KEY missing in .env');
  process.exit(1);
}

const body = JSON.stringify({
  prompt: 'Create a job application form for a junior frontend developer. Include 8-10 questions.',
  formType: 'application',
  audience: 'candidates',
  language: 'English',
  tone: 'professional'
});

console.log('POST http://127.0.0.1:3000/generate-form');

const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/generate-form',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log(`HTTP ${res.statusCode}`);

      let parsed;
      try {
        parsed = data ? JSON.parse(data) : null;
      } catch {
        parsed = null;
      }

      if (parsed && res.statusCode >= 200 && res.statusCode < 300) {
        const title = parsed.title;
        const description = parsed.description;
        const formId = parsed.formId;
        const formUrl = parsed.formUrl;
        const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

        const missing = [];
        if (!formId) missing.push('formId');
        if (!formUrl) missing.push('formUrl');
        if (!title) missing.push('title');
        if (!description) missing.push('description');
        if (!questions.length) missing.push('questions');

        if (missing.length) {
          console.error('TEST FAILED: missing fields:', missing.join(', '));
          console.log(JSON.stringify(parsed, null, 2));
          process.exit(1);
        }

        console.log('\nCreated Google Form');
        console.log('title:', title);
        console.log('description:', description);
        console.log('formId:', formId);
        console.log('formUrl:', formUrl);
        console.log(`questions: ${questions.length}`);

        const previewCount = Math.min(5, questions.length);
        console.log(`\nFirst ${previewCount} questions:`);
        for (let i = 0; i < previewCount; i += 1) {
          const q = questions[i];
          const qTitle = typeof q === 'string' ? q : q?.title;
          console.log(`- ${i + 1}. ${qTitle || '[missing title]'}`);
        }

        return;
      }

      // Error path (or non-JSON): print raw response.
      console.log(data);
    });
  }
);

req.setTimeout(60000, () => {
  console.error('REQUEST_TIMEOUT after 60s');
  req.destroy(new Error('Request timed out'));
});

req.on('error', (e) => {
  console.error('REQUEST_ERROR');
  console.error('name:', e?.name);
  console.error('code:', e?.code);
  console.error('message:', e?.message);
  if (e?.stack) console.error('stack:', e.stack);
  process.exit(1);
});

req.write(body);
req.end();
