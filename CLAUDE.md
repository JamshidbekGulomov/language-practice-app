# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

A language-practice platform (listening, reading, vocabulary, writing, speaking, translation) built with Next.js App Router, Supabase (Postgres + Auth + Storage), and deployed on Vercel. Content is managed entirely through an admin dashboard (`/admin`) — there is no seed data or CMS outside the app itself.

Live Supabase project ref: `uxtjjkmxkhhtnozuokpw`. Deployed from the `claude/language-platform-phase-0-wipphb` branch to the Vercel project `language-practice-app` (auto-deploys on push).

## Commands

```bash
npm run dev      # dev server
npm run build    # production build — run this + npx tsc --noEmit before considering any change done
npm run lint     # eslint (flat config, eslint-config-next)
npx tsc --noEmit # typecheck only, faster than a full build
```

There is no test suite. Verification is: typecheck → `npm run build` → `npm run lint`, all clean, before pushing.

## Environment variables

| Variable | Used by | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | No |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, bypasses RLS | **Yes** |
| `GEMINI_API_KEY` | server only (`src/lib/ai/gemini.ts`) | **Yes** |
| `GEMINI_MODEL` | server only, defaults to `gemini-3.6-flash` | No |

Local dev: `cp .env.local.example .env.local` and fill in values (gitignored). Production values live in Vercel's project env settings.

## Auth & roles

Every signup fires a Postgres trigger that inserts a `public.profiles` row; the trigger grants `role = 'admin'` if the email is in `public.admin_emails`, else `'student'`. `getCurrentProfile()` (`src/lib/supabase/get-profile.ts`) reads the current user + profile. `requireAdmin()` (`src/lib/supabase/require-admin.ts`) re-checks the role and redirects if it fails — call this at the top of every admin page/layout **and every admin Server Action**, since route-level gating alone doesn't protect an action that's reachable directly.

**Students sign up with just a username + password, no real email.** Supabase Auth still requires an email internally, so `src/lib/auth/username.ts` derives a deterministic, non-deliverable one (`{username}@users.linguapractice.local`) — login re-derives the same email from whatever username is typed, so no DB lookup is needed either way. `profiles.display_name` doubles as the username (unique index on `lower(display_name)`), set via a service-role update right after `signUp()` since the trigger itself doesn't know about it. The login field accepts either a username or a real email (`looksLikeEmail()` picks which), so admin/Google accounts — which have real emails — keep working through the same form. Two consequences worth remembering: this only works because "Confirm email" must stay off in Supabase (a fake domain can never receive a confirmation link — this was already a soft dependency before, now it's a hard one), and username accounts have no password-recovery path at all (no real inbox to send a reset link to) — there's deliberately no "forgot password" link in the UI for that reason.

Three Supabase client variants (`src/lib/supabase/`):
- `client.ts` — browser client (Client Components).
- `server.ts` — request-scoped server client using cookies; respects RLS as the signed-in user. Used for all public reads and student writes (scores, submissions).
- `admin.ts` — `createAdminClient()`, service-role key, bypasses RLS entirely. Used only inside admin Server Actions, always after `requireAdmin()`.

Public content tables (categories/words/clips/passages/lessons) have `select` RLS policies open to `anon, authenticated`; there are deliberately no write policies for them — all admin writes go through the service-role client instead, gated by `requireAdmin()` in code rather than RLS. Scores and `profiles` themselves are the exception: their `select` policies are scoped to `authenticated` only (not `anon`), so leaderboards — including the global one below — only populate for signed-in visitors; a logged-out visitor sees an empty board, not an error.

## The module pattern

Vocabulary, Listening, and Reading are structurally identical and share code — this is the shape any new module (Speaking, Translation) or any change to game mechanics should follow:

- **DB**: a content table (`vocab_categories` / `listening_clips` / `reading_passages`), a `*_words` table with `word` + `meaning`, and a `*_scores` table (`user_id`, content FK, `game_mode`, `score`, `total`) with public `select` (leaderboard) and student-own `insert`.
- **Admin**: `/admin/<module>` list+create, `/admin/<module>/[id]` detail page managing that item's words (single-add form + CSV/XLSX bulk upload parsed client-side via `xlsx`).
- **Public**: `/<module>` list, `/<module>/[slug]` detail with a game-mode picker + leaderboards, `/<module>/[slug]/<mode>` game pages. Games require login (`getCurrentProfile()` → `redirect("/login")` if absent); browsing does not.
- **Shared building blocks** (`src/components/`, `src/lib/`) used across all three: `MatchingGame`, `MultipleChoiceGame`, `FillBlankGame`, `Leaderboard`, plus `build-mc-questions.ts`, `fill-blank.ts`, `sample.ts` (`MATCHING_ROUND_SIZE`), `slugify.ts`, `leaderboard.ts` (the `LeaderboardRow` type). If a game mechanic needs to change, it usually belongs here, not in one module — a fix in `MatchingGame` affects Vocabulary, Listening, and Reading at once.

