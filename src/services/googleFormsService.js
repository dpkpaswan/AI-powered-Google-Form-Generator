import { google } from 'googleapis';
import fs from 'node:fs';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function googleApiErrorStatus(cause) {
  if (typeof cause?.response?.status === 'number') return cause.response.status;
  if (Number.isInteger(cause?.code)) return cause.code;
  return 502;
}

function googleApiErrorMessage(cause, fallback) {
  const details =
    cause?.response?.data?.error?.errors?.[0]?.reason ||
    cause?.response?.data?.error?.status ||
    cause?.response?.data?.error?.code;

  const msg =
    cause?.response?.data?.error?.message ||
    cause?.response?.data?.message ||
    cause?.message ||
    fallback;

  const base = typeof msg === 'string' && msg.trim() ? msg.trim() : fallback;
  return details ? `${base} (details: ${details})` : base;
}

function isTransientGoogleError(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function withRetries(fn, { retries = 3, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (cause) {
      attempt += 1;
      const status = googleApiErrorStatus(cause);
      if (attempt > retries || !isTransientGoogleError(status)) {
        throw cause;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

function getServiceAccountCredentials() {
  try {
    if (env.GOOGLE_SERVICE_ACCOUNT_FILE) {
      const json = fs.readFileSync(env.GOOGLE_SERVICE_ACCOUNT_FILE, 'utf8');
      return JSON.parse(json);
    }

    if (env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
      const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.trim();
      // Common misconfiguration: raw JSON pasted into the *_BASE64 var.
      if (raw.startsWith('{')) {
        return JSON.parse(raw);
      }

      const json = Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(json);
    }

    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const err = new Error(
        'Missing GOOGLE_SERVICE_ACCOUNT_FILE, GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64'
      );
      err.statusCode = 500;
      err.code = 'GOOGLE_SA_JSON_MISSING';
      throw err;
    }

    return JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (cause) {
    const err = new Error('Invalid Google service account JSON', { cause });
    err.statusCode = 500;
    err.code = 'GOOGLE_SA_JSON_INVALID';
    throw err;
  }
}

let loggedAuthMode = false;

async function createGoogleAuthClient() {
  const scopes = ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/drive'];

  // Personal Gmail flow: OAuth2 refresh token.
  if (env.GOOGLE_OAUTH_REFRESH_TOKEN && env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET) {
    if (!loggedAuthMode) {
      loggedAuthMode = true;
      logger.info({ mode: 'oauth2', scopes }, 'Google auth mode selected');
    }
    const oauth2 = new google.auth.OAuth2({
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI || undefined
    });

    oauth2.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN, scope: scopes.join(' ') });
    return oauth2;
  }

  // Service account flow.
  // Use GoogleAuth as requested. Prefer keyFile if provided; fallback to credentials from JSON/base64.
  if (!loggedAuthMode) {
    loggedAuthMode = true;
    logger.info({ mode: 'service-account', scopes }, 'Google auth mode selected');
  }
  const auth = env.GOOGLE_SERVICE_ACCOUNT_FILE
    ? new google.auth.GoogleAuth({ keyFile: env.GOOGLE_SERVICE_ACCOUNT_FILE, scopes })
    : new google.auth.GoogleAuth({ credentials: getServiceAccountCredentials(), scopes });

  return auth.getClient();
}

export async function createForm({ title, documentTitle }) {
  const authClient = await createGoogleAuthClient();
  const forms = google.forms({ version: 'v1', auth: authClient });

  try {
    const created = await forms.forms.create({
      requestBody: {
        info: {
          title,
          documentTitle
        }
      }
    });

    const formId = created?.data?.formId;
    if (!formId) {
      const err = new Error('Google Forms API did not return formId');
      err.statusCode = 502;
      err.code = 'GOOGLE_FORMS_CREATE_FAILED';
      throw err;
    }

    return {
      formId,
      responderUri: created?.data?.responderUri,
      editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      viewUrl: `https://docs.google.com/forms/d/${formId}/viewform`
    };
  } catch (err) {
    const googleReason = err?.response?.data?.error?.errors?.[0]?.reason;
    const isBackendError500 = err?.response?.status === 500 && googleReason === 'backendError';

    // Robust error logging required by user.
    // eslint-disable-next-line no-console
    console.error('Google Forms create failed:', {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data
    });

    const status = googleApiErrorStatus(err);
    const baseMessage = googleApiErrorMessage(err, 'Google Forms create failed');
    const hint = isBackendError500
      ?
        'Hint: This commonly happens when using a service account without a real Google user context. ' +
        'For personal Gmail accounts, service accounts typically cannot create/own Google Forms. ' +
        'To create forms reliably you need either (a) Google Workspace + Domain-Wide Delegation + user impersonation, ' +
        'or (b) OAuth2 user consent (refresh token) for the Gmail user.'
      : null;

    const wrapped = new Error(hint ? `${baseMessage}\n${hint}` : baseMessage, { cause: err });
    wrapped.statusCode = status;
    wrapped.code = 'GOOGLE_FORMS_CREATE_FAILED';
    throw wrapped;
  }
}

function toGoogleItemRequest(question, index, { isQuiz } = {}) {
  const title = question.title;
  const required = !!question.required;

  // Do not set custom itemId/questionId.
  // Google Forms often rejects arbitrary IDs; letting the API generate IDs avoids "Invalid ID" errors.

  const base = {
    createItem: {
      location: { index },
      item: {
        title,
        questionItem: {
          question: {
            required
          }
        }
      }
    }
  };

  if (isQuiz && Array.isArray(question?.correctAnswers) && question.correctAnswers.length) {
    base.createItem.item.questionItem.question.grading = {
      pointValue: typeof question?.points === 'number' ? question.points : 1,
      correctAnswers: {
        answers: question.correctAnswers.map((v) => ({ value: v }))
      }
    };
  }

  switch (question.type) {
    case 'short_text':
      base.createItem.item.questionItem.question.textQuestion = {};
      break;
    case 'paragraph':
      base.createItem.item.questionItem.question.textQuestion = { paragraph: true };
      break;
    case 'multiple_choice':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'RADIO',
        options: (question.choices ?? []).length
          ? question.choices.map((v) => ({ value: v }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'checkboxes':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'CHECKBOX',
        options: (question.choices ?? []).length
          ? question.choices.map((v) => ({ value: v }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'dropdown':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'DROP_DOWN',
        options: (question.choices ?? []).length
          ? question.choices.map((v) => ({ value: v }))
          : [{ value: 'Option 1' }]
      };
      break;
    case 'linear_scale': {
      const scale = question.scale ?? { min: 0, max: 5 };
      base.createItem.item.questionItem.question.scaleQuestion = {
        low: scale.min,
        high: scale.max,
        lowLabel: scale.minLabel ?? '',
        highLabel: scale.maxLabel ?? ''
      };
      break;
    }
    case 'date':
      base.createItem.item.questionItem.question.dateQuestion = { includeTime: false };
      break;
    case 'time':
      base.createItem.item.questionItem.question.timeQuestion = {};
      break;
    default: {
      const err = new Error(`Unsupported question type: ${question.type}`);
      err.statusCode = 400;
      err.code = 'UNSUPPORTED_QUESTION_TYPE';
      throw err;
    }
  }

  return base;
}

function toSectionHeaderTextItemRequest(title, description, index) {
  const t = String(title || '').trim();
  const d = typeof description === 'string' ? description.trim() : '';

  return {
    createItem: {
      location: { index },
      item: {
        title: t,
        description: d || undefined,
        textItem: {}
      }
    }
  };
}

function toSectionPageBreakRequest(title, description, index) {
  const t = String(title || '').trim();
  const d = typeof description === 'string' ? description.trim() : '';

  return {
    createItem: {
      location: { index },
      item: {
        title: t,
        description: d || undefined,
        pageBreakItem: {}
      }
    }
  };
}

export async function createGoogleFormFromSpec(spec, { formType } = {}) {
  const created = await createForm({ title: spec.title, documentTitle: spec.title });

  const authClient = await createGoogleAuthClient();
  const forms = google.forms({ version: 'v1', auth: authClient });

  const requests = [];

  const isQuiz = String(formType || '').toLowerCase().trim() === 'quiz';

  if (isQuiz) {
    requests.push({
      updateSettings: {
        settings: {
          quizSettings: {
            isQuiz: true
          }
        },
        updateMask: 'quizSettings.isQuiz'
      }
    });
  }

  if (typeof spec.description === 'string' && spec.description.trim()) {
    requests.push({
      updateFormInfo: {
        info: { description: spec.description.trim() },
        updateMask: 'description'
      }
    });
  }

  const questions = Array.isArray(spec.questions) ? spec.questions : [];

  let insertIndex = 0;
  let currentSection = null;
  let firstSectionHeaderAdded = false;

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const section = typeof q?.section === 'string' && q.section.trim() ? q.section.trim() : null;

    if (section && section !== currentSection) {
      if (!firstSectionHeaderAdded) {
        requests.push(toSectionHeaderTextItemRequest(section, '', insertIndex));
        insertIndex += 1;
        firstSectionHeaderAdded = true;
      } else {
        requests.push(toSectionPageBreakRequest(section, '', insertIndex));
        insertIndex += 1;
      }
      currentSection = section;
    }

    requests.push(toGoogleItemRequest(q, insertIndex, { isQuiz }));
    insertIndex += 1;
  }

  if (requests.length) {
    try {
      await withRetries(
        () =>
          forms.forms.batchUpdate({
            formId: created.formId,
            requestBody: { requests }
          }),
        { retries: 3, baseDelayMs: 500 }
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Google Forms batchUpdate failed:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      });

      const wrapped = new Error(googleApiErrorMessage(err, 'Google Forms update failed'), { cause: err });
      wrapped.statusCode = googleApiErrorStatus(err);
      wrapped.code = 'GOOGLE_FORMS_UPDATE_FAILED';
      throw wrapped;
    }
  }

  return { formId: created.formId, formUrl: created.viewUrl };
}
