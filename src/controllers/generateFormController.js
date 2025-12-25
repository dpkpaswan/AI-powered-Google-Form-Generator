import { generateFormSpec } from '../services/openaiService.js';
import { createGoogleFormFromSpecForUser } from '../services/userGoogleFormsService.js';
import { supabase } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';

export async function generateFormController(req, res, next) {
  try {
    const { prompt, formType, audience, language, tone } = req.validatedBody;

    const spec = await generateFormSpec({ prompt, formType, audience, language, tone });

    const userId = req.user?.id;
    const created = await createGoogleFormFromSpecForUser({ userId, spec, formType });

    const createdBy = userId ?? 'unknown';

    // Persistence is best-effort; do not block form creation if Supabase is misconfigured.
    try {
      const { data: formRow, error: formErr } = await supabase
        .from('forms')
        .insert({
          google_form_id: created.formId,
          google_form_url: created.responderUrl,
          edit_url: created.editUrl,
          responder_url: created.responderUrl,
          title: spec.title,
          description: spec.description,
          prompt,
          form_type: formType,
          audience,
          language,
          tone,
          created_by: createdBy,
          user_id: userId
        })
        .select('*')
        .single();

      if (formErr) {
        logger.warn({ err: formErr }, 'Supabase insert forms failed (continuing without persistence)');
      } else if (formRow?.id) {
        const questionRows = spec.questions.map((q, idx) => ({
          form_id: formRow.id,
          question_order: idx,
          ai_question_id: q.id,
          title: q.title,
          type: q.type,
          required: !!q.required,
          validation: q.validation ?? null,
          created_by: createdBy
        }));

        if (questionRows.length) {
          const { error: qErr } = await supabase.from('form_questions').insert(questionRows);
          if (qErr) {
            logger.warn({ err: qErr }, 'Supabase insert form_questions failed (continuing)');
          }
        }
      }
    } catch (persistErr) {
      logger.warn({ err: persistErr }, 'Supabase persistence failed (continuing)');
    }

    res.json({
      formId: created.formId,
      formUrl: created.responderUrl,
      editUrl: created.editUrl,
      responderUrl: created.responderUrl,
      title: spec.title,
      description: spec.description,
      questions: spec.questions
    });
  } catch (e) {
    next(e);
  }
}
