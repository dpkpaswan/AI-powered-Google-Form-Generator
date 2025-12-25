const STORAGE_KEY = 'ai_form_generator_forms_v1';

export const FORMS_CHANGED_EVENT = 'ai_form_generator_forms_changed';

function notifyFormsChanged() {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event(FORMS_CHANGED_EVENT));
    }
  } catch {
    // no-op
  }
}

export function loadSavedForms() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFormToStorage(form) {
  const forms = loadSavedForms();
  const next = [form, ...forms.filter((f) => f?.id !== form?.id)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyFormsChanged();
  return next;
}

export function deleteFormFromStorage(formId) {
  const forms = loadSavedForms();
  const next = forms.filter((f) => f?.id !== formId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyFormsChanged();
  return next;
}

export function clearFormsStorage() {
  window.localStorage.removeItem(STORAGE_KEY);
  notifyFormsChanged();
}
