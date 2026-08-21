# Creating a Client Fork of Reddit Rosie

This playbook lets a fresh Claude Code session (in any workspace) stand up a
rebranded copy of Reddit Rosie for a new client. The GitHub repo
`merchyntjames/reddit-rosie` is a **template repository** — new client copies
are created from it with clean history, not as GitHub forks.

**What Rosie is:** a Reddit social listening and engagement tool. It monitors
subreddits/keywords via RSS (GitHub Actions cron), scores relevance, stores
conversations in Supabase, generates AI reply drafts with the Claude API, and
requires a human to review and manually post every reply (Reddit Responsible
Builder Policy — keep this human-in-the-loop model for every client).

Work through the phases in order. Ask the operator for the inputs in
"Information needed" before starting.

## Information needed from the operator

- Client name + short slug (e.g. `acme` → repo `acme-rosie`)
- Client's industry, products, competitors, proof points (for Product Knowledge + relevance scoring)
- Subreddits and keywords to monitor
- Brand palette / logo or mascot assets (or instructions to generate)
- Allowed login email domain (e.g. `@acmeclient.com`)
- Which Vercel and Supabase accounts to host under (Merchynt's or the client's)

## Phase 1 — Repo

```bash
gh repo create merchyntjames/<client-slug>-rosie --template merchyntjames/reddit-rosie --private --clone
cd <client-slug>-rosie
git config user.name "James Sowers"
git config user.email "james@merchynt.com"
npm install
cp .env.example .env.local   # fill in as Phase 2 produces values
```

Client forks should be **private** (client data and strategy live in the repo).

## Phase 2 — Supabase

1. Create a **new Supabase project** for the client (do not reuse Merchynt's).
2. Run `supabase/schema.sql` in the project's SQL editor (or via the Supabase
   MCP `apply_migration`). Before running, **edit the
   `restrict_email_domain()` function** in the script — it hard-codes the
   allowed login email domain.
3. Enable Email auth in Supabase Auth settings and create the client's user(s).
4. Copy the project URL, publishable (anon) key, and service-role key into
   `.env.local`.
5. Review RLS policies: several anon policies are wide open (public
   read/update) from Rosie's pre-auth era. Tighten them for the client unless
   there's a reason not to.

## Phase 3 — Hosting + automation

1. **Vercel:** create a new Vercel project connected to the new GitHub repo
   (auto-deploy on push to `main`). Set the same env vars as `.env.local` in
   Vercel project settings (all environments).
2. **GitHub Actions secrets** (both workflows need them):
   ```bash
   gh secret set NEXT_PUBLIC_SUPABASE_URL
   gh secret set SUPABASE_SERVICE_ROLE_KEY
   ```
   Workflows: `.github/workflows/refresh-reddit.yml` (daily RSS scan, 7am ET)
   and `.github/workflows/analyze-feedback.yml` (feedback report, 1st + 15th).
   Update the bot git identity in both workflows (currently
   `rosie@merchynt.com`).

## Phase 4 — Rebrand and reconfigure

Touch these, in roughly this order:

| Area | Files | What to change |
|---|---|---|
| Monitoring (most important) | `scripts/fetch-reddit.mjs` | Subreddits, search queries, keyword scoring weights — rebuild for the client's industry. Brand terms, competitor terms, topic terms. |
| Product knowledge | `src/lib/mock-data.ts`, Settings page content | Client's company overview, products, competitors, proof points, sample responses. |
| Brand voice | Settings → Brand Voice content, `brand assets/` | Replace Merchynt voice docs with the client's. Delete Merchynt brand assets. |
| Palette + branding | `src/app/globals.css` (`@theme inline` block — Tailwind v4, no config file), `src/components/Sidebar.tsx`, `src/app/layout.tsx` metadata | Client colors, app name, logo/mascot. |
| Mascot/assets | `public/` | Replace Rosie imagery or generate a client mascot. |
| Auth | Supabase `restrict_email_domain()` (done in Phase 2) + check `src/middleware.ts` and `src/app/login/page.tsx` for any client-side domain checks | Client's email domain. |
| History | `src/app/changelog/page.tsx`, `reports/`, `public/data/conversations.json` | Reset changelog/roadmap to v1.0 for the client; delete Merchynt reports and seeded conversation data. |
| Docs | `CLAUDE.md` | Rewrite for the client fork: new repo URL, live URL, palette, content rules. Merchynt-specific rules (no emojis, GBP terminology) may not apply — confirm with operator. |

## Phase 5 — Verify

1. `npm run dev` — log in, confirm empty queue, settings, analytics render.
2. Trigger the scan manually: `gh workflow run refresh-reddit.yml`, wait,
   confirm new conversations appear in the queue with sensible relevance
   scores for the client's industry.
3. Generate a draft on one conversation and confirm the Claude API call works
   and `api_usage` logs the cost.
4. Confirm Vercel production deploy works and login is restricted to the
   client's email domain.

## Rules that carry over to every fork

- **Human-in-the-loop posting only.** Rosie never posts to Reddit
  automatically. No exceptions per client request without revisiting Reddit's
  Responsible Builder Policy.
- **Never commit secrets.** `.env.local` is gitignored; keys live there and in
  Vercel/GitHub secrets only.
- Update the in-app changelog (`src/app/changelog/page.tsx`) after every
  feature, per the conventions in `CLAUDE.md`.
