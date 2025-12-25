import { google } from 'googleapis';
import { supabase } from './supabaseClient.js';
import { getOAuthClientForUser } from './googleOAuthService.js';

async function selectFormMetadataForUser({ userId, formId }) {
  const base = 'google_form_id, google_form_url, edit_url, responder_url, title, description, form_type, audience, language, tone, created_at';

  const withArchived = await supabase
    .from('forms')
    .select(`${base}, archived`)
    .eq('user_id', userId)
    .eq('google_form_id', formId)
    .maybeSingle();

  if (!withArchived.error) return withArchived;

  if (withArchived.error?.code === '42703' && String(withArchived.error?.message || '').includes('archived')) {
    const withoutArchived = await supabase
      .from('forms')
      .select(base)
      .eq('user_id', userId)
      .eq('google_form_id', formId)
      .maybeSingle();

    if (!withoutArchived.error && withoutArchived.data) {
      return { ...withoutArchived, data: { ...withoutArchived.data, archived: false } };
    }
    return withoutArchived;
  }

  return withArchived;
}

function mapGoogleFormToEditableModel(googleForm) {
  const info = googleForm?.info || {};
  const items = Array.isArray(googleForm?.items) ? googleForm.items : [];

  const questions = [];

  for (const item of items) {
    const qi = item?.questionItem;
    const q = qi?.question;
    if (!q) continue;

    const base = {
      title: item?.title || '',
      required: !!q.required
    };

    if (q.textQuestion) {
      questions.push({ ...base, type: q.textQuestion.paragraph ? 'paragraph' : 'short_text' });
      continue;
    }

    if (q.choiceQuestion) {
      const t = q.choiceQuestion.type;
      const choices = Array.isArray(q.choiceQuestion.options) ? q.choiceQuestion.options.map((o) => o?.value).filter(Boolean) : [];
      if (t === 'RADIO') questions.push({ ...base, type: 'multiple_choice', choices });
      else if (t === 'CHECKBOX') questions.push({ ...base, type: 'checkboxes', choices });
      else if (t === 'DROP_DOWN') questions.push({ ...base, type: 'dropdown', choices });
      continue;
    }

    if (q.scaleQuestion) {
      questions.push({
        ...base,
        type: 'linear_scale',
        scale: {
          min: q.scaleQuestion.low,
          max: q.scaleQuestion.high,
          minLabel: q.scaleQuestion.lowLabel || '',
          maxLabel: q.scaleQuestion.highLabel || ''
        }
      });
      continue;
    }

    if (q.dateQuestion) {
      questions.push({ ...base, type: 'date' });
      continue;
    }

    if (q.timeQuestion) {
      questions.push({ ...base, type: 'time' });
      continue;
    }
  }

  return {
    formId: googleForm?.formId,
    title: info.title || '',
    description: info.description || '',
    questions
  };
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

export async function getFormForUser({ userId, formId }) {
  const { data: row, error } = await selectFormMetadataForUser({ userId, formId });

  if (error) throw error;
  if (!row) {
    const err = new Error('Form not found');
    err.statusCode = 404;
    err.code = 'FORM_NOT_FOUND';
    throw err;
  }

  const oauth2 = await getOAuthClientForUser(userId);
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  const { data: gf } = await forms.forms.get({ formId });
  const editable = mapGoogleFormToEditableModel(gf);

  return {
    metadata: row,
    form: editable,
    editUrl: row.edit_url || `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: row.responder_url || `https://docs.google.com/forms/d/${formId}/viewform`
  };
}

export async function syncFormFromSpecForUser({ userId, formId, spec, formType }) {
  // Verify ownership in DB.
  const { data: row, error } = await supabase
    .from('forms')
    .select('google_form_id')
    .eq('user_id', userId)
    .eq('google_form_id', formId)
    .maybeSingle();

  if (error) throw error;
  if (!row) {
    const err = new Error('Form not found');
    err.statusCode = 404;
    err.code = 'FORM_NOT_FOUND';
    throw err;
  }

  const oauth2 = await getOAuthClientForUser(userId);
  const forms = google.forms({ version: 'v1', auth: oauth2 });

  const { data: existing } = await forms.forms.get({ formId });
  const existingItems = Array.isArray(existing?.items) ? existing.items : [];

  const requests = [];

  // Update title/description.
  requests.push({
    updateFormInfo: {
      info: {
        title: spec.title,
        description: typeof spec.description === 'string' ? spec.description : ''
      },
      updateMask: 'title,description'
    }
  });

  const isQuiz = String(formType || '').toLowerCase().trim() === 'quiz';
  if (isQuiz) {
    requests.push({
      updateSettings: {
        settings: { quizSettings: { isQuiz: true } },
        updateMask: 'quizSettings.isQuiz'
      }
    });
  }

  // Delete existing items (simple, reliable editing strategy).
  for (const item of existingItems) {
    if (!item?.itemId) continue;
    requests.push({ deleteItem: { itemId: item.itemId } });
  }

  // Recreate from spec.
  let insertIndex = 0;
  const qs = Array.isArray(spec.questions) ? spec.questions : [];
  for (const q of qs) {
    requests.push(toGoogleItemRequest(q, insertIndex, { isQuiz }));
    insertIndex += 1;
  }

  await forms.forms.batchUpdate({
    formId,
    requestBody: { requests }
  });

  // Keep DB title/description in sync.
  await supabase
    .from('forms')
    .update({ title: spec.title, description: spec.description || '' })
    .eq('user_id', userId)
    .eq('google_form_id', formId);

  return {
    formId,
    editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUrl: `https://docs.google.com/forms/d/${formId}/viewform`
  };
}
