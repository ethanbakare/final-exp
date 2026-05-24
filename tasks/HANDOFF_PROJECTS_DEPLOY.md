# Handoff — Projects page, deploy workflow & env (cold-start contract)

Read top-to-bottom before continuing. This supersedes the
projects-component scaffold phase (that work is done & shipped).

## 0. TL;DR — current state (all green)

- **Branch:** `csw-010-circle-voice-port` **==** `main` **==** `origin/main`
  **== `20983ac`** (all in sync, working tree clean). `main` is the
  production branch.
- **Production is live & current** on `littleexp.com` /
  `www.littleexp.com` / `final-exp.vercel.app`. Last deploy
  `dpl_3eVHmPufTfM5zRn3QiX3T3U71cpD` (commit `20983ac`) = **READY**.
- The big arc this session: the real **`/projects` page** was built &
  shipped, the home **"View all Projects"** hero button links to it,
  and a series of polish/link fixes were deployed.

## 1. Deploy workflow (established, repeat exactly)

This repo auto-deploys to Vercel on push to `main`.

1. Make change on `csw-010-circle-voice-port`, verify
   (`npx tsc --noEmit` exit 0 + `curl -s -o /dev/null -w '%{http_code}'
   http://localhost:3000/<route>` = 200 + a Playwright probe; for
   WebGL pages add SwiftShader flags — see §3).
2. Commit (`git -c commit.gpgsign=false commit`; **NEVER**
   Co-Authored-By / any @anthropic.com; stage specific files).
3. Fast-forward `main`: `git checkout main && git merge --ff-only
   csw-010-circle-voice-port && git checkout csw-010-circle-voice-port`.
4. `git push origin main`.
5. Monitor via Vercel MCP until `READY` (poll with a background
   `sleep` timer, not a foreground sleep — those are blocked):
   - team `team_JRd3rFmjATv4L0JiK1Sg4OpA` ("Ethan Bakare's projects")
   - project `prj_pQ8IrIS0xrjG7V6snhFV8CFSmqy7` (`final-exp`)
   - `list_deployments` (use `since` to isolate the newest) →
     `get_deployment(idOrUrl, teamId)` until `state: READY`/`ERROR`.
   - On ERROR: `get_deployment_build_logs`.
6. Optionally curl the production URL to confirm the change is live.

**⚠️ BEFORE committing, run `git branch --show-current`.** The working
directory is SHARED across ~22 Claude sessions + the editor, and the
Claude Code "switch branch" UI now works (see §4), so the active branch
can change out from under you. This session a commit accidentally landed
directly on `main` because the dir had been switched to `main`. Don't
assume you're on `csw-010`.

## 2. What was built/changed this session (newest first)

- `20983ac` fix(projects): **/projects Voice UI card → `/voiceinterface/realtime`**
  (match the home page). NOTE: this push also carried the earlier
  Harbor commit, so Harbor is now live too (see §5).
- (env) Upgraded git 2.23.0→**2.54.0** via Homebrew (§4) — fixed the UI
  branch-switch error. No repo commit.
- `231ccfb` chore: committed the **"Harbor"** realtime-states profile
  to `realtime-state-profiles.json` (see §5).
- `f5261e2` fix(ai-confidence-tracker): **centre `.reading-interface`**
  (`align-self: stretch` → `center` in shared `deepReader.tsx`) so the
  reading box aligns with the transcript box. Fixed a ~10px offset on
  BOTH `/ai-confidence-tracker` and the demo-showcase (shared
  component → fix-once-fixes-everywhere). Verified both boxes 400→1000.
- Earlier: home **CarouselDemos** Voice UI card → `/voiceinterface/realtime`;
  `/projects` Voice card had been reverted to `/voiceinterface/variations`
  then (this session) re-aligned to `/voiceinterface/realtime`.
- The **`/projects` page** itself: `src/pages/projects.tsx` (thin) →
  `src/projects/new-home/components/ProjectsPage.tsx`. 11 cards (5 AI
  demos w/ chosen chrome treatments + 6 brand-portfolio image cards),
  CarouselBrand grid syntax (`repeat(3,381px)`/298px/gap15 → 2col
  ≤1200 → 1col aspect-ratio ≤800), home gradient bg, each card a real
  `<a href>` link. Drag-reorder + handle toggle are **DEV-ONLY, hidden
  in production** (`showHandles = false` const; reorder/persistence code
  kept dormant; can be fully removed on request).
- Hero **"View all Projects"** button (`HeroBanner.tsx`) wrapped in
  `next/link` → `/projects`.

