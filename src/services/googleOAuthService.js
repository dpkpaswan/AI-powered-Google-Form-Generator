import crypto from 'node:crypto';
import { google } from 'googleapis';
import { env } from '../config/env.js';
import { supabase } from './supabaseClient.js';
import { decryptString, encryptString } from '../utils/crypto.js';

/* =========================================================
   REQUIRED GOOGLE SCOPES (Reduced & Secure)
========================================================= */
const REQUIRED_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/forms.body',
  // Reduced from full drive access
  'https://www.googleapis.com/auth/drive.file'
];

export function getGoogleScopes() {
  return [...REQUIRED_SCOPES];
}

/* =========================================================
   Create OAuth2 Client
========================================================= */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_OAUTH_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI
  );
}

/* =========================================================
   Generate Secure State Token (CSRF Protection)
========================================================= */
export function newStateToken() {
  return crypto.randomBytes(24).toString('base64url');
}

/* =========================================================
   Generate Google Auth URL
========================================================= */
export function getGoogleAuthUrl(state) {
  const oauth2 = createOAuth2Client();

  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // ensures refresh token
    include_granted_scopes: true,
    scope: REQUIRED_SCOPES,
    state
  });
}

/* =========================================================
   Exchange Authorization Code For Tokens
========================================================= */
export async function exchangeCodeForTokens(code) {
  const oauth2 = createOAuth2Client();

  try {
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);
    return { oauth2, tokens };
  } catch (err) {
    err.statusCode = 401;
    err.code = 'GOOGLE_TOKEN_EXCHANGE_FAILED';
    throw err;
  }
}

/* =========================================================
   Fetch Google User Profile
========================================================= */
export async function fetchGoogleUserProfile(oauth2) {
  const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });

  const { data } = await oauth2Api.userinfo.get();

  if (!data?.id || !data?.email) {
    const err = new Error('Google user profile missing id/email');
    err.statusCode = 502;
    err.code = 'GOOGLE_USERINFO_INVALID';
    throw err;
  }

  return {
    googleSub: data.id,
    email: data.email,
    name: data.name || null,
    picture: data.picture || null
  };
}

/* =========================================================
   Upsert User Into Supabase
========================================================= */
export async function upsertUserFromGoogleProfile(profile) {
  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('*')
    .eq('google_sub', profile.googleSub)
    .maybeSingle();

  if (findErr) throw findErr;

  if (existing?.id) {
    const { data: updated, error: updErr } = await supabase
      .from('users')
      .update({
        email: profile.email,
        name: profile.name,
        picture: profile.picture
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (updErr) throw updErr;
    return updated;
  }

  const { data: created, error: insErr } = await supabase
    .from('users')
    .insert({
      email: profile.email,
      google_sub: profile.googleSub,
      name: profile.name,
      picture: profile.picture
    })
    .select('*')
    .single();

  if (insErr) throw insErr;
  return created;
}

/* =========================================================
   Store / Update Google Refresh Token (Encrypted)
========================================================= */
export async function upsertGoogleRefreshToken({ userId, refreshToken, scopes }) {
  if (!refreshToken) {
    console.warn('No refresh token returned from Google.');
    return;
  }

  const enc = encryptString(refreshToken);
  const scopeStr = Array.isArray(scopes)
    ? scopes.join(' ')
    : String(scopes || '').trim();

  const { data: existing, error: findErr } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (findErr) throw findErr;

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from('user_google_tokens')
      .update({
        refresh_token_enc: enc,
        scopes: scopeStr,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (updErr) throw updErr;
    return;
  }

  const { error: insErr } = await supabase
    .from('user_google_tokens')
    .insert({
      user_id: userId,
      refresh_token_enc: enc,
      scopes: scopeStr
    });

  if (insErr) throw insErr;
}

/* =========================================================
   Get OAuth Client For Existing User
========================================================= */
export async function getOAuthClientForUser(userId) {
  const { data, error } = await supabase
    .from('user_google_tokens')
    .select('refresh_token_enc, scopes')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data?.refresh_token_enc) {
    const err = new Error('Google account not connected');
    err.statusCode = 401;
    err.code = 'GOOGLE_NOT_CONNECTED';
    throw err;
  }

  const refreshToken = decryptString(data.refresh_token_enc);
  const oauth2 = createOAuth2Client();

  oauth2.setCredentials({ refresh_token: refreshToken });

  // 🔥 Auto-update refresh token if Google rotates it
  oauth2.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await upsertGoogleRefreshToken({
        userId,
        refreshToken: tokens.refresh_token,
        scopes: data.scopes
      });
    }
  });

  return oauth2;
}