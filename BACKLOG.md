# Backlog

Non-urgent work captured so it doesn't get lost. Not prioritised — review before picking up.

---

## Tooling / infra

### Fix silent ESLint crash in Vercel builds
**Status:** deferred — site deploys fine, but lint is effectively disabled in CI.

**What's wrong:**
- Every Vercel build logs `⨯ ESLint: Converting circular structure to JSON` during the "Linting and checking validity of types" step.
- This is an ESLint *internal* crash (FlatCompat + eslint-plugin-react cycle under Next 15), not a rule violation. Next doesn't fail the build on internal errors, so deploys pass with lint never actually running.
- Net effect: no lint rules are enforced on new code. The `⨯` in logs looks scary but is misleading.

**Root causes (ours, not upstream):**
1. Two ESLint configs coexist — `.eslintrc.json` (legacy, has `no-unused-vars` underscore rule) and `eslint.config.mjs` (flat, extends `next/core-web-vitals` + `next/typescript`). Next 15 picks the flat config and silently ignores the legacy one — so the underscore rule has been dead for a while.
2. `package.json` pins `eslint` and `eslint-config-next` to `"latest"`. Builds aren't reproducible.
3. `next.config.mjs` has a `dirs: [...]` allowlist restricting lint to 6 legacy project dirs. Anything newer (`blob-studio`, `new-home`, `trace`, `voiceinterface`) wouldn't be linted even if ESLint worked.
4. No dedicated lint step in CI — we rely on `next build`'s lenient handling, which hides crashes.

**Recommended approach when we come back to it:**
1. Consolidate to a single flat config (`eslint.config.mjs`), port the `no-unused-vars` rule over, delete `.eslintrc.json`.
2. Pin exact versions of `eslint` and `eslint-config-next` (not `"latest"`).
3. Resolve the circular bug either by (a) pinning to a known-good `eslint-plugin-react` version, or (b) dropping `next/typescript` from extends and keeping `next/core-web-vitals` only.
4. Add a dedicated `npm run lint` step in a GitHub Action so ESLint crashes and rule violations fail CI.
5. Adopt **change-based linting** in CI (`git diff --name-only origin/main...HEAD | grep -E '\.(ts|tsx)$' | xargs eslint`) so new code gets linted but legacy dirs stay grandfathered until touched. Drop the `dirs` allowlist in `next.config.mjs` once change-based linting is in place.

**Why defer:** none of this blocks shipping. Doing it now would either surface hundreds of legacy lint errors (time sink) or require a baseline ratchet tool to manage them. Change-based CI is the cleanest escape hatch and avoids both problems — but it's still meaningful setup work.

---

### Figma Bridge — refactor to singleton daemon architecture
**Status:** deferred — the bridge works but is brittle. Requires reconnect dance multiple times per day.

**Repo location:** `/Users/ethan/Documents/projects/figma-mcp/` (the ACTIVE bridge — stdio MCP + WebSocket on port 3055).
**Reference / old:** `/Users/ethan/Documents/Figma-MCP/` is an older HTTP-based fork (`figma-developer-mcp` v0.1.4, port 9000). Not the same codebase — don't confuse them.

#### Symptom (what the user experiences)

- Plugin shows "Connected" in Figma but MCP calls return `connected: false, pluginCount: 0`
- Errors like "another instance is open, close it first"
- Need to kill stale `node /Users/ethan/Documents/projects/figma-mcp/dist/server/index.js` processes via `lsof -i :3055` and `kill <pid>`, then close/reopen the plugin to get a new channel
- Happens roughly every session when another Claude Code session left a stale process behind

#### Root cause

There is **no single authoritative owner** of the plugin connection. The current architecture is already option 2 (multi-instance relay + promotion) — see git log:
```
2785a2d  Add relay mode so multiple sessions can share the bridge server
b53f7f7  Add relay-to-host promotion when original host session closes
00e8474  Add zombie cleanup and WebSocket heartbeat
```
Each Claude Code session spawns its own `figma-mcp` stdio process. Each tries to bind port 3055. The winner hosts the plugin; the losers become relay clients. But state isn't properly mirrored — relay clients see stale / empty plugin lists, and promotion-on-host-death has edge cases. It's a distributed-consistency problem that's genuinely hard to get right.

**Option 1 sidesteps the distributed problem entirely** by making one long-lived daemon the sole owner, turning all MCP stdio processes into pure clients.

#### Target architecture

