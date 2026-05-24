# 360 Hire — Project Conventions

## HARD CONSTRAINT — DO NOT MODIFY THE 360 EVALUATE APP

This project lives at `C:\Users\bolve\360_hire` and is a fork-style sibling of `C:\Users\bolve\360_app` (360 Evaluate). The 360 Evaluate app is in PRODUCTION. From this project, you must NEVER edit, write to, or push commits in the `360_app` folder. If you need code from it, copy it over.

If you accidentally find yourself editing files under `C:\Users\bolve\360_app`, STOP and undo.

## Domain

360 Hire assesses external job candidates against a job description. One candidate completes one in-depth conversational AI interview per application; the platform produces a job-fit match and a hire/no-hire recommendation. There are no peers, no bosses, no 360 feedback — just a single deep interview with the candidate.

## Stack
- Next.js 14 App Router + TypeScript
- Separate Supabase project (NOT the 360 Evaluate project)
- Anthropic Claude (model `claude-sonnet-4-6` for the interview)
- OpenAI Whisper for live voice transcription
- Browser SpeechSynthesis for AI voice output
- Vercel Blob for CV uploads + continuous interview video
- Resend for candidate invitation emails
- Inline styles (no Tailwind), port 3003 locally

## Style
- EN and ES throughout (default to candidate's `preferred_language`).
- No em or en dashes in any product surface or AI-generated text (same rule as 360 Evaluate).
- Inline styles, neutral palette + #0F3D3E (dark teal) accent.

## Vercel best practices (carried from 360 Evaluate)
- Vercel Functions are stateless + ephemeral; use Blob or Marketplace integrations for state.
- Edge Functions standalone are deprecated; prefer Vercel Functions.
- Don't start on Vercel KV/Postgres (discontinued); use Marketplace Redis/Postgres.
- Store secrets in Vercel Env Variables; never `NEXT_PUBLIC_*`.
- Use `waitUntil` for post-response work; avoid the deprecated `context` parameter.
- Set Function regions near the primary data source (Supabase).
- Tune Fluid Compute knobs (`maxDuration`, memory) for long LLM/STT calls.
- Use Cron Jobs for schedules (UTC); cron triggers via HTTP GET on production URL.
- Use Vercel Blob for uploads/media (CVs, interview video).
- If Deployment Protection is on, use a bypass secret.
- Enable Web Analytics + Speed Insights early.
- AI Gateway is default in AI SDK; never trust model IDs from memory — `curl https://ai-gateway.vercel.sh/v1/models` first.

@MEMORY_PROTOCOL.md
