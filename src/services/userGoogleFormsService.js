import { google } from 'googleapis';
import { getOAuthClientForUser } from './googleOAuthService.js';

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

function toGoogleItemRequest(question, index, { isQuiz } = {}) {
  const title = question.title;
  const required = !!question.required;

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
        options: (question.choices ?? []).length ? question.choices.map((v) => ({ value: v })) : [{ value: 'Option 1' }]
      };
      break;
    case 'checkboxes':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'CHECKBOX',
        options: (question.choices ?? []).length ? question.choices.map((v) => ({ value: v })) : [{ value: 'Option 1' }]
      };
      break;
    case 'dropdown':
      base.createItem.item.questionItem.question.choiceQuestion = {
        type: 'DROP_DOWN',
        options: (question.choices ?? []).length ? question.choices.map((v) => ({ value: v })) : [{ value: 'Option 1' }]
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

export async function createGoogleFormFromSpecForUser({ userId, spec, formType } = {}) {
  if (!userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const oauth2 = await getOAuthClientForUser(userId);
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  try {
    const created = await forms.forms.create({
      requestBody: {
        info: {
          title: spec.title,
          documentTitle: spec.title
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

    const isQuiz = String(formType || '').toLowerCase().trim() === 'quiz';

    const requests = [];

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

    for (const q of questions) {
      requests.push(toGoogleItemRequest(q, insertIndex, { isQuiz }));
      insertIndex += 1;
    }

    if (requests.length) {
      await forms.forms.batchUpdate({
        formId,
        requestBody: { requests }
      });
    }

    return {
      formId,
      editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
      responderUrl: created?.data?.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`
    };
  } catch (err) {
    const wrapped = new Error(googleApiErrorMessage(err, 'Google Forms create failed'), { cause: err });
    wrapped.statusCode = googleApiErrorStatus(err);
    wrapped.code = 'GOOGLE_FORMS_CREATE_FAILED';
    throw wrapped;
  }
}
