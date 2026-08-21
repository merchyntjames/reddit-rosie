@AGENTS.md

# Reddit Rosie — Claude Code Context

## What is this project?
Reddit Rosie ("Rosie The Redditor") is an internal Reddit social listening and engagement tool for Merchynt. It monitors subreddits and keywords for relevant conversations, generates AI-drafted replies in multiple voices, and tracks engagement performance and API spend.

## Quick Reference
- **Repo:** https://github.com/merchyntjames/reddit-rosie (PUBLIC, and a GitHub **template repository**)
- **Live URL:** https://reddit-rosie.vercel.app
- **Local path:** `09 - Internal Tools/reddit-rosie/`
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Lucide React icons
- **Backend:** Supabase (Postgres + Auth) + Anthropic Claude API
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Dev server:** port 3001 (`.claude/launch.json`)
- **Git config:** user.name "James Sowers", user.email "james@merchynt.com"

## Current State (v1.5 — full backend, live data)
The app is fully wired: Supabase stores conversations, settings, drafts, activity and API usage; the Claude API generates drafts; a GitHub Actions cron feeds Reddit data in daily. `src/lib/mock-data.ts` is **no longer the data source** — it now only supplies fallback defaults for the Knowledgebase pages and the drafts route when Supabase has no saved values.

Keep the version in this heading in sync with the newest entry in `src/app/changelog/page.tsx`.

## Client Forks
This repo is a template for client copies of Rosie. `NEW-CLIENT-FORK.md` is the end-to-end playbook (repo → Supabase → Vercel/Actions → rebrand → verify), and `supabase/schema.sql` is the full schema export used to stand up a new database. If you change the schema, auth model, or required env vars, update both files.

## Architecture

### File Structure
```
src/
  app/
    page.tsx                      # Engagement Queue (main view)
    queue/page.tsx                # Re-exports page.tsx so /queue and / render the same view
    template.tsx                  # Wraps every page in AppShell (sidebar + mobile top bar)
    layout.tsx                    # Root layout, fonts, metadata, favicons
    globals.css                   # Tailwind v4 @theme inline block (brand colors)
    login/page.tsx                # Supabase email auth login
    activity/page.tsx             # Activity log
    settings/page.tsx             # Account settings + monitoring config
    changelog/page.tsx            # Product changelog
    knowledgebase/
      page.tsx                    # Knowledgebase index
      company/page.tsx            # Company knowledge
      product/page.tsx            # Product knowledge
      brand/page.tsx              # Brand voice
      creators/page.tsx           # Creator profiles
    api/
      reddit/route.ts             # GET conversations from Supabase; PATCH status / clear queue
      scan/route.ts               # POST — run an RSS scan on demand (maxDuration 60)
      drafts/route.ts             # POST — generate/reroll Claude drafts (maxDuration 120)
      dismiss/route.ts            # POST — dismiss with feedback reason
      settings/route.ts           # GET/PATCH the Supabase settings store
      activity/route.ts           # GET activity log
      stats/route.ts              # GET queue stats
      status/route.ts             # GET integration + last-scan status (sidebar, queue header)
      spending/route.ts           # GET Claude API cost totals from api_usage
      auth/login|logout|callback  # Supabase auth routes
  components/
    AppShell.tsx                  # Layout shell: sidebar, mobile hamburger, backdrop
    Sidebar.tsx                   # Nav, integration status, user info, changelog link
    StatsBar.tsx                  # Stats cards row on Queue
    ConversationCard.tsx          # Expandable conversation card
    DraftPanel.tsx                # Draft display, copy, reroll, training submit
    FilterBar.tsx                 # Status filter tabs, Scan Now, Clear Queue
  lib/
    types.ts                      # Shared TypeScript interfaces
    drafts.ts                     # Claude draft generation, humanization, reroll, cost logging
    knowledgebase.ts              # Save-status hook for knowledgebase pages
    auth.ts                       # Current-user helper + sign out
    mock-data.ts                  # Fallback defaults only (see Current State)
    xpoz.ts                       # Vestigial Xpoz client — not in the live path
  utils/supabase/
    client.ts | server.ts | middleware.ts   # @supabase/ssr clients
  middleware.ts                   # Currently a pass-through (see Auth below)
scripts/
  fetch-reddit.mjs                # RSS scan run by GitHub Actions
  analyze-feedback.mjs            # Biweekly dismiss-feedback report
supabase/schema.sql               # Full schema export (tables, RLS, triggers, functions)
```