`leaderboard.ts` also exports `getGlobalLeaderboard()`, backing `/leaderboard` — "diamonds" are just `score` (correct answers) summed across `vocab_scores` + `listening_scores` + `reading_scores` per user. No new table: it runs three plain selects (each with the same `profiles(display_name, email)` embed the per-category leaderboards already use) and reduces them into totals in JS, since PostgREST can't aggregate across tables in one request. Fine at this scale; would need a real SQL view if the row counts ever got large.

**Writing is intentionally different**: it's a linear flow (watch video → gap-fill unlocks sentence-construction) with no public leaderboard — `writing_gap_fill_results` and `writing_sentence_submissions` are private to the student and the admin (via a review queue at `/admin/writing/review`, service-role client, no student update policy). Sentence-submission mutations (self-check, send-to-teacher) go through Server Actions that manually re-verify `auth.uid()` ownership before writing with the service-role client, rather than relying on an RLS update policy.

**Speaking follows the Writing shape, not the Vocabulary/Listening/Reading one** (speech can't be auto-graded either): a `speaking_topics` content table (`title` + `prompt`), `speaking_questions` (guided follow-up questions) and `speaking_hints` (`word` + `meaning`, with the same single-add + CSV/XLSX bulk upload as the other modules' `*_words` tables), and `speaking_submissions` (private, self-check + send-to-teacher, reviewed at `/admin/speaking/review`) — same manual-ownership-check-then-service-role-write pattern as `writing_sentence_submissions`. The one real difference from Writing: recordings are personal, not admin-authored content, so `speaking-audio` is a **private** Storage bucket (unlike the public `listening-audio` one) — playback always goes through a short-lived `createSignedUrl()` from the service-role client (`getSpeakingAudioUrl` in `src/lib/speaking/queries.ts`), never a public path. The upload side reuses the same signed-upload-URL flow as Listening, but any logged-in student can call `createUploadUrl` (not admin-gated), and it derives the storage path from the authenticated user's id server-side rather than trusting a client-supplied one. Recording itself is browser `MediaRecorder` (`src/components/speaking/audio-recorder.tsx`), not a file picker.

Every `speaking_topics` row also carries `exam` (`'cefr' | 'ielts'`), `part` (e.g. `'part1'`, `'part1_1'`, `'part2'`, `'part3'`), and `format` (`'qa' | 'cue_card' | 'images'`). `src/lib/speaking/exams.ts` (`SPEAKING_EXAMS`) is the single source of truth for which parts exist per exam, what format each renders as, and its practice mechanic (`imageCount`, `questionCount`, `prepSeconds`/`maxSeconds`) — a DB check constraint on `speaking_topics` mirrors the (exam, part, format) combinations, so an admin can't create an invalid pairing. Public routes are nested under the exam: `/speaking` (pick CEFR or IELTS) → `/speaking/[exam]` (parts, each listing its topics) → `/speaking/[exam]/[slug]` (the topic itself).

The three formats are three distinct **practice mechanics**, not just different content shapes:
- **`qa`** (IELTS 1/3, CEFR 1): an open-ended, admin-uploaded list of questions. `QaPractice` (`src/components/speaking/qa-practice.tsx`) renders them one at a time, each with its own `AudioRecorder` → its own self-check/send-to-teacher — same per-item-submission shape as Writing's sentence prompts. This is why `speaking_submissions` has a nullable `question_id`: qa answers are one row per question, everything else is one row per topic (`question_id is null`) — `getMySubmission` vs. `getMyQuestionSubmissions` in `src/lib/speaking/queries.ts` split on that.
- **`cue_card`** (IELTS/CEFR Part 2): a single take, but with real exam timing — `AudioRecorder` takes optional `prepSeconds`/`maxSeconds` props, runs a silent prep countdown, then auto-starts recording and auto-stops at the limit (both currently 60s/120s in `exams.ts`).
- **`images`** (CEFR 1.1/3): a single untimed take against 1-2 images. `questionCount` here means something different from `qa`'s open list — it's an exact required count enforced by `addQuestion` (`src/app/admin/speaking/actions.ts`): 3 for CEFR 1.1 (tied to the two images), 0 for CEFR 3 (no questions section at all, just "describe this picture").

