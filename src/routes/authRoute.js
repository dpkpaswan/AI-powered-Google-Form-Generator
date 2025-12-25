import { Router } from 'express';
import { env } from '../config/env.js';
import {
  exchangeCodeForTokens,
  fetchGoogleUserProfile,
  getGoogleAuthUrl,
  newStateToken,
  upsertGoogleRefreshToken,
  upsertUserFromGoogleProfile
} from '../services/googleOAuthService.js';
import { getSessionCookieName, sessionCookieOptions, signSession } from '../services/sessionService.js';

const router = Router();

const OAUTH_STATE_COOKIE = 'oauth_state';

router.get('/auth/google', (req, res) => {
  const state = newStateToken();
  res.cookie(OAUTH_STATE_COOKIE, state, { ...sessionCookieOptions(req), maxAge: 10 * 60 * 1000 });
  return res.redirect(getGoogleAuthUrl(state));
});

router.get('/auth/google/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];

    if (!code || typeof code !== 'string') {
      return res.status(400).send('Missing code');
    }
    if (!state || typeof state !== 'string' || !expectedState || state !== expectedState) {
      return res.status(400).send('Invalid state');
    }

    res.clearCookie(OAUTH_STATE_COOKIE, sessionCookieOptions(req));

    const { oauth2, tokens } = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleUserProfile(oauth2);
    const user = await upsertUserFromGoogleProfile(profile);

    // Only store refresh token if provided.
    if (tokens?.refresh_token) {
      await upsertGoogleRefreshToken({
        userId: user.id,
        refreshToken: tokens.refresh_token,
        scopes: tokens.scope || ''
      });
    }

    const sessionJwt = signSession({ userId: user.id });
    res.cookie(getSessionCookieName(), sessionJwt, { ...sessionCookieOptions(req), maxAge: 14 * 24 * 60 * 60 * 1000 });

    return res.redirect(`${env.FRONTEND_APP_URL}/dashboard`);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.[getSessionCookieName()];
  if (!token) return res.json({ user: null });

  try {
    const { verifySession } = await import('../services/sessionService.js');
    const payload = verifySession(token);
    const userId = payload?.sub;
    if (!userId) return res.json({ user: null });

    const { supabase } = await import('../services/supabaseClient.js');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, picture, google_sub, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) return res.json({ user: null });
    return res.json({ user: data || null });
  } catch {
    return res.json({ user: null });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(getSessionCookieName(), sessionCookieOptions(req));
  res.json({ ok: true });
});

export default router;
