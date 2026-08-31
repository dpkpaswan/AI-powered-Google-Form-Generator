# How I Built This

## The problem

I noticed staff at my college manually creating Google Forms one field at a time — writing out each question, setting the type, configuring options — for things like feedback forms, event registrations, and surveys. It was repetitive and slow for something that could be described in a sentence or two. That gap is what started this project: could a plain-English description turn into a fully structured Google Form automatically?

## Planning the architecture

I split the system into three layers from the start:

- **Frontend (React + Vite)** — where the user writes a prompt or uploads a document
- **Backend (Node + Express)** — orchestrates the AI call, talks to Google's APIs, handles auth
- **Supabase (PostgreSQL)** — stores form metadata, user tokens, and cached analytics so I'm not hitting Google's APIs repeatedly

I used Google OAuth so forms are created directly in the user's own Google account rather than a shared service account — this matters for a real deployment, since staff need forms that belong to them, not to an app.

## The hardest problem: getting Gemini to output usable form structure

The core challenge wasn't calling the Gemini API — that part is straightforward. The real problem was that **Gemini's natural output didn't map cleanly onto the Google Forms API's expected structure.**

Google Forms API expects a specific, rigid schema: each question needs a defined type (`textQuestion`, `choiceQuestion`, `scaleQuestion`, etc.), and each type has its own required fields and constraints. Gemini, left to its own devices, would:

- Generate question types that don't exist in the Forms API
- Miss required nested fields for certain question types
- Produce inconsistent formatting between requests, even for similar prompts

This meant a decent chunk of generated forms would either fail on submission to Google's API or come out structurally wrong (e.g. a multiple-choice question missing its options array).

## How I fixed it

I fixed this primarily through **stricter prompt engineering** — rewriting the system instructions sent to Gemini to:

- Explicitly enumerate the exact question types the Google Forms API supports, with no room for invented types
- Provide a fixed output schema in the prompt itself, so Gemini's response structure directly mirrors what `googleapis` expects
- Give concrete examples of correctly-formed question objects for each type, so the model has a pattern to follow rather than inferring structure from scratch

This took several iterations — vague instructions produced vague, inconsistent output; overly rigid instructions sometimes made Gemini ignore parts of the user's actual prompt. The balance was giving it a hard structural contract while leaving room for it to interpret the content of the request.

## What I'd do differently

Prompt engineering alone gets you most of the way, but it's not a guarantee — a model can still drift from instructions on edge-case prompts. A schema validation layer (e.g. Zod) sitting between Gemini's output and the Google Forms API call would catch and reject malformed structures before they hit Google's API, rather than relying entirely on the prompt to prevent bad output. That's the next thing I'd add if I extended this project.

## Stack summary

- **Frontend:** React 18, Vite 5, Redux Toolkit, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express 4, Google Gemini API, googleapis (OAuth + Forms)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Docker, Render

Full technical details, setup instructions, and API endpoints are in [README.md](./README.md).
