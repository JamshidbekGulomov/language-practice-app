# Language Practice Platform

Next.js + Tailwind + Supabase app for practicing listening, reading,
vocabulary, writing, speaking, and translation.

## Stack

- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Database / Auth / Storage**: Supabase
- **Hosting**: Vercel

## Phase 0 (current)

Foundation only: scaffold, Supabase auth (student + admin roles), base
layout/nav, empty landing pages for all 6 modules, first Vercel deploy.
No module features yet — those land in later phases.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project values
npm run dev
```

## Environment variables

| Variable | Where it's used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (bypasses RLS) | **Yes — never commit or expose to the client** |

## Deployment

Hosted on Vercel, auto-deploying from the `claude/language-platform-phase-0-wipphb`
branch. Environment variables are configured in the Vercel project settings.

## Roles

Every signup creates a row in `public.profiles` via a database trigger.
Emails listed in `public.admin_emails` are granted the `admin` role
automatically; everyone else gets `student`. `/admin` redirects non-admins.