### Navigation (sidebar order)
Engagement Queue → Knowledgebase (Company, Product, Brand Voice, Creator Profiles) → Activity Log → Account Settings. Changelog is linked separately at the bottom of the sidebar. There is **no Analytics page and no Roadmap page** — both were removed; don't reintroduce them without asking.

### Tailwind CSS v4
Tailwind v4 differs from v3:
- No `tailwind.config.ts` — colors live in `globals.css` in an `@theme inline` block
- Import syntax is `@import "tailwindcss";`
- Custom colors: navy, pink, blue, purple, green, orange, dark, muted, border, surface, background, foreground

### Brand Palette
Merchynt internal tool, so it uses the **Merchynt palette** (navy-led with pink accents), NOT the Paige palette:
- Navy `#0f007d` (primary), Pink `#dd0cf7` (accent), Blue `#0063fd`, Purple `#8b00cc`
- Green `#05c168` (success), Orange `#ff9e2c` (warning)
- Dark `#1c1f23` (body text), Muted `#8E8B84`, Border `#e5e5e5`, Surface `#f9fafb`
- Font: Geist Sans / Geist Mono via `next/font`

### Design Language
Modeled after Merchynt's Pixel Pete tool:
- Clean white cards, subtle borders, navy active states, muted helper text
- Lucide React icons throughout (no emojis — hard rule)
- Stats cards at the top of pages, card-based content with expandable details
- Fully responsive: sidebar becomes a slide-in overlay below 1024px, `p-4` mobile / `p-8` desktop

## Data Pipeline

```
GitHub Actions (daily 7am ET) → scripts/fetch-reddit.mjs
  → reads monitored_subreddits / monitored_keywords / quality_threshold from Supabase settings
  → fetches Reddit RSS (Atom XML), parses, scores relevance, filters by threshold
  → writes conversations to Supabase + public/data/conversations.json, logs to scan_history
  → commits and pushes → Vercel redeploys
Queue page → GET /api/reddit (Supabase) → falls back to /data/conversations.json
```

Settings edited in the UI change scan behavior on the next run — the script reads them from the database, with hardcoded defaults in `fetch-reddit.mjs` as the fallback. Users can also trigger a scan in-app via **Scan Now** (`POST /api/scan`).

### Why RSS instead of the Reddit API or Xpoz
- Reddit's Data API requires moderation-use-case approval (not our use case)
- Xpoz (MCP-only) fails in Vercel serverless functions
- RSS is public, free, needs no API key, returns full post content
- Limitation: RSS carries no upvote scores or comment counts

### Relevance scoring (in `scripts/fetch-reddit.mjs`)
Brand mentions, competitor mentions, topic terms, subreddit authority boosts, question/comparison bonuses, self-promotion penalty. Posts must clear the `quality_threshold` setting to enter the queue. Monitored subreddits and keywords are database-driven; the script's constants are defaults only.

### Posting: human-in-the-loop only
Per Reddit's Responsible Builder Policy, Rosie does **not** post to Reddit. It monitors and drafts; a human reviews, copies, and pastes manually. No bot registration, no automated posting. This is non-negotiable, including in client forks.

## Draft Generation
`src/lib/drafts.ts` + `POST /api/drafts`:
- Generates a **corporate** draft (we/us/our) and a **personal** draft per creator profile (I/me/my)
- Uses the Claude API with the **web search** tool enabled, then a separate humanization pass
- Supports **reroll** with user feedback, and training submissions (original vs. rewritten) for future tuning
- Reads Product Knowledge, Brand Voice, and Creator Profiles from the Supabase settings store, so Knowledgebase edits affect the very next draft
- Every call logs tokens and cost to `api_usage`; totals surface via `GET /api/spending`
- Model and per-token pricing are defined at the top of `drafts.ts` — update pricing there if the model changes

## Supabase

