// Gemini Integration Service
// Supports: Form generation + Image prompt extraction

import { env } from '../config/env.js';

/* =========================================================
   Helper: Extract clean text from Gemini response
========================================================= */
function extractText(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(extractText).join('\n');
  if (typeof obj === 'object') {
    for (const key of ['text', 'content', 'parts', 'candidates']) {
      if (obj[key] !== undefined) return extractText(obj[key]);
    }
    return Object.values(obj).map(extractText).join('\n');
  }
  return '';
}

/* =========================================================
   Helper: Safely Extract JSON from Text
========================================================= */
function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

/* =========================================================
   1️⃣ Generate Form Specification
========================================================= */
async function generateFormSpec({ prompt, formType, audience, language, tone }) {
  const model = 'models/gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const structuredPrompt = `
Generate a structured JSON form specification.

IMPORTANT:
- Return ONLY valid JSON.
- Do NOT include explanations.
- Follow this exact structure:

{
  "title": "",
  "description": "",
  "questions": [
    {
      "title": "",
      "type": "multiple_choice | checkboxes | paragraph | short_text | linear_scale | dropdown | date | time",
      "choices": [],
      "required": true
    }
  ]
}

User Prompt:
${prompt}

Form Type: ${formType}
Audience: ${audience}
Language: ${language}
Tone: ${tone}
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: structuredPrompt }] }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Gemini request failed: ' + errorText);
  }

  const data = await response.json();
  const rawText = extractText(data).trim();

  const parsed = extractJSON(rawText);

  let spec = {
    title: '',
    description: '',
    questions: []
  };

  if (parsed && typeof parsed === 'object') {
    spec.title = parsed.title || 'Generated Form';
    spec.description = parsed.description || '';
    spec.questions = Array.isArray(parsed.questions) ? parsed.questions : [];
  } else {
    // fallback if Gemini fails JSON formatting
    spec.title = prompt?.split('\n')[0]?.slice(0, 100) || 'Generated Form';
    spec.description = rawText;
    spec.questions = [];
  }

  return spec;
}

/* =========================================================
   2️⃣ Extract Prompt From Images (Gemini Vision)
========================================================= */
async function extractPromptFromImages({ files }) {
  const model = 'models/gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No files provided for image extraction');
  }

  // Validate and prepare inline image data (base64) for Gemini
  const inlineParts = [];
  for (const file of files) {
    // Multer memoryStorage provides `buffer`; older callers might set `base64` already.
    const buf = file?.buffer;
    const base64 = buf ? buf.toString('base64') : file?.base64;

    if (!base64) {
      throw new Error('Uploaded file missing binary data');
    }

    // Basic size/format guard: Gemini may reject very large images.
    const sizeBytes = file?.size || (buf ? buf.length : 0);
    const maxBytes = 6 * 1024 * 1024; // 6 MB (matches multer upload limit)
    if (sizeBytes > maxBytes) {
      throw new Error(`Image too large (${Math.round(sizeBytes / 1024)} KB). Max allowed is ${Math.round(maxBytes / 1024)} KB.`);
    }

    inlineParts.push({
      inlineData: {
        mimeType: file?.mimetype || 'image/jpeg',
        data: base64
      }
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: 'Extract the main form content or prompt from these images clearly.' },
            ...inlineParts
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    let errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText);
      // Prefer structured error if available
      errorText = parsed?.error ? JSON.stringify(parsed.error) : JSON.stringify(parsed);
    } catch {
      // keep raw
    }
    throw new Error('Gemini Vision request failed: ' + errorText);
  }

  const data = await response.json();
  const extractedPrompt =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return { extractedPrompt };
}

export { generateFormSpec, extractPromptFromImages };