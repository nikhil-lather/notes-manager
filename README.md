# Notes Manager

## The Problem

Professionals and students sit through hours of meetings and lectures but leave with raw, unstructured notes. Converting those notes into actionable summaries, task lists, and follow-up emails takes 20–40 minutes every single time — time consistently wasted on formatting, not thinking. Teams miss deadlines because action items were buried in notes nobody re-read. Students lose key decisions within hours of class.

## The Solution

Notes Manager solves this in under 10 seconds using AI. Paste your raw notes and instantly get a structured summary, action items with owners and deadlines, and a ready-to-send follow-up email.

## My Thought Process

I started with the user, not the tech. The core pain is simple: notes are messy, and turning them into action takes too long. I picked a stateless, no-login tool so anyone can get value in seconds without friction. I chose Groq's free LLaMA model so the app works reliably without billing issues.

## Features NOT Built (Decision Log)

- **Voice recording / transcription** — Adds complexity and latency. Text input solves 80% of the problem and ships faster.
- **User auth & saved history** — Stateless tools are faster to ship. Users get immediate value without creating an account.
- **Multi-language support** — English-first is the right MVP call. Premature internationalization delays the core product.

## Tech Stack

- Frontend: React + Vite → Vercel
- Backend: Node.js + Express → Render
- AI: Groq API (LLaMA 3.1)
