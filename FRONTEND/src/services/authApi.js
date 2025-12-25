import { formGeneratorApi } from './formGeneratorApi';

export function beginGoogleLogin() {
  // Goes through Vite proxy: /api/auth/google -> backend /auth/google
  window.location.assign('/api/auth/google');
}

export async function getMe() {
  const { data } = await formGeneratorApi.get('/me');
  return data;
}

export async function logout() {
  const { data } = await formGeneratorApi.post('/logout');
  return data;
}
