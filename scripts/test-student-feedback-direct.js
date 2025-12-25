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

function topLevelKind(item) {
  if (item?.pageBreakItem) return 'pageBreak';
  if (item?.textItem) return 'textItem';
  if (item?.questionItem?.question?.choiceQuestion?.type) return `choice:${item.questionItem.question.choiceQuestion.type}`;
  if (item?.questionItem?.question?.textQuestion) return item.questionItem.question.textQuestion.paragraph ? 'text:paragraph' : 'text:short';
  if (item?.questionItem?.question?.scaleQuestion) return 'scale';
  return 'unknown';
}

async function verifyFormItems(formId) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || undefined;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('Skipping Google verification (missing OAuth env vars).');
    return;
  }

  const scopes = ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/drive'];
  const oauth2 = new google.auth.OAuth2({ clientId, clientSecret, redirectUri });
  oauth2.setCredentials({ refresh_token: refreshToken, scope: scopes.join(' ') });
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  const got = await forms.forms.get({ formId });
  const items = got?.data?.items ?? [];
  const kinds = items.map(topLevelKind);

  console.log(`Google Form items: ${items.length}`);
  console.log('Kinds (first 30):', kinds.slice(0, 30));
  console.log(`Has sections: ${kinds.some((k) => k === 'pageBreak' || k === 'textItem')}`);
  console.log(`MCQ count: ${kinds.filter((k) => k === 'choice:RADIO').length}`);
  console.log(`Dropdown count: ${kinds.filter((k) => k === 'choice:DROP_DOWN').length}`);
  console.log(`Scale count: ${kinds.filter((k) => k === 'scale').length}`);
}

async function main() {
  const apiKey = required('API_KEY');

  const app = createApp();
  const server = app.listen(0);

  await new Promise((r) => server.once('listening', r));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  if (!port) throw new Error('Failed to determine ephemeral port');

  const prompt = `I need a college-level Student Feedback Form.

Form Title:
End-Semester Course Feedback – Computer Science

Form Description:
This form is used to collect structured feedback from students about the Computer Science course to improve teaching quality and curriculum design.

Create the form with the following sections and questions:

SECTION 1: Student Information
1. Full Name (Short answer, required)
2. Register Number (Short answer, required)
3. Department (Multiple choice, required)
   Options:
   - B.Sc Computer Science
   - BCA
   - B.Com CA
   - Other
4. Year of Study (Dropdown, required)
   Options:
   - 1st Year
   - 2nd Year
   - 3rd Year

SECTION 2: Course Content
5. The course syllabus was well structured and easy to understand (Multiple choice, required)
   Options:
   - Strongly Agree
   - Agree
   - Neutral
   - Disagree
   - Strongly Disagree
6. The topics covered were relevant to current industry needs (Multiple choice, required)
   Options:
   - Strongly Agree
   - Agree
   - Neutral
   - Disagree
   - Strongly Disagree

SECTION 3: Teaching Methodology
7. The faculty explained concepts clearly (Multiple choice, required)
   Options:
   - Excellent
   - Good
   - Average
   - Poor
8. Teaching pace was appropriate (Multiple choice, required)
   Options:
   - Too Fast
   - Just Right
   - Too Slow

SECTION 4: Lab Sessions
9. Lab sessions helped in understanding practical concepts (Multiple choice, required)
   Options:
   - Strongly Agree
   - Agree
   - Neutral
   - Disagree
10. Lab infrastructure and resources were adequate (Multiple choice, required)
    Options:
    - Excellent
    - Good
    - Average
    - Poor

SECTION 5: Overall Satisfaction
11. Overall, how satisfied are you with this course? (Linear scale, required)
    Scale: 1 (Very Dissatisfied) to 5 (Very Satisfied)

SECTION 6: Suggestions & Improvements
12. What improvements would you suggest for this course? (Paragraph, optional)

Requirements:
- Clearly separate sections
- Use the exact question types mentioned
- Mark all questions as required except suggestions
- Use professional academic language
- Ensure the form is suitable for college students`;

  const payload = {
    prompt,
    formType: 'feedback',
    audience: 'students',
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
    await verifyFormItems(res.body.formId);
  }
  server.close();
}

main().catch((err) => {
  console.error('TEST FAILED');
  console.error('message:', err?.message);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