```
┌─────────────────────────────────┐
│  Figma (Desktop or Browser)     │
│  ┌───────────────────────────┐  │
│  │ Claude Code Bridge plugin │  │────── ws://localhost:3055 ──────┐
│  └───────────────────────────┘  │                                 │
│  (can be open in multiple files │                                 │
│   simultaneously — multi-channel│                                 ▼
│   protocol already supports it) │                     ┌──────────────────────────┐
└─────────────────────────────────┘                     │ figma-bridge-daemon      │
                                                        │ (launchd LaunchAgent,    │
                                                        │  KeepAlive: true)        │
                                                        │                          │
                                                        │ - Owns port 3055 forever │
                                                        │ - Holds all plugin conns │
                                                        │ - Routes commands by     │
                                                        │   channelId              │
                                                        └────────────▲─────────────┘
                                                                     │
                                                                     │ ws://localhost:3055
                                                                     │ (internal client API)
                                                      ┌──────────────┴──────────────┐
                                                      │                             │
                                          ┌───────────┴────────────┐   ┌────────────┴────────────┐
                                          │ figma-bridge-mcp       │   │ figma-bridge-mcp        │
                                          │ (stdio, spawned by     │   │ (stdio, spawned by      │
                                          │  Claude Code session A)│   │  Claude Code session B) │
                                          │                        │   │                         │
                                          │ - Pure client          │   │ - Pure client           │
                                          │ - No server binding    │   │ - No server binding     │
                                          └────────────────────────┘   └─────────────────────────┘
```

Key properties:
- **One owner**: the daemon is always the authoritative source of plugin state. No election, no promotion.
- **N clients**: every Claude Code session gets its own stdio MCP, all of which are pure clients. They can come and go without affecting plugin connectivity.
- **Plugin connects once and stays connected** across every Claude Code session for as long as Figma is open.
- **Multi-file support already exists in the protocol** — daemon tracks a `plugins[]` array keyed by channelId. The `join_channel` tool selects the active one for a given stdio MCP.

#### File-by-file plan

Paths relative to `/Users/ethan/Documents/projects/figma-mcp/`:

| Path | Action | Details |
|---|---|---|
| `src/daemon/index.ts` | **CREATE** | New entry point. Imports `FigmaBridgeWebSocketServer`, calls `.start()`, registers SIGINT/SIGTERM handlers. Logs to stderr with `[figma-daemon]` prefix. No stdio/parent-PID checks — this process lives independently. |
| `src/server/index.ts` | **MODIFY** | Delete the host-or-relay fork (lines 11–28). Always construct `FigmaBridgeDaemonClient`. On connection failure, exit with clear error: `"Figma bridge daemon not running. Start it with: launchctl load ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist"`. |
| `src/server/relay-client.ts` | **MODIFY + rename** | Rename to `daemon-client.ts`. Delete `promoted`, `promotedServer`, and the promotion logic block. Keep reconnect, heartbeat, pending-request tracking. |
| `src/server/websocket-server.ts` | **UNCHANGED** | Reused by daemon as-is. |
| `src/plugin/code.ts` and `ui.ts` | **UNCHANGED** | Plugin side keeps existing connect-to-localhost:3055 behaviour. Because the daemon survives across sessions, plugin reconnect pain goes away. |
| `scripts/install-daemon.sh` | **CREATE** | Shell script: build daemon, write plist to `~/Library/LaunchAgents/`, `launchctl load` it. See plist template below. |
| `scripts/uninstall-daemon.sh` | **CREATE** | Counterpart: `launchctl unload`, remove plist. |
| `package.json` | **MODIFY** | Add `"build:daemon"` script. Update `"build"` to include daemon. Add `"install-daemon"` / `"uninstall-daemon"` scripts pointing at the shell scripts. |
| `README.md` | **MODIFY** | Document daemon setup as a one-time install step. |

#### launchd plist template