Images (capped the same way, via `addImage`) live in `speaking_images`, in a **public** `speaking-images` bucket (admin-authored content, not personal, so no signed URLs needed) uploaded via the same signed-upload-URL flow as audio. Rendering them through `next/image` required whitelisting the Supabase Storage host in `next.config.ts`'s `images.remotePatterns`, derived from `NEXT_PUBLIC_SUPABASE_URL` at build time.

**Translation follows the Writing shape too** — it's the same linear, self-check + send-to-teacher pattern, just with translation sentences instead of a video lesson: `translation_levels` (`title` + `slug` + `description`, e.g. "Beginner", "A2") group `translation_sentences` (`uzbek_text` + optional `model_answer`), and `translation_submissions` is the student's English translation of one sentence — private, reviewed at `/admin/translation/review`, same manual-ownership-check-then-service-role-write mutations as `writing_sentence_submissions`. `src/components/translation/sentence-exercises.tsx` is a near-exact copy of Writing's `SentenceExercises` (a textarea instead of building from given words). Unlike Writing, there's no unlock gate — all sentences in a level are open at once, since there's no separate exercise-that-precedes-it. Bulk CSV/XLSX upload for sentences follows the same `xlsx`-in-a-`"use client"`-component pattern as the other modules' word lists.

## AI assist (Gemini, optional)

`src/lib/ai/gemini.ts` wraps the Gemini REST API directly (plain `fetch`, no SDK dependency) behind `GEMINI_API_KEY` — every call is best-effort and degrades silently if the key isn't set or the request fails, since neither feature is load-bearing:
- **Speaking submissions**: right after a student submits a recording (`submitRecording` in `src/app/speaking/actions.ts`), `AudioRecorder` calls `analyzeSubmission`, which downloads the audio via the service-role client and asks Gemini (multimodal, audio input directly — no separate transcription step) for a transcript + short written feedback, stored on `speaking_submissions.ai_transcript`/`ai_feedback`. Shown in `SubmissionPanel` and the admin review queue as "AI first pass", clearly separate from the teacher's own feedback — it's a head start, not a grade.
- **Vocabulary admin**: `WordForm` (`src/components/admin/vocab/word-form.tsx`) has a "Suggest with AI" button that sends the English word to `suggestWord` (`src/app/admin/vocabulary/actions.ts`) and fills the Uzbek/synonym/example/difficulty fields from the response — admin still reviews and edits before saving, this just saves the manual lookup.

Both call sites treat a missing/failing key as a no-op rather than an error: `analyzeSubmission` catches and leaves the AI columns null, and `suggestWord`'s only hard failure is an empty input.

## Generic CRUD scaffolding

`src/lib/admin/crud.ts` (`adminList`, `adminInsert`, `adminInsertMany`, `adminUpdate`, `adminDelete`) wraps the service-role client with a `requireAdmin()` check on every call — every module's admin actions call these instead of touching Supabase directly. `adminList`'s `eq` filter accepts string/number/boolean.

`DataTable` (`src/components/admin/data-table.tsx`) is the generic list-with-delete component. **Do not define its `columns[].render` functions inline in a Server Component page and pass them down** — Next.js RSC only allows plain data or actual Server Actions across the server→client boundary, not arbitrary closures, and this fails at runtime (not at build time) with "Functions cannot be passed directly to Client Components." Instead, wrap `DataTable` in a small `"use client"` component per module (e.g. `src/components/admin/vocab/vocab-categories-table.tsx`) that defines its own `columns` locally and takes only plain data + bound Server Actions as props.

## Supabase-specific gotchas hit in this repo

- **PostgREST schema cache**: after a migration that adds a foreign key to an *existing* table (not at `create table` time), embedded selects like `.select("*, profiles(email)")` can fail until the cache refreshes. Run `notify pgrst, 'reload schema';` via `execute_sql` after such a migration.
- **`xlsx` package**: the npm-published version has known prototype-pollution/ReDoS CVEs with no fix available. It is only ever imported in `"use client"` upload-form components (parsing happens in the admin's browser); never import it in server code. Only clean, validated row objects get sent to Server Actions.
- **Large file uploads (audio)**: Vercel Serverless Functions cap request bodies at 4.5MB, so Server Actions can't carry an audio file directly. The Listening module's upload flow (`src/app/admin/listening/actions.ts` `createUploadUrl` + `src/components/admin/listening/new-clip-form.tsx`) instead has the browser upload straight to Supabase Storage via a signed upload URL; only the resulting storage path touches the server.
- **Video embeds** (Writing module): `src/lib/writing/video-embed.ts` auto-detects YouTube vs. Telegram-channel-post links from a single "video link" field. Telegram embeds use their official `telegram-widget.js` script (`src/components/writing/telegram-embed.tsx`), not a raw iframe — a bare `t.me/...?embed=1` iframe doesn't size itself correctly.
