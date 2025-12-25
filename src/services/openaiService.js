import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function slugifyId(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

function normalizeQuestionType(raw) {
  const t = String(raw).toLowerCase().trim();
  if (t.includes('short') && t.includes('answer')) return 'short_text';
  if (t.includes('paragraph') || t.includes('long')) return 'paragraph';
  if (t.includes('multiple') && t.includes('choice')) return 'multiple_choice';
  if (t.includes('dropdown') || t.includes('drop down')) return 'dropdown';
  if (t.includes('linear') && t.includes('scale')) return 'linear_scale';
  if (t === 'short_text') return 'short_text';
  if (t === 'paragraph') return 'paragraph';
  if (t === 'multiple_choice') return 'multiple_choice';
  if (t === 'dropdown') return 'dropdown';
  if (t === 'checkboxes') return 'checkboxes';
  if (t === 'linear_scale') return 'linear_scale';
  if (t === 'date') return 'date';
  if (t === 'time') return 'time';
  return null;
}

function tryParseExplicitSectionPrompt(prompt) {
  const text = String(prompt || '');
  if (!/\bSECTION\s*\d+\s*:/i.test(text)) return null;
  if (!/\bForm\s*Title\s*:/i.test(text)) return null;

  const titleMatch = text.match(/\bForm\s*Title\s*:\s*([\s\S]*?)(?:\n\s*\n|\n\s*Form\s*Description\s*:|\n\s*SECTION\s*\d+\s*:|$)/i);
  const descMatch = text.match(/\bForm\s*Description\s*:\s*([\s\S]*?)(?:\n\s*\n|\n\s*SECTION\s*\d+\s*:|$)/i);
  const title = titleMatch?.[1]?.trim();
  const description = descMatch?.[1]?.trim() ?? '';
  if (!title) return null;

  const lines = text.split(/\r?\n/);
  let currentSection = 'General';
  const questions = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const sec = line.match(/^SECTION\s*\d+\s*:\s*(.+)$/i);
    if (sec) {
      currentSection = sec[1].trim();
      continue;
    }

    const q = line.match(/^\d+\.(.+?)\((.+?)\)\s*(?:,\s*(required|optional))?\s*$/i);
    if (!q) continue;

    const qTitle = q[1].trim().replace(/\s+\*+\s*$/g, '');
    const typeRaw = q[2].trim();
    const reqRaw = (q[3] || '').toLowerCase().trim();
    const mappedType = normalizeQuestionType(typeRaw);
    if (!mappedType) continue;

    const required = reqRaw ? reqRaw === 'required' : /required/i.test(typeRaw);

    let choices = null;
    let scale = null;

    // Parse options block following the question.
    let j = i + 1;
    if (j < lines.length && /^\s*Options\s*:/i.test(lines[j])) {
      j += 1;
      const opts = [];
      while (j < lines.length) {
        const l = lines[j].trim();
        if (!l) {
          j += 1;
          break;
        }
        if (/^SECTION\s*\d+\s*:/i.test(l) || /^\d+\./.test(l)) break;
        const opt = l.replace(/^[-•]\s*/, '').trim();
        if (opt) opts.push(opt);
        j += 1;
      }
      if (opts.length) choices = opts;
    }

    // Parse linear scale description if present on next line(s).
    if (mappedType === 'linear_scale') {
      const scaleLine = lines[i + 1]?.trim() || '';
      const m = scaleLine.match(/\bScale\s*:\s*(\d+)\s*\(([^\)]+)\)\s*to\s*(\d+)\s*\(([^\)]+)\)/i);
      if (m) {
        scale = {
          min: Number(m[1]),
          minLabel: m[2].trim(),
          max: Number(m[3]),
          maxLabel: m[4].trim()
        };
      } else {
        scale = { min: 1, minLabel: '', max: 5, maxLabel: '' };
      }
    }

    questions.push({
      id: slugifyId(`${currentSection}_${qTitle}_${questions.length + 1}`) || `q_${questions.length + 1}`,
      section: currentSection,
      title: qTitle,
      type: mappedType,
      required,
      choices,
      scale,
      validation: null,
      correctAnswers: null,
      points: null
    });
  }

  if (questions.length < 1) return null;
  return { title, description, questions };
}

function displayLanguage(language) {
  const l = String(language || '').toLowerCase().trim();
  if (l === 'tamil') return 'Tamil';
  if (l === 'hindi') return 'Hindi';
  return 'English';
}

