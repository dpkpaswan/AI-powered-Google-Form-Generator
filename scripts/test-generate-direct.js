import 'dotenv/config';
import http from 'node:http';
import { google } from 'googleapis';
import { createApp } from '../src/app.js';

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  return v;
}

async function requestJson({ port, path, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function getItemKind(item) {
  const q = item?.questionItem?.question;
  if (!q) return 'unknown';

  if (q.choiceQuestion?.type) return `choice:${q.choiceQuestion.type}`;
  if (q.textQuestion) return q.textQuestion.paragraph ? 'text:paragraph' : 'text:short';
  if (q.scaleQuestion) return 'scale';
  if (q.dateQuestion) return 'date';
  if (q.timeQuestion) return 'time';
  return 'unknown';
}

function getTopLevelItemKind(item) {
  if (item?.pageBreakItem) return 'pageBreak';
  if (item?.textItem) return 'textItem';
  if (item?.questionItem) return `question:${getItemKind(item)}`;
  if (item?.questionGroupItem) return 'questionGroup';
  if (item?.imageItem) return 'image';
  if (item?.videoItem) return 'video';
  return 'unknown';
}

async function verifyGoogleFormHasQuestions(formId) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || undefined;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('Skipping Google form verification (missing OAuth env vars).');
    return;
  }

  const scopes = ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/drive'];
  const oauth2 = new google.auth.OAuth2({ clientId, clientSecret, redirectUri });
  oauth2.setCredentials({ refresh_token: refreshToken, scope: scopes.join(' ') });

  const forms = google.forms({ version: 'v1', auth: oauth2 });
  const got = await forms.forms.get({ formId });
  const items = got?.data?.items ?? [];

  console.log(`Google Form items created: ${items.length}`);
  const kinds = items.map(getTopLevelItemKind);
  console.log('Item kinds:', kinds.slice(0, 30));

  const hasMcq = kinds.some((k) => k === 'question:choice:RADIO');
  const hasCheckbox = kinds.some((k) => k === 'question:choice:CHECKBOX');
  const hasDropdown = kinds.some((k) => k === 'question:choice:DROP_DOWN');
  const hasSections = kinds.some((k) => k === 'pageBreak' || k === 'textItem');
  console.log(`Has MCQ (RADIO): ${hasMcq}`);
  console.log(`Has Checkboxes: ${hasCheckbox}`);
  console.log(`Has Dropdown: ${hasDropdown}`);
  console.log(`Has Sections: ${hasSections}`);
}

async function main() {
  const apiKey = required('API_KEY');

  const app = createApp();
  const server = app.listen(0);

  await new Promise((r) => server.once('listening', r));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  if (!port) throw new Error('Failed to determine ephemeral port');

  const payload = {
    prompt: 'Create a job application form for a junior frontend developer. Include 8-10 questions.',
    formType: 'application',
    audience: 'candidates',
    language: 'English',
    tone: 'professional'
  };

  const res = await requestJson({
    port,
    path: '/generate-form',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  console.log(`HTTP ${res.status}`);
  console.log(JSON.stringify(res.body, null, 2));

  if (res?.body?.formId) {
    await verifyGoogleFormHasQuestions(res.body.formId);
  }

  server.close();
}

main().catch((err) => {
  console.error('TEST FAILED');
  console.error('message:', err?.message);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
