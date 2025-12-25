import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../middlewares/requireUser.js';
import { supabase } from '../services/supabaseClient.js';
import { getFormForUser, syncFormFromSpecForUser } from '../services/userFormsService.js';

async function selectFormsForUser(userId) {
  const base = 'google_form_id, google_form_url, edit_url, responder_url, title, description, prompt, form_type, audience, language, tone, created_at';

  const withArchived = await supabase
    .from('forms')
    .select(`${base}, archived`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!withArchived.error) return withArchived;

  if (withArchived.error?.code === '42703' && String(withArchived.error?.message || '').includes('archived')) {
    const withoutArchived = await supabase
      .from('forms')
      .select(base)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!withoutArchived.error) {
      return {
        ...withoutArchived,
        data: (withoutArchived.data || []).map((row) => ({ ...row, archived: false }))
      };
    }

    return withoutArchived;
  }

  return withArchived;
}

const router = Router();

router.get('/forms', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data, error } = await selectFormsForUser(userId);

    if (error) throw error;

    res.json({ forms: data || [] });
  } catch (e) {
    next(e);
  }
});

router.delete('/forms/:formId', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    if (!formId) return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });

    const { data, error } = await supabase
      .from('forms')
      .delete()
      .eq('user_id', userId)
      .eq('google_form_id', formId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
      return res.status(404).json({ error: { message: 'Form not found', code: 'FORM_NOT_FOUND' } });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const BulkArchiveSchema = z.object({
  formIds: z.array(z.string().min(1)).min(1).max(200),
  archived: z.boolean().default(true)
});

router.post('/forms/bulk/archive', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = BulkArchiveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: 'Invalid payload', code: 'BAD_REQUEST', details: parsed.error.flatten() } });
    }

    const { formIds, archived } = parsed.data;

    const { data, error } = await supabase
      .from('forms')
      .update({ archived })
      .eq('user_id', userId)
      .in('google_form_id', formIds)
      .select('google_form_id, archived');

    if (error) {
      if (error?.code === '42703' && String(error?.message || '').includes('archived')) {
        return res.status(400).json({
          error: {
            message:
              'Archiving requires a DB migration: add public.forms.archived boolean not null default false (see supabase/schema.sql).',
            code: 'DB_MIGRATION_REQUIRED'
          }
        });
      }
      throw error;
    }
    res.json({ ok: true, updated: data || [] });
  } catch (e) {
    next(e);
  }
});

router.get('/forms/:formId', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    if (!formId) return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });

    const form = await getFormForUser({ userId, formId });
    res.json(form);
  } catch (e) {
    next(e);
  }
});

const QuestionSchema = z.object({
  title: z.string().min(1).max(500),
  required: z.boolean().optional(),
  type: z.enum([
    'short_text',
    'paragraph',
    'multiple_choice',
    'checkboxes',
    'dropdown',
    'linear_scale',
    'date',
    'time'
  ]),
  choices: z.array(z.string().min(1).max(200)).optional(),
  scale: z
    .object({
      min: z.number().int().min(0).max(1).default(0),
      max: z.number().int().min(2).max(10).default(5),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional()
    })
    .optional()
});

const UpdateFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  formType: z.enum(['survey', 'quiz', 'feedback', 'registration']).optional(),
  questions: z.array(QuestionSchema).default([])
});

router.put('/forms/:formId', requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const formId = String(req.params.formId || '').trim();
    if (!formId) return res.status(400).json({ error: { message: 'Missing formId', code: 'BAD_REQUEST' } });

    const parsed = UpdateFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: 'Invalid payload', code: 'BAD_REQUEST', details: parsed.error.flatten() } });
    }

    const { title, description, questions, formType } = parsed.data;

    const result = await syncFormFromSpecForUser({
      userId,
      formId,
      spec: { title, description: description || '', questions },
      formType
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

export default router;