function buildSystemPrompt({ formType, audience, language, tone }) {
  const lang = displayLanguage(language);

  const typeRules = {
    survey:
      'Survey: opinion-based questions. Use a mix of multiple-choice, checkboxes, and 1–5 linear scales plus 1–2 open-ended questions.',
    quiz:
      'Quiz: knowledge-testing questions. Prefer MCQs. For each MCQ, include choices AND correctAnswers AND points (set points=1 unless specified). Avoid vague opinion questions.',
    feedback:
      'Feedback: include Likert/linear scales and comment fields. Add at least one paragraph question for suggestions.',
    registration:
      'Registration: collect participant details (name, email/phone) and logistics (date/time). Mostly short_text/date/time, with a few dropdowns if useful.'
  };

  const audienceRules = {
    students: 'Audience is Students: use academic/educational phrasing and school/college context.',
    staff: 'Audience is Staff: use professional workplace tone and internal process language.',
    public: 'Audience is Public: use simple, neutral language; avoid jargon.'
  };

  const toneRules = {
    formal: 'Tone is Formal: professional and official wording.',
    academic: 'Tone is Academic: scholarly, precise, educational wording.',
    casual: 'Tone is Casual: friendly, conversational wording.'
  };

  return (
    'You generate structured Google Form specifications for the Google Forms API. ' +
    'Return JSON only that matches the provided schema. ' +
    `All titles, descriptions, question titles, and options MUST be written in ${lang}. ` +
    `${toneRules[tone] || toneRules.formal} ` +
    `${audienceRules[audience] || audienceRules.public} ` +
    `${typeRules[formType] || typeRules.survey} ` +
    'Use clear, concise question titles. ' +
    'Set required=true for essential questions (especially quizzes and registration identity fields). ' +
    'If using choices, include 3–8 options. ' +
    'For fields that do not apply (choices, scale, validation, correctAnswers, points), return null.'
  );
}

async function generateSpecFromInput({ system, input, maxTokens = 2000 }) {
  let resp;
  try {
    resp = await client.responses.create({
      model: env.OPENAI_MODEL,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(input) }
      ],
      max_output_tokens: maxTokens,
      text: {
        format: {
          type: 'json_schema',
          name: FormSpecSchema.name,
          strict: true,
          schema: FormSpecSchema.schema
        }
      }
    });
  } catch (cause) {
    const status = typeof cause?.status === 'number' ? cause.status : 502;
    const err = new Error(cause?.message || 'OpenAI request failed', { cause });
    err.statusCode = status;
    err.code = 'OPENAI_REQUEST_FAILED';
    throw err;
  }

  const text = resp.output_text;
  if (!text) {
    const err = new Error('OpenAI returned empty output');
    err.statusCode = 502;
    err.code = 'OPENAI_EMPTY_OUTPUT';
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    const err = new Error('OpenAI returned invalid JSON');
    err.statusCode = 502;
    err.code = 'OPENAI_BAD_JSON';
    throw err;
  }
}

export const FormSpecSchema = {
  name: 'form_spec',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200 },
      description: { type: 'string', maxLength: 2000 },
      questions: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', minLength: 1, maxLength: 50 },
            section: { type: 'string', minLength: 1, maxLength: 200 },
            title: { type: 'string', minLength: 3, maxLength: 300 },
            type: {
              type: 'string',
              enum: [
                'short_text',
                'paragraph',
                'multiple_choice',
                'checkboxes',
                'dropdown',
                'linear_scale',
                'date',
                'time'
              ]
            },
            required: { type: 'boolean' },
            choices: {
              type: ['array', 'null'],
              items: { type: 'string', minLength: 1, maxLength: 200 },
              maxItems: 20
            },
            scale: {
              anyOf: [
                { type: 'null' },
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    min: { type: 'integer', minimum: 0, maximum: 1 },
                    max: { type: 'integer', minimum: 2, maximum: 10 },
                    minLabel: { type: ['string', 'null'], maxLength: 50 },
                    maxLabel: { type: ['string', 'null'], maxLength: 50 }
                  },
                  required: ['min', 'max', 'minLabel', 'maxLabel']
                }
              ]
            },
            validation: {
              anyOf: [
                { type: 'null' },
                {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    maxLength: { type: ['integer', 'null'], minimum: 1, maximum: 2000 },
                    minLength: { type: ['integer', 'null'], minimum: 0, maximum: 2000 },
                    regex: { type: ['string', 'null'], maxLength: 200 }
                  },
                  required: ['maxLength', 'minLength', 'regex']
                }
              ]
            },
            correctAnswers: {
              anyOf: [
                { type: 'null' },
                {
                  type: 'array',
                  items: { type: 'string', minLength: 1, maxLength: 200 },
                  minItems: 1,
                  maxItems: 5
                }
              ]
            },
            points: {
              anyOf: [
                { type: 'null' },
                { type: 'integer', minimum: 0, maximum: 100 }
              ]
            }
          },
          required: ['id', 'section', 'title', 'type', 'required', 'choices', 'scale', 'validation', 'correctAnswers', 'points']
        }
      }
    },
    required: ['title', 'description', 'questions']
  }
};

