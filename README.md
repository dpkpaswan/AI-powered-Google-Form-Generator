<p align="center">
  <img src="docs/images/Dashboard .png" alt="AI Google Form Generator — Dashboard" width="720" />
</p>

<h1 align="center">🤖 AI-Powered Google Form Generator</h1>

<p align="center">
  <strong>Describe your form in plain English — get a fully‑configured Google Form in seconds.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen?logo=node.js" alt="Node ≥ 20" />
  <img src="https://img.shields.io/badge/react-18-61dafb?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/vite-5-646cff?logo=vite" alt="Vite 5" />
  <img src="https://img.shields.io/badge/express-4-000000?logo=express" alt="Express 4" />
  <img src="https://img.shields.io/badge/database-supabase-3ecf8e?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285f4?logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/license-proprietary-red" alt="License" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [API Endpoints](#-api-endpoints)
- [Developer Scripts](#-developer-scripts)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🌟 Overview

**AI-Powered Google Form Generator** is a full-stack web application that lets users sign in with their Google account and create professional Google Forms using natural language prompts. Powered by **Google Gemini AI**, the app interprets your description, generates structured questions, and publishes a real Google Form to your account — all in one click.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Google OAuth 2.0** | Secure user-consent login — forms are created in *your own* Google account |
| 🧠 **AI Form Generation** | Describe your form in plain text and Gemini AI generates structured questions |
| 📄 **Generate from Document** | Upload a PDF or DOCX and auto-generate a form from the document content |
| 📝 **Form Templates** | Quick-start templates for surveys, quizzes, feedback forms, and more |
| ✏️ **Edit Forms** | Modify generated forms before or after publishing |
| 📊 **Form Analytics** | Visualize response data with interactive charts (D3.js + Recharts) |
| 📂 **My Forms Dashboard** | View, manage, archive, and track all your generated forms |
| 🛡️ **Security** | Helmet, rate limiting, encrypted token storage, Zod validation |
| 🐳 **Docker Ready** | Multi-stage Dockerfile for single-service production deployment |

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><strong>Sign In</strong></td>
    <td align="center"><strong>Dashboard</strong></td>
  </tr>
  <tr>
    <td><img src="docs/images/Sign in with Google.png" alt="Sign In" width="400" /></td>
    <td><img src="docs/images/Dashboard .png" alt="Dashboard" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Create Form with AI</strong></td>
    <td align="center"><strong>My Forms</strong></td>
  </tr>
  <tr>
    <td><img src="docs/images/Create Form with AI.png" alt="Create Form" width="400" /></td>
    <td><img src="docs/images/My Forms.png" alt="My Forms" width="400" /></td>
  </tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React + Vite (SPA)                    │
│  TailwindCSS · Framer Motion · Redux Toolkit · Recharts │
└────────────────────────┬────────────────────────────────┘
                         │  /api/* (Vite proxy in dev)
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Node.js + Express Backend                  │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │ Controllers │→│  Services  │→│  External APIs     │  │
│  │  (thin)     │  │ (business  │  │  • Google Forms   │  │
│  │             │  │  logic)    │  │  • Google OAuth   │  │
│  └────────────┘  └────────────┘  │  • Google Gemini  │  │
│                                   └───────────────────┘  │
│  Middlewares: auth · rateLimit · validate · errorHandler  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                Supabase (PostgreSQL)                      │
│  Tables: users · user_google_tokens · forms              │
│          form_questions · form_analytics                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js ≥ 20** | Runtime |
| **Express 4** | HTTP framework |
| **Google Gemini** | AI-powered question generation |
| **googleapis** | Google Forms & OAuth integration |
| **Supabase JS** | Database client (PostgreSQL) |
| **Zod** | Environment & request validation |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **jsonwebtoken** | Session JWT tokens |
| **Pino** | Structured JSON logging |
| **Multer** | File upload handling |
| **pdf-parse / Mammoth** | Document text extraction (PDF & DOCX) |

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **Redux Toolkit** | Global state management |
| **TailwindCSS 3** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **React Router v6** | Client-side routing |
| **React Hook Form** | Form handling & validation |
| **D3.js + Recharts** | Data visualization & charts |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |

---

## 📁 Project Structure

```
AI-powered-Google-Form-Generator/
│
├── src/                            # ── Backend (Node + Express) ──
│   ├── server.js                   # Entry point — starts HTTP server
│   ├── app.js                      # Express app factory (middleware, routes, static)
│   ├── config/
│   │   └── env.js                  # Zod-validated environment variables
│   ├── controllers/
│   │   ├── generateFormController.js       # AI form generation
│   │   ├── generateFromDocumentController.js # Document → form
│   │   ├── extractFromImagesController.js    # Image → form
│   │   ├── formsController.js              # CRUD for user forms
│   │   ├── formTemplateController.js       # Template endpoints
│   │   ├── improveFormController.js        # AI form improvement
│   │   └── analyticsController.js          # Response analytics
│   ├── services/
│   │   ├── geminiService.js        # Google Gemini AI integration
│   │   ├── googleFormsService.js   # Google Forms API wrapper
│   │   ├── googleOAuthService.js   # OAuth2 token management
│   │   ├── userFormsService.js     # Form CRUD (Supabase)
│   │   ├── userGoogleFormsService.js # User-scoped Google Forms ops
│   │   ├── analyticsService.js     # Response analytics logic
│   │   ├── documentFormService.js  # PDF/DOCX text extraction
│   │   ├── formTemplateService.js  # Template management
│   │   ├── formImprovementService.js      # Form improvement logic
│   │   ├── aiFormImprovementService.js    # AI-powered improvements
│   │   ├── sessionService.js       # JWT session helpers
│   │   └── supabaseClient.js       # Supabase client init
│   ├── middlewares/
│   │   ├── auth.js                 # JWT cookie authentication
│   │   ├── requireUser.js          # Require authenticated user
│   │   ├── validate.js             # Request body validation
│   │   ├── rateLimit.js            # Rate-limiting config
│   │   └── errorHandler.js         # Global error handler
│   ├── routes/
│   │   ├── authRoute.js            # /auth/* — login, callback, logout
│   │   ├── generateFormRoute.js    # /generate — AI generation
│   │   └── formsRoute.js           # /forms/* — CRUD, analytics, templates
│   └── utils/
│       ├── appError.js             # Structured AppError class
│       ├── asyncHandler.js         # Async route wrapper
│       ├── crypto.js               # Token encryption/decryption
│       ├── formTemplates.js        # Built-in template definitions
│       └── logger.js               # Pino logger instance
│
├── FRONTEND/                       # ── Frontend (React + Vite) ──
│   ├── src/
│   │   ├── index.jsx               # React entry point
│   │   ├── App.jsx                 # Root app component
│   │   ├── Routes.jsx              # Route definitions
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page-level components
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   ├── create-form/        # AI form creation
│   │   │   ├── generate-from-document/ # Document upload → form
│   │   │   ├── my-forms/           # Form management
│   │   │   ├── edit-form/          # Form editor
│   │   │   ├── form-analytics/     # Response analytics
│   │   │   ├── templates/          # Template browser
│   │   │   ├── profile/            # User profile
│   │   │   └── login/              # Google sign-in
│   │   ├── context/                # React context providers
│   │   ├── services/               # API service layer
│   │   ├── styles/                 # Global CSS
│   │   └── utils/                  # Frontend utilities
│   ├── vite.config.mjs             # Vite config + API proxy
│   ├── tailwind.config.js          # TailwindCSS config
│   └── package.json
│
├── supabase/
│   └── schema.sql                  # Database schema (PostgreSQL)
│
├── scripts/                        # Developer utility scripts
│   ├── check-supabase.mjs          # Verify Supabase connection
│   ├── test-gemini.js              # Test Gemini API
│   ├── test-generate.js            # Test form generation
│   └── ...                         # More test/debug scripts
│
├── docs/images/                    # Screenshots for docs
├── Dockerfile                      # Multi-stage production build
├── render.yaml                     # Render.com deploy config
├── package.json                    # Backend dependencies & scripts
├── eslint.config.js                # ESLint flat config
└── LICENSE                         # Proprietary (evaluation-only)
```

---

## 📋 Prerequisites

- **Node.js ≥ 20** — [Download](https://nodejs.org/)
- **npm** (bundled with Node.js)
- **Google Cloud Project** with the following APIs enabled:
  - Google Forms API
  - Google Drive API (for form permissions)
- **OAuth 2.0 Credentials** (Web application type) — [Console](https://console.cloud.google.com/apis/credentials)
- **Google Gemini API Key** — [AI Studio](https://aistudio.google.com/apikey)
- **Supabase Project** — [supabase.com](https://supabase.com/)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/AI-powered-Google-Form-Generator.git
cd AI-powered-Google-Form-Generator
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd FRONTEND
npm install
cd ..
```

### 4. Configure environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

> See [Environment Variables](#-environment-variables) for the full reference.

### 5. Set up the database

Run the SQL schema against your Supabase project:

```bash
# Copy contents of supabase/schema.sql into your Supabase SQL Editor and execute
```

### 6. Start development servers

**Terminal 1 — Backend** (port 3000):
```bash
npm run dev
```

**Terminal 2 — Frontend** (port 4028):
```bash
cd FRONTEND
npm run dev
```

### 7. Open the app

Navigate to **[http://localhost:4028](http://localhost:4028)** — sign in with Google and start generating forms!

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description |
|---|:---:|---|
| `PORT` | · | Backend port (default: `3000`) |
| `NODE_ENV` | · | `development` or `production` |
| `FRONTEND_APP_URL` | ✅ | Frontend URL (e.g., `http://localhost:4028`) |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GOOGLE_OAUTH_CLIENT_ID` | ✅ | OAuth 2.0 client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ✅ | OAuth 2.0 client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | ✅ | OAuth callback URL (e.g., `http://localhost:3000/auth/google/callback`) |
| `SESSION_JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `TOKENS_ENCRYPTION_KEY_BASE64` | ✅ | AES encryption key for tokens (base64, 32 bytes) |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase **service role** key (not the anon key) |

> **⚠️ Important:** Do not use the Supabase `anon` key — the app will detect this and throw an error at startup.

---

## 🗄️ Database Setup

Execute the schema in `supabase/schema.sql` via the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql). This creates:

| Table | Purpose |
|---|---|
| `users` | Google-authenticated user profiles |
| `user_google_tokens` | Encrypted OAuth refresh tokens |
| `forms` | Form metadata (title, prompt, URLs, settings) |
| `form_questions` | Individual questions per form |
| `form_analytics` | Cached response analytics (reduces API calls) |

---

## 🛣️ API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | OAuth callback handler |
| `GET` | `/auth/me` | Get current user info |
| `POST` | `/auth/logout` | Clear session & logout |

### Form Generation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Generate a form from a text prompt |
| `POST` | `/generate/from-document` | Generate a form from an uploaded document |
| `POST` | `/generate/from-images` | Generate a form from uploaded images |

### Form Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/forms` | List all user forms |
| `GET` | `/forms/:id` | Get form details |
| `PATCH` | `/forms/:id` | Update form metadata |
| `DELETE` | `/forms/:id` | Delete / archive a form |
| `POST` | `/forms/:id/improve` | AI-powered form improvement |
| `GET` | `/forms/:id/analytics` | Get response analytics |

### Templates

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/templates` | List available form templates |

> All endpoints are also available under the `/api` prefix (e.g., `/api/generate`).

---

## 🧪 Developer Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend with `--watch` (auto-restart on changes) |
| `npm run start` | Start backend in production mode |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint on backend code |

### Utility Scripts (`scripts/`)

```bash
# Verify Supabase connection & list forms
node -r dotenv/config scripts/check-supabase.mjs

# Test Gemini API connectivity
node -r dotenv/config scripts/test-gemini.js

# Test full form generation pipeline
node -r dotenv/config scripts/test-generate.js

# Test Google Forms API directly
node -r dotenv/config scripts/test-google-create-form.js
```

---

## 🚢 Deployment

### Docker (Recommended)

The included multi-stage `Dockerfile` builds the React frontend and serves everything from a single Express server:

```bash
docker build -t ai-form-generator .
docker run -p 3000:3000 --env-file .env ai-form-generator
```

### Render.com

A `render.yaml` blueprint is included for one-click deployment:

1. Connect your GitHub repo to [Render](https://render.com)
2. Use the **Blueprint** feature and select `render.yaml`
3. Set the required environment variables in the Render dashboard
4. Deploy — the app will be live at your Render URL

> **Production Note:** The backend serves the built frontend from `FRONTEND/build/` in production, ensuring same-origin cookies work without cross-site configurations.

---

