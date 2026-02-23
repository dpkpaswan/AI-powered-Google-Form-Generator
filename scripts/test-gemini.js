const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GEMINI_API_KEY = 'AIzaSyCLnRi8v1C2kdvnhPvfvQxhz51gxiIMMHM';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

async function testGemini() {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello Gemini!' }] }] })
  });
  const data = await response.json();
  console.log('Gemini API response:', data);
}

testGemini();
