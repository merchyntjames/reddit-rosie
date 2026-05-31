@AGENTS.md

# Reddit Rosie — Claude Code Context

## What is this project?
Reddit Rosie ("Rosie The Redditor") is an internal Reddit social listening and engagement tool for Merchynt. It monitors subreddits and keywords for relevant conversations, generates AI-drafted replies in multiple voices, and tracks engagement performance.

## Quick Reference
- **Repo:** https://github.com/merchyntjames/reddit-rosie
- **Live URL:** https://reddit-rosie.vercel.app
- **Local path:** `09 - Internal Tools/reddit-rosie/`
- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Lucide React icons
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Git config:** user.name "James Sowers", user.email "james@merchynt.com"

## Architecture

### Current State (v0.5 — UI scaffold with mock data)
The app is fully built as a frontend with mock data. No backend, database, or API integrations are wired up yet. All state is local (React useState).

### File Structure
```
src/
  app/
    page.tsx              # Queue page (main view — conversation cards with draft panels)
    layout.tsx            # Root layout with sidebar
    globals.css           # Tailwind v4 theme with Merchynt brand colors
    analytics/page.tsx    # Performance analytics dashboard (mock data)
    activity/page.tsx     # Activity log (timestamped action history)
    changelog/page.tsx    # Product changelog + roadmap
    settings/page.tsx     # 5-tab settings (Monitoring, Product Knowledge, Brand Voice, Creator Profiles, Integrations)
  components/
    Sidebar.tsx           # Left sidebar nav, integration status, Reddit accounts, user info
    StatsBar.tsx          # Stats cards row on Queue page
    ConversationCard.tsx  # Expandable conversation card with Reddit context
    DraftPanel.tsx        # Dual-voice draft display (Corporate/Personal) with copy-to-clipboard
    FilterBar.tsx         # Status filter tabs + search on Queue page
  lib/
    types.ts              # TypeScript interfaces (Conversation, Product, BrandVoice, CreatorProfile, etc.)
    mock-data.ts          # All mock data (conversations, subreddits, keywords, style guides, products, creators)
```

### Tailwind CSS v4
This project uses Tailwind v4, which is different from v3:
- No `tailwind.config.ts` file — colors are defined in `globals.css` using `@theme inline` blocks
- Import syntax: `@import "tailwindcss";` (not `@tailwind base/components/utilities`)
- Custom colors: navy, pink, blue, green, orange, dark, muted, border, surface

