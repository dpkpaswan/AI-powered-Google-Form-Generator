import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().default('development'),

  // Legacy API key (deprecated). Keep optional for backwards compatibility,
  // but user-authenticated routes should not rely on it.
  API_KEY: z.string().optional().or(z.literal('')),

  OPENAI_API_KEY: z.string().min(10),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_VISION_MODEL: z.string().optional().or(z.literal('')),

  // OAuth2 (user consent)
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(10),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(10),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url(),

  // Session + token encryption
  SESSION_JWT_SECRET: z.string().min(32),
  TOKENS_ENCRYPTION_KEY_BASE64: z.string().min(44),

  // Frontend redirect after OAuth login
  FRONTEND_APP_URL: z.string().url().default('http://localhost:4028'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20)
});

export const env = EnvSchema.parse(process.env);

// Google auth mode: user-consent OAuth2 only.

// Helpful guard: users sometimes paste the anon JWT here by mistake.
// Supabase API keys are often JWTs; reject only the anon key.
function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadB64Url = parts[1];
  try {
    const payloadB64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64.padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

if (env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
  const payload = decodeJwtPayload(env.SUPABASE_SERVICE_ROLE_KEY);
  const role = payload?.role;
  if (role === 'anon') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is the anon key (JWT role="anon", ref="${payload?.ref ?? 'unknown'}"). Please use the Supabase service_role secret key from Project Settings → API.`
    );
  }
}