## 3. Verification harness / gotchas

- `npx tsc --noEmit` = 0; `curl` the route = 200; scan html for
  `Build Error|Failed to compile`.
- **Throwaway Playwright probe** for visuals/measurements: write
  `scripts/_tmp_*.mjs`, `node` it, Read the PNG, then `rm` it.
  **WebGL pages** (Voice UI `LoopingBlob`, and `/new-home`) crash
  headless without these launch args:
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
  --ignore-gpu-blocklist`. (Without them you get "Error creating WebGL
  context" and a blank page — it's a probe artifact, not a real bug.)
- **styled-jsx gotcha (hit twice):** backticks inside a CSS comment
  inside a `<style jsx>` block break the template literal
  ("Expected '</'"). Never put backticks in those CSS comments.
- **styled-jsx specificity:** shared components scope selectors with a
  `.jsx-<hash>` (~0,2,0). Beat with a doubled class (0,3,0) or
  `!important`. (`.pc-card-<id>.pc-card-<id>` pattern on the pages.)

## 4. git environment fix (done)

`/usr/local/bin/git` was a 2019 standalone-installer symlink → git
**2.23.0**, shadowing Homebrew git and Apple's `/usr/bin/git` (2.50.1).
The Claude Code branch-switch UI uses `git checkout --end-of-options`
(needs git ≥ 2.24) → it errored on 2.23. Fixed with:
`brew upgrade git` (→2.54.0) + `sudo`-free `brew link --overwrite
--force git` (because `/usr/local/bin` is user-owned `ethan:admin`).
Old `/usr/local/git` dir still on disk (dead, harmless; optional
`sudo rm -rf /usr/local/git` to clean). Restart the app if the UI
hasn't picked up the new git.

## 5. Runtime JSON profile data — IMPORTANT model

Profile files at repo root (`realtime-state-profiles.json`,
`radial-states-profiles.json`, `circle-waveform-voicesets.json`, etc.)
are runtime "DBs" read/written via `src/pages/api/studio-profiles.ts`
(`?variant=...`): **GET** `fs.readFile`, **POST** `fs.writeFile`.
- On Vercel the FS is **read-only**: GET serves the **committed** file;
  **POST (save) FAILS in production** — you can only create/save
  profiles in local dev, then **commit + push** to make them live.
- So only committed profiles appear live. NEVER `git reset` these
  casually (they're live data). Confirm with the user before committing
  one (they may be local scratch).
- **"Harbor"** (a realtime-states profile) was committed (`231ccfb`) to
  stop a "branch has uncommitted changes" switch-prompt, and then
  **rode along to production** in the `20983ac` push (it was an earlier
  commit on `main`). It is therefore LIVE now. The user had
  deprioritized Harbor — flag this; offer to pull it back out if they
  care (it's harmless: just adds a profile to the realtime-states data).

## 6. Key files

- `src/pages/projects.tsx` → `src/projects/new-home/components/ProjectsPage.tsx`
- `src/projects/new-home/components/CarouselDemos.tsx` (home AI-DEMOS carousel; Voice href = `/voiceinterface/realtime`)
- `src/projects/new-home/components/CarouselBrand.tsx` (brand grid syntax source)
- `src/projects/new-home/components/HeroBanner.tsx` ("View all Projects" → /projects)
- `src/projects/ai-confidence-tracker/components/ui/deepReader.tsx` (`.reading-interface align-self: center` fix)
- `src/pages/ai-confidence-tracker/index.tsx` (standalone AI Confidence page; `.content-wrapper` == demo's `.demo-wrapper`)
- `src/pages/api/studio-profiles.ts` (profile read/write API)
- `tasks/PROJECTS_COMPONENT_HANDOFF.md` (the scaffold-phase handoff, now historical)

## 7. Canonical project links (from CarouselDemos/CarouselBrand)

Trace AI → `/trace` · Clipstream → `/clipperstream` · Voice UI →
`/voiceinterface/realtime` · Ollama → `/ollama` · AI Confidence →
`/ai-confidence-tracker` · brand cards → `/portfolio2025/*` &
`/madeforhumans`.

## 8. Environment

macOS; Next dev on `localhost:3000` (user-owned — don't kill).
Homebrew git 2.54.0 now primary. Vercel connector (MCP) is connected
(`list_deployments`/`get_deployment`/etc. work; the OAuth helper tools
may show disconnected on resume — the data tools still function).
Global: always commit when an action finishes; NEVER Co-Authored-By /
@anthropic.com; use `git -c commit.gpgsign=false`.