const ImageExtractSchema = {
  name: 'image_extract',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      extractedPrompt: { type: 'string', minLength: 20, maxLength: 12000 }
    },
    required: ['extractedPrompt']
  }
};

export async function extractPromptFromImages({ files }) {
  const safeFiles = Array.isArray(files) ? files : [];
  if (safeFiles.length < 1) {
    const err = new Error('No images provided');
    err.statusCode = 400;
    err.code = 'NO_IMAGES';
    throw err;
  }

  const model = env.OPENAI_VISION_MODEL || env.OPENAI_MODEL;

  const instruction =
    'You are given screenshots/photos of multiple-choice questions (MCQ) and related form content. ' +
    'Extract the text faithfully and convert it into a single, editable form prompt. ' +
    'Prefer this exact format so it can be edited and later converted into a Google Form:\n\n' +
    'Form Title: <best guess title>\n' +
    'Form Description: <optional>\n' +
    'SECTION 1: <section name>\n' +
    '1. <Question text> (multiple_choice), required|optional\n' +
    'Options:\n- <option 1>\n- <option 2>\n...\n\n' +
    'If a question has multiple correct answers, use (checkboxes). If it is a single answer, use (multiple_choice). ' +
    'If you cannot read a word, use [UNCLEAR] rather than guessing. ' +
    'Return JSON only matching the schema.';

  const content = [
    { type: 'input_text', text: instruction },
    ...safeFiles.map((f) => {
      const mime = f?.mimetype || 'image/png';
      const b64 = Buffer.from(f?.buffer || Buffer.alloc(0)).toString('base64');
      return {
        type: 'input_image',
        image_url: `data:${mime};base64,${b64}`
      };
    })
  ];

  let resp;
  try {
    resp = await client.responses.create({
      model,
      input: [{ role: 'user', content }],
      max_output_tokens: 1500,
      text: {
        format: {
          type: 'json_schema',
          name: ImageExtractSchema.name,
          strict: true,
          schema: ImageExtractSchema.schema
        }
      }
    });
  } catch (cause) {
    const status = typeof cause?.status === 'number' ? cause.status : 502;
    const err = new Error(cause?.message || 'OpenAI vision request failed', { cause });
    err.statusCode = status;
    err.code = 'OPENAI_VISION_REQUEST_FAILED';
    throw err;
  }

  const text = resp.output_text;
  if (!text) {
    const err = new Error('OpenAI returned empty output');
    err.statusCode = 502;
    err.code = 'OPENAI_EMPTY_OUTPUT';
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const err = new Error('OpenAI returned invalid JSON');
    err.statusCode = 502;
    err.code = 'OPENAI_BAD_JSON';
    throw err;
  }

  return parsed;
}

export async function generateFormSpec({ prompt, formType, audience, language, tone }) {
  const parsedSpec = tryParseExplicitSectionPrompt(prompt);
  const system = buildSystemPrompt({ formType, audience, language, tone });

  // If the user provided an explicit SECTION-based structure, we parse it deterministically
  // but still allow the dropdown parameters (language/tone/audience/formType) to affect output
  // by optionally running a “localize/style” pass through the model.
  if (parsedSpec) {
    const isDefaultProfile = formType === 'survey' && audience === 'students' && language === 'english' && tone === 'formal';
    if (isDefaultProfile) return parsedSpec;

    return generateSpecFromInput({
      system,
      input: {
        prompt,
        formType,
        audience,
        language,
        tone,
        seedSpec: parsedSpec,
        instruction:
          'Rewrite the provided seedSpec into the requested language/tone/audience and adjust question types to match formType. ' +
          'Preserve the number of questions and the intent/options as much as possible.'
      },
      maxTokens: 2200
    });
  }

  return generateSpecFromInput({
    system,
    input: { prompt, formType, audience, language, tone },
    maxTokens: 2200
  });
}
