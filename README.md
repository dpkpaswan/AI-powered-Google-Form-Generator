# AI-powered Google Form Generator

Full-stack app: Node/Express backend + React/Vite frontend. Users sign in with Google and generate/manage Google Forms in their own Google account.

This README highlights local dev steps, environment variables, and the backend structure (recent reorganization of controllers/services/utils).

Summary
- Google user-consent OAuth (forms are owned by the signed-in user)
- AI-assisted form generation (Google Gemini)
- Google Forms API integration to create/update forms
- Metadata persistence in Supabase

Quick start (development)
1. Clone and install backend deps:

```powershell
npm install
```

2. Create a `.env` (copy from `.env.example`) and set required variables (see below).

3. Start backend (defaults to port 3000):

```powershell
npm run dev
```

4. Frontend (in another terminal):

```powershell
cd FRONTEND
npm install
npm run dev
```

Helpful developer scripts
- Check Supabase `forms` table (local env):

```powershell
node -r dotenv/config scripts/check-supabase.mjs
```

Environment variables (minimum)
- `PORT` (optional)
- `FRONTEND_APP_URL` (e.g. http://localhost:4028)
- `GEMINI_API_KEY` (Google Generative API key)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI` (e.g. http://localhost:3000/auth/google/callback)
- `SESSION_JWT_SECRET` (32+ chars)
- `TOKENS_ENCRYPTION_KEY_BASE64` (base64, 32 bytes)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (service role key; not the anon key)

Database
- Run SQL in `supabase/schema.sql` to create the required tables (`forms`, `form_questions`, ...).

Backend structure (high level)
- `src/controllers/` — Express route handlers (thin controllers). Controllers use `asyncHandler` to forward errors to the centralized middleware.
- `src/services/` — Business logic: Gemini integration, Google Forms API wrappers, Supabase queries.
- `src/utils/` — Small utilities added:
  - `asyncHandler.js` — wraps async route handlers
  - `appError.js` — structured `AppError` class for consistent errors
- `src/middlewares/` — auth, validation, rate limiting, error handler.

Error handling
- Controllers throw errors or rethrow service errors. The global `src/middlewares/errorHandler.js` logs and returns consistent JSON error responses.

Notes on recent refactor
- No runtime behavior was changed — refactors were focused on readability, consistent async handling, and introducing `AppError` for future use.
- If you want, I can convert service-level throws to `AppError` instances for even clearer error semantics.

Production / deployment
- Recommended: serve frontend and backend from the same origin (single service) so httpOnly session cookies work without cross-site issues.
- See `Dockerfile` and `render.yaml` for a reference single-service deployment.

Run and test
- Backend dev: `npm run dev`
- Frontend dev: `cd FRONTEND && npm run dev`
- Use the app at `http://localhost:4028` (frontend) which proxies API requests to `http://127.0.0.1:3000/api` in dev via Vite.

If anything here should be extended (examples, diagrams, or a CONTRIBUTING guide), tell me which section and I'll expand it.
