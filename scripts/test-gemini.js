const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// IMPORTANT: Do NOT commit API keys. Read from environment instead.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable. Set it and retry.');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

async function testGemini() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello Gemini!' }] }] })
    });
    const data = await response.json();
    console.log('Gemini API response:', data);
  } catch (err) {
    console.error('Gemini request failed:', err?.message || err);
    process.exit(2);
  }
}

testGemini();
