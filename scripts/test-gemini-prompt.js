const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GEMINI_API_KEY = 'AIzaSyDAP1S5zFFHEBHO0OVNACerQYzdPkdsOjM';
const model = 'models/gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`;

async function testGeminiPrompt(prompt) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  console.log('Gemini API response:', data);
}

// Example prompt
const prompt = 'Generate a simple Google Form for student feedback.';
testGeminiPrompt(prompt);
