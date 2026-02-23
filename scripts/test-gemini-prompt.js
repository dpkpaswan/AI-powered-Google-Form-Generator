const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// IMPORTANT: do NOT commit API keys. Use environment variables.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable. Set it and retry.');
  process.exit(1);
}

const model = 'models/gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;

async function testGeminiPrompt(prompt) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    console.log('Gemini API response:', data);
  } catch (err) {
    console.error('Gemini request failed:', err?.message || err);
    process.exit(2);
  }
}

// Example prompt
const prompt = 'Generate a simple Google Form for student feedback.';
testGeminiPrompt(prompt);
