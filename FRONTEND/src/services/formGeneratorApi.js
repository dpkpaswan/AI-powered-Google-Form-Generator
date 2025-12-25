import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export const formGeneratorApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export async function generateForm({ prompt, formType, audience, language, tone }) {
  const { data } = await formGeneratorApi.post('/generate-form', {
    prompt,
    formType,
    audience,
    language,
    tone
  });

  return data;
}

export async function extractFromImages({ images }) {
  const files = Array.isArray(images) ? images : [];
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const { data } = await formGeneratorApi.post('/extract-from-images', formData);
  return data;
}