Nine tables, all with RLS enabled: `conversations`, `settings`, `scan_history`, `activity_log`, `user_conversation_statuses`, `dismiss_feedback`, `conversation_drafts`, `training_submissions`, `api_usage`. Full DDL in `supabase/schema.sql`.

`settings` is a key/JSONB store. Current keys: `brand_voice`, `creator_profiles`, `monitored_keywords`, `monitored_subreddits`, `product_knowledge`, `quality_threshold`, `scan_frequency`.

### Auth — read this before touching access control
Supabase email auth is **built** (login page, `/api/auth/*`, `lib/auth.ts`, `utils/supabase/*`) and a `restrict_email_domain()` database trigger limits signups to `@merchynt.com`. However, `src/middleware.ts` is currently a **pass-through with auth disabled** ("open access for now"), and several RLS policies grant the `anon` role broad read/update access. Combined with a public repo shipping the anon key in the client bundle, **treat the deployment as publicly reachable.** Don't describe the app as access-controlled, and don't put client-confidential data in it until middleware auth is re-enabled and the anon policies are tightened.

### Environment Variables
See `.env.example` for the full list. `.env.local` (gitignored) holds real values locally; Vercel project settings hold them in production; `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are also GitHub Actions secrets for the two workflows.

```
NEXT_PUBLIC_SUPABASE_URL            # set
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY # set
SUPABASE_SERVICE_ROLE_KEY           # set
ANTHROPIC_API_KEY                   # set (key name: reddit-rosie-api-key)
XPOZ_API_KEY                        # set, unused in the live path
```

**IMPORTANT:** the repo is public. Never commit keys.

## GitHub Actions
- `.github/workflows/refresh-reddit.yml` — daily 7am ET RSS scan, commits updated conversations
- `.github/workflows/analyze-feedback.yml` — 1st and 15th at 9am ET, writes a dismiss-feedback report to `reports/`

Both run as "Reddit Rosie Bot" `<rosie@merchynt.com>` and use the service-role key, which bypasses RLS.

## Mascot
"Rosie The Redditor" — chibi-style 3D character with reddish-orange hair in a bun, red polka-dot bandana, Merchynt navy hoodie, green eyes, confident smile, holding a tablet with an upvote arrow. Generated via Nano Banana Pro (Google Gemini). Lives at `public/rosie-logo.png`; favicons at 16/32/192/512px plus a 180px Apple touch icon.

## Development Workflows

### Changelog (REQUIRED after every feature or improvement)
The changelog lives at `src/app/changelog/page.tsx` in the `changelog` array. After completing any feature, improvement, or infrastructure change, add a new entry to the TOP of the array with:
- `id`: next sequential number (string)
- `version`: bump appropriately (see below)
- `date`: today's date (e.g., "June 6, 2026")
- `type`: `'feature'` | `'improvement'` | `'infrastructure'`
- `title`: short name of what was built
- `description`: 1-2 sentence summary
- `details`: optional array of bullet points

**Versioning convention:**
- `x.0` / `x.y` — new feature or major page addition (bump the minor version)
- `x.y.z` — improvement, bugfix, or iteration (bump the patch)
- Group related changes shipping in one commit under the same version

There is no longer a `planned`/roadmap array — the roadmap page was removed. Don't re-add one without asking.

### Integration Status (sidebar)
The sidebar reads live status from `GET /api/status`. These MUST reflect real state, never mock values:
- **Reddit / Claude API:** "Connected" (green) only when the integration is verified working
- **Last scan:** real timestamp from `scan_history`, or "Never"
- **Reddit Accounts:** "No accounts connected" until OAuth tokens are stored and validated. Never show fake accounts as active.

### CLAUDE.md Maintenance
When architecture changes meaningfully (new pages, new API routes, new integrations, changed conventions), update this file — and keep the "Current State" version in sync with the newest changelog entry.

## Pushing Changes
```bash
cd "09 - Internal Tools/reddit-rosie"
git add -A && git commit -m "description" && git push
```
Auto-deploys to Vercel within ~30 seconds. Note the bot pushes daily, so `git pull` before starting work.

## Content Rules
- No emojis in any output (hard Merchynt brand rule)
- Lucide React icons only
- Confident, direct tone in all UI copy
- "Google Business Profile" on first mention, "GBP" is okay after that
