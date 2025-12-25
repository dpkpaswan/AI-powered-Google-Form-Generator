import { formGeneratorApi } from './formGeneratorApi';

export async function listMyForms() {
  const { data } = await formGeneratorApi.get('/forms');
  return data;
}

export async function getMyForm(formId) {
  const { data } = await formGeneratorApi.get(`/forms/${encodeURIComponent(formId)}`);
  return data;
}

export async function updateMyForm(formId, payload) {
  const { data } = await formGeneratorApi.put(`/forms/${encodeURIComponent(formId)}`, payload);
  return data;
}

export async function deleteMyForm(formId) {
  const { data } = await formGeneratorApi.delete(`/forms/${encodeURIComponent(formId)}`);
  return data;
}

export async function bulkArchiveMyForms({ formIds, archived = true }) {
  const { data } = await formGeneratorApi.post('/forms/bulk/archive', { formIds, archived });
  return data;
}