Write to `~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ethan.figma-bridge-daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/ethan/Documents/projects/figma-mcp/dist/daemon/index.js</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key>
  <dict>
    <key>Crashed</key><true/>
    <key>SuccessfulExit</key><false/>
  </dict>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>/Users/ethan/Library/Logs/figma-bridge-daemon.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/ethan/Library/Logs/figma-bridge-daemon.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

Note: `ThrottleInterval: 10` prevents launchd from respawning faster than every 10s if the daemon crash-loops. `KeepAlive` only restarts on crash or failed exit, not clean shutdown — so `launchctl unload` works as expected.

#### Multi-file UX (the scenario Ethan described)

The protocol already supports it. What needs to happen at the Claude-Code-usage level (prompt/skill guidance, not code):

1. Before running a command that depends on selection, call `get_connection_status`.
2. If `pluginCount === 0`: tell the user to open the bridge plugin in Figma.
3. If `pluginCount === 1`: auto-select via `join_channel(plugins[0].channel)`.
4. If `pluginCount > 1` and no active channel yet for this stdio MCP: ask the user "I see N files connected: [list]. Which one?" — then `join_channel(selected)`.
5. Allow mid-session switching: if user says "switch to X", call `join_channel(x.channel)`.

This is a skill or CLAUDE.md instruction, not a daemon code change. Worth adding a small skill or custom slash command (`/figma-use`) that embeds this flow.

#### Test plan

1. **Clean install**: run `scripts/install-daemon.sh`. Verify `launchctl list | grep figma-bridge` shows the daemon running. Verify `lsof -i :3055 -P` shows the daemon owning port 3055.
2. **Plugin connects**: open Figma, launch Claude Code Bridge plugin. Plugin should show "Connected". From a Claude Code session, `get_connection_status` should return `connected: true, pluginCount: 1`.
3. **MCP comes and goes**: quit Claude Code. Plugin UI should still say "Connected" (daemon didn't go down). Restart Claude Code. New stdio MCP should immediately see the plugin — no reconnect dance.
4. **Multi-file**: open the bridge plugin in a second Figma file. `get_connection_status` should return `pluginCount: 2` with both files listed. `join_channel` should route to the selected one.
5. **Daemon crash resilience**: `kill -9` the daemon PID. Wait ~10s (ThrottleInterval). `lsof -i :3055 -P` should show the daemon has restarted. Plugin will need to reconnect (Figma side), but launchd keeps the daemon alive.
6. **Graceful uninstall**: run `scripts/uninstall-daemon.sh`. Verify launchd entry removed, port 3055 free.

#### Rollback plan

The old host-or-relay code lives in git history. If the daemon approach causes issues: `git revert` the refactor commits, the stdio MCP goes back to self-hosting behaviour. No data migration needed — nothing persistent.

#### Acceptance criteria

- Open Figma, use the bridge plugin across 3+ Claude Code sessions in a row without killing any PIDs or reopening the plugin.
- Multi-file scenario: plugin runs in 2+ Figma files; Claude can disambiguate or auto-select.
- After Mac reboot: daemon starts automatically, Figma plugin connects without manual intervention.
- Zero occurrences of "port in use" or "no plugin on channel" errors during normal use.

#### Estimate

1.5–2 hours of focused work (code refactor + scripts + README + testing).

#### Why defer

No active blocker right now — we just worked around it manually this session. Touching the bridge pulls attention away from final-exp product work. Schedule this the next time the bridge pain costs >15 minutes, or during a deliberate infra day.

---

## Product work deferred from prior sessions

### Cancel button during Trace processing
Production risk if the Gemini API hangs — user has no way to bail out. Needed before Trace is truly production-ready.

### ClipStream simulation
Auto-play recording → processing → results loop for the `/demo-showcase` page. Not built.

### Voice Interface simulation
Design undecided. Separate from the Blob Studio page — this would be for the consolidated demo showcase.

### Case study URLs
All brand-carousel links on the home page point to `#` placeholders. Need real portfolio pages or external links.

### Port linear waveform from `otherexp` → `final-exp`
Linear waveform playground exists in `otherexp` but not in `final-exp`. Could ship as a gallery page similar to the radial waveform one.

### Consolidated `/demos` page
Single full-screen demo navigator (Figma "Dictation app" file). Nav with project dropdown + counter + up/down arrows, auto-playing simulation per demo, "Try Demo" + "View Case Study" CTAs. Would use simulation-mode versions of each project.

### Simulations for other projects
Only AI Confidence Tracker has one. Need similar for Trace (partially done), Clipstream, Voice UI, Ollama.

### Navigation bar for new home page
Old home page had `MainNavBar`. New home page doesn't. Either adapt or build fresh from Figma.

---

## Cleanup

### Old `/old-home` page
Preserved at `/old-home` since the April refactor. Can be removed once new home is confirmed stable.

### Old voice-interface JPG/PNG images
`wt1.jpg`, `wt6.png`, `wt7.jpeg` in the public folder are no longer referenced (replaced by WebP versions). Can be deleted.

### `@ts-nocheck` files
Three files have `@ts-nocheck` applied for Vercel build. Not urgent, but worth fixing when touching them:
- `src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
- `src/pages/trace/showcase/tracemorphing.tsx`
- `src/projects/home/components/Goal_Body.tsx`
