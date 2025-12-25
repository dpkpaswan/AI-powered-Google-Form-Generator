import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const original = fs.readFileSync(envPath, 'utf8');
const lines = original.split(/\r?\n/);

const startIdx = lines.findIndex((l) => l.startsWith('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64='));
if (startIdx === -1) {
  console.error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64= not found in .env');
  process.exit(1);
}

const firstLine = lines[startIdx];
const afterEq = firstLine.slice(firstLine.indexOf('=') + 1).trim();

// If it's already base64 (single line, not JSON-looking), do nothing.
if (afterEq && !afterEq.startsWith('{')) {
  console.log('Looks like GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is already set (not JSON). No changes made.');
  process.exit(0);
}

// Reconstruct a JSON block starting at the first '{' (could be on same line or next lines).
let jsonLines = [];
let endIdx = startIdx;

if (afterEq) {
  jsonLines.push(afterEq);
} else {
  // value is empty on the same line; see if JSON starts on subsequent lines
}

for (let i = startIdx + 1; i < lines.length; i++) {
  const l = lines[i];
  if (jsonLines.length === 0) {
    if (l.trim().startsWith('{')) {
      jsonLines.push(l.trim());
    } else {
      // skip until JSON actually begins
      continue;
    }
  } else {
    jsonLines.push(l);
  }

  // Common pattern: JSON ends with a line containing just '}'
  if (l.trim() === '}') {
    endIdx = i;
    break;
  }
}

if (jsonLines.length === 0) {
  console.error('Could not find a JSON object following GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=.');
  process.exit(1);
}

const jsonText = jsonLines.join('\n');
let parsed;
try {
  parsed = JSON.parse(jsonText);
} catch {
  console.error('Found JSON-looking content but it is not valid JSON. Fix the .env Google SA block.');
  process.exit(1);
}

const oneLine = JSON.stringify(parsed);

const before = lines.slice(0, startIdx);
const after = lines.slice(endIdx + 1);

const replacement = [
  '# Google service account',
  'GOOGLE_SERVICE_ACCOUNT_JSON=' + oneLine,
  'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64='
];

const updated = [...before, ...replacement, ...after].join('\n');
fs.writeFileSync(envPath, updated, 'utf8');
console.log('Updated .env: moved Google service account JSON into GOOGLE_SERVICE_ACCOUNT_JSON (single line).');