### Brand Palette
This is a Merchynt internal tool, so it uses the **Merchynt palette** (navy-led with pink accents), NOT the Paige palette (blue/teal-led):
- Navy: `#0f007d` (primary — sidebar active state, headings, buttons)
- Pink: `#dd0cf7` (accent — subreddit names, highlights)
- Blue: `#0063fd` (secondary accent)
- Green: `#05c168` (success states, connected indicators)
- Orange: `#ff9e2c` (warning states)
- Dark: `#1c1f23` (body text)
- Muted: `#8E8B84` (secondary text)
- White backgrounds with subtle borders (#e5e5e5)

### Design Language
The UI is modeled after Merchynt's Pixel Pete tool:
- Clean white card backgrounds with subtle borders
- Left sidebar with branding, nav icons, integration status, user info
- Lucide React icons throughout (no emojis — hard rule)
- Stats cards in rows at the top of pages
- Card-based content with expandable details
- Navy active states, muted helper text
- Font: Geist Sans (loaded via next/font/google)

## Pages

### Queue (`/`)
Main page. Shows stats bar + filterable list of Reddit conversations. Each card expands to show full post context and dual-voice AI drafts (Corporate and Personal). Users can copy drafts, dismiss conversations, or mark them complete.

### Analytics (`/analytics`)
Performance dashboard for a single Reddit account. Shows:
- Karma stats with 7-day change
- Daily karma earned bar chart
- Rosie impact metrics (Rosie-drafted vs manual performance comparison)
- Engagement breakdown by subreddit (table)
- Recent post/comment performance list (filterable by type)

### Activity Log (`/activity`)
Timeline of all actions: conversations discovered, drafts generated, responses posted, conversations dismissed.

### Settings (`/settings`)
5-tab layout:
1. **Monitoring** — Subreddits, keywords, scan frequency, relevance threshold
2. **Product Knowledge** — Company overview, product cards (Paige, GBP Audit), competitors, proof points
3. **Brand Voice** — Brand name, voice description, Reddit guidelines, approved terminology, sample responses
4. **Creator Profiles** — Per-person cards with voice, persona, expertise (pre-populated with James Sowers)
5. **Accounts & Integrations** — API status, notification prefs, data management

### Changelog (`/changelog`)
Product changelog with release history timeline + roadmap cards. Linked from sidebar.

## Planned Backend (not yet built)

### Phase 1: Database + Auth
- Supabase for persistent storage (conversations, drafts, settings, analytics snapshots)
- Vercel password protection for access control

### Phase 2: Reddit API Integration
- OAuth2 "web app" type for multi-account support
- Cron job polling subreddits every 15-30 min via `GET /r/sub1+sub2+sub3/new`
- Keyword matching + relevance scoring
- Direct posting via `POST /api/submit` and `POST /api/comment`
- Post scheduling via database + cron (Reddit API has no native scheduling)
- Analytics polling: track score, upvote_ratio, num_comments, karma over time

### Phase 3: Claude API Integration
- Draft generation using Sonnet model (~$15/mo at medium volume)
- System prompts built from Product Knowledge + Brand Voice + Creator Profiles
- Two drafts per conversation: corporate voice (we/us/our) + personal voice (I/me/my)

### Environment Variables (not yet set)
```
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
REDDIT_USERNAME
REDDIT_PASSWORD
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

## Mascot
"Rosie The Redditor" — chibi-style 3D character with reddish-orange hair in a bun, red polka-dot bandana, Merchynt navy hoodie, green eyes, confident smile, holding a tablet with an upvote arrow. Generated via Nano Banana Pro (Google Gemini). Multiple iterations were refined for pose, expression, and font treatment.

## Development Workflows

### Changelog (REQUIRED after every feature or improvement)
The changelog lives at `src/app/changelog/page.tsx` in the `changelog` array. After completing any feature, improvement, or infrastructure change, you MUST:

1. Add a new entry to the TOP of the `changelog` array with:
   - `id`: next sequential number (string)
   - `version`: bump appropriately (see Versioning below)
   - `date`: today's date (e.g., "June 1, 2026")
   - `type`: `'feature'` | `'improvement'` | `'infrastructure'`
   - `title`: short name of what was built (e.g., "Analytics Dashboard")
   - `description`: 1-2 sentence summary of the change
   - `details`: optional array of bullet points for specifics
2. If the work completes a roadmap item, REMOVE that item from the `planned` array in the same file. The roadmap should only show work that hasn't been built yet.

**Versioning convention:**
- `0.x` — new feature or major page addition (bump the minor version)
- `0.x.y` — improvement, bugfix, or iteration on existing feature (bump the patch)
- Group related changes under the same version if they ship in the same commit

### Roadmap
The roadmap lives in the `planned` array in `src/app/changelog/page.tsx`. It shows upcoming features as cards with icons and descriptions.
- When a roadmap item is fully built, remove it from `planned` — it now lives in the changelog
- When James describes a new feature he wants to build in the future, add it to `planned`
- Keep roadmap items ordered by likely build sequence (nearest first)

### Integration Status (sidebar)
The sidebar (`src/components/Sidebar.tsx`) shows real-time integration status. These MUST reflect actual state:
- **Reddit API / Claude API:** Show "Connected" (green) ONLY when env vars are set and the integration is verified working. Otherwise show "Not connected" (muted).
- **Last scan:** Show "Never" until the Reddit polling cron is actually running. Then show real timestamps.
- **Reddit Accounts:** Show "No accounts connected" with a link to Account Settings until OAuth tokens are stored and validated. When accounts are connected, show each with username and "Active" status. Never show mock/fake accounts as active.

### CLAUDE.md Maintenance
When the project architecture changes meaningfully (new pages, new directories, new integrations, changed conventions), update this file. Keep the "Current State" version in sync with the latest changelog entry. Update the file structure section if files are added or moved.

## Pushing Changes
```bash
cd "09 - Internal Tools/reddit-rosie"
git add -A && git commit -m "description" && git push
```
Changes auto-deploy to Vercel within ~30 seconds.

## Content Rules
- No emojis in any output (hard Merchynt brand rule)
- Lucide React icons only (similar to Todoist's icon style)
- Confident, direct tone in all UI copy
- "Google Business Profile" on first mention, "GBP" is okay after that
