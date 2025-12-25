import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import { getMyForm, updateMyForm } from '../../services/formsApi';

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'linear_scale', label: 'Linear scale' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' }
];

function parseChoices(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EditForm() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);

  const [responderUrl, setResponderUrl] = useState('');
  const [editUrl, setEditUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getMyForm(formId);
        if (cancelled) return;

        setTitle(data?.form?.title || '');
        setDescription(data?.form?.description || '');
        setQuestions(Array.isArray(data?.form?.questions) ? data.form.questions : []);
        setResponderUrl(data?.responderUrl || data?.metadata?.responder_url || '');
        setEditUrl(data?.editUrl || data?.metadata?.edit_url || '');
      } catch (e) {
        const msg = e?.response?.data?.error?.message || e?.message || 'Failed to load form.';
        setError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formId]);

  const canSave = useMemo(() => title.trim().length > 0 && !isSaving, [title, isSaving]);

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { title: 'New question', type: 'short_text', required: false }
    ]);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError('');

    try {
      await updateMyForm(formId, {
        title,
        description,
        questions: questions.map((q) => {
          const base = { title: q.title || '', type: q.type, required: !!q.required };
          if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
            const raw = Array.isArray(q.choices) ? q.choices.join('\n') : q.choicesText;
            return { ...base, choices: parseChoices(raw) };
          }
          if (q.type === 'linear_scale') {
            return { ...base, scale: q.scale || { min: 0, max: 5, minLabel: '', maxLabel: '' } };
          }
          return base;
        })
      });

      setToast('Saved to Google Forms');
      setTimeout(() => setToast(''), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error?.message || e?.message || 'Save failed.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const openExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Edit Form - AI Form Generator</title>
      </Helmet>
      <Header />

      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="font-heading font-semibold text-xl md:text-2xl text-foreground truncate">Edit Form</h1>
              <p className="text-sm text-muted-foreground truncate">{formId}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:flex-shrink-0">
              <Button variant="outline" size="default" onClick={() => navigate('/my-forms')} fullWidth className="sm:w-auto">Back</Button>
              <Button variant="outline" size="default" onClick={() => openExternal(responderUrl)} fullWidth className="sm:w-auto">Open Form</Button>
              <Button variant="outline" size="default" onClick={() => openExternal(editUrl)} fullWidth className="sm:w-auto">Open in Google</Button>
            </div>
          </div>

          {toast && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-foreground">
              {toast}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md text-sm text-error">
              {error}
            </div>
          )}

          <div className="bg-card rounded-lg shadow-elevation-3 border border-border p-4 md:p-6">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="space-y-5">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Form title"
                />

                <Input
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Form description"
                />

                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium text-foreground">Questions</h2>
                  <Button variant="outline" size="default" onClick={addQuestion}>
                    <div className="flex items-center gap-2">
                      <Icon name="Plus" size={16} />
                      Add
                    </div>
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const showChoices = q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown';
                    return (
                      <div key={idx} className="border border-border rounded-md p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <Input
                              label={`Question ${idx + 1}`}
                              value={q.title || ''}
                              onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                              placeholder="Question title"
                            />
                          </div>
                          <Button variant="ghost" size="default" onClick={() => removeQuestion(idx)}>
                            <Icon name="Trash2" size={18} />
                          </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label="Type"
                            value={q.type}
                            onChange={(e) => updateQuestion(idx, { type: e.target.value })}
                            options={QUESTION_TYPES}
                          />

                          <div className="flex items-end">
                            <Checkbox
                              label="Required"
                              checked={!!q.required}
                              onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                            />
                          </div>
                        </div>

                        {showChoices && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-foreground mb-2">Choices (one per line)</label>
                            <textarea
                              className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                              value={Array.isArray(q.choices) ? q.choices.join('\n') : (q.choicesText || '')}
                              onChange={(e) => updateQuestion(idx, { choicesText: e.target.value })}
                              placeholder={'Option 1\nOption 2'}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="default" size="default" onClick={handleSave} disabled={!canSave}>
                    {isSaving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
