# Figma Bridge — Singleton Daemon Refactor

**Status:** DRAFT (Revision 2) — review-only. Do NOT implement until plan is signed off.

**Target repo:** `/Users/ethan/Documents/projects/figma-mcp/` (the active bridge: stdio MCP + WebSocket on port 3055).

**Related entry:** [BACKLOG.md → "Figma Bridge — refactor to singleton daemon architecture"](../../BACKLOG.md)

---

## Revision history

### Revision 3 — user direction (post-R2)

After reviewing R2, the user (non-technical) clarified what their actual day-to-day pain is and made decisions that lock four open questions and meaningfully reshape one design choice. Reviewer's R2 changes all stand; this revision builds on top.

| # | What changed | Why |
|---|---|---|
| Q1 | **Resolved: hardcode the Node binary path at install time.** Re-running `npm run install-daemon` is the documented recovery if Node ever moves (Homebrew upgrade, macOS major version, etc.) | User does not actively manage Node versions — no nvm/asdf/Volta in use. Hardcoding is the simplest path; the recovery story is "rerun a 30-second install command." Wrapper-script complexity not justified. |
| Q9 | **Resolved: narrow the Figma plugin to port 3055 only.** Drop the 3055–3060 fallback in `ui.ts` and `manifest.json`. | User has never needed `FIGMA_MCP_PORT` overrides in practice. The fallback range is the source of the H3 hazard the reviewer flagged. Eliminate it. |
| Q7 | **Reshaped: multi-file disambiguation behaviour belongs in the daemon and the MCP tool surface, NOT in a Claude-Code-specific skill.** | The user wants to control Figma from non-Claude tools (Codex / OpenAI ChatGPT, Cursor, etc.) — anything that speaks MCP. A skill in `.claude/skills/` only helps Claude Code. Putting the disambiguation hint into the MCP tool descriptions and into structured daemon error responses (`AMBIGUOUS_FILE`) lets every MCP-capable client do the right thing without per-client configuration. See rewritten §17. |
| Q2, Q4, Q5, Q6, Q8, Q10, Q11, Q12 | **Locked to author leans** per user direction "trust the leans on implementation details." | None of these are user-visible behaviour changes. Marked resolved in §23. |
| Q13 (R3, new) | **Per-client active channel — flagged for review.** With multi-file working through MCP tool descriptions, the daemon's `activeChannel` field needs to become per-client (keyed by the MCP client's WebSocket) rather than shared across all clients. Otherwise client A picking "Dictation app" forces client B onto the same file. | This is structural for multi-file correctness when more than one Claude Code / Codex session is active simultaneously. R3 makes the change but flags it explicitly so the reviewer can re-validate. |

### Revision 2 — addressing review feedback

Reviewer flagged four substantive issues with R1. All confirmed against code; all addressed below.

| # | Issue | Where addressed |
|---|---|---|
| H1 | R1 kept relay-style "cache only on connect/reconnect" status, which preserves the exact stale `connected: false` failure mode the refactor is supposed to eliminate. ([mcp-server.ts:33](../../../figma-mcp/src/server/mcp-server.ts:33), [relay-client.ts:99,146](../../../figma-mcp/src/server/relay-client.ts:99)) | New §2.5 *Status freshness — design contract*. Updated §7 (added invariant I6). Rewrote §10 to require push-driven status. Updated §8 to flag `websocket-server.ts` as MODIFY. |
| H2 | R1 said `websocket-server.ts`, `mcp-server.ts`, and `types.ts` are unchanged, but real `joinChannel` requires changes in all three. The current `FigmaBridge.joinChannel` is synchronous; making it remote forces async, which ripples through. ([types.ts:45](../../../figma-mcp/src/server/types.ts:45), [mcp-server.ts:64](../../../figma-mcp/src/server/mcp-server.ts:64), [types.ts:2](../../../figma-mcp/src/server/types.ts:2)) | Updated §8 to MODIFY those files. New protocol detail in §10. Added §10.4 on the interface async-ification. |
| H3 | R1's "daemon owns 3055" invariant doesn't survive the plugin's 3055–3060 port-cycling logic ([ui.ts:4](../../../figma-mcp/src/plugin/ui.ts:4), [manifest.json:9](../../../figma-mcp/manifest.json:9)). | New §10b *Plugin port narrowing*. Updated §8. Updated §7 invariants. |
| M1 | R1 conflated machine-boot with user-login behaviour for LaunchAgents and used legacy `launchctl load`/`unload`. | Updated §13 (login vs boot phrasing). Updated §12 to use `bootstrap`/`bootout`/`kickstart`. |
| S1 | No `README.md` exists — "modify README" is really "create docs". | §16 retitled. |
| S2 | R1 silently introduced a renamed env var (`FIGMA_BRIDGE_PORT`) while existing code uses `FIGMA_MCP_PORT`. Drift, not intentional. | Reverted throughout. |

### Revision 1

Initial draft. See git history for full content.

---

## TL;DR

Today, every Claude Code session spawns its own `figma-mcp` stdio process. Each tries to bind port 3055; the winner is "host" and the rest become "relay clients" that proxy through it. State doesn't reliably mirror across this fleet, and the failure mode — plugin shows Connected in Figma while MCP returns `connected: false, pluginCount: 0` — costs ~10–15 minutes per occurrence to manually unstick (kill stale processes, reopen plugin, restart Claude Code).

**Proposal:** replace host-or-relay with **one always-on daemon** (managed by macOS launchd) that exclusively owns the WebSocket and the plugin connection. All MCP stdio processes become **pure clients** of the daemon. No election. No promotion. No distributed state to mirror. Status updates are pushed from the daemon to clients (eliminates the stale-cache bug). Multi-file behaviour lives in the daemon's MCP tool surface so any MCP client (Claude Code, Codex, Cursor) gets it for free.

**Estimate (R3):** ~7.5 hours of focused work, including the install scripts, README, multi-file UX, and full test pass.

**Reversibility:** entirely reversible via `git revert` + `launchctl bootout` + `rm` of the plist. Nothing persistent moves.

---

## Table of contents

1. [Background](#1-background)
2. [Problem statement](#2-problem-statement)
   - [2.5 Status freshness — the design contract (R2)](#25-status-freshness--the-design-contract-r2)
3. [Why the current host-or-relay model can't be patched](#3-why-the-current-host-or-relay-model-cant-be-patched)
4. [Goals and non-goals](#4-goals-and-non-goals)
5. [Design alternatives considered](#5-design-alternatives-considered)
6. [Target architecture](#6-target-architecture)
7. [Architectural invariants](#7-architectural-invariants)
8. [File-by-file implementation plan](#8-file-by-file-implementation-plan)
9. [Daemon entrypoint — code shape](#9-daemon-entrypoint--code-shape)
10. [daemon-client.ts — what stays, what goes](#10-daemon-clientts--what-stays-what-goes-revised-in-r2)
   - [10b. Plugin port narrowing (R2)](#10b-plugin-port-narrowing-r2)
11. [server/index.ts — simplification](#11-serverindexts--simplification)
12. [Install and uninstall scripts](#12-install-and-uninstall-scripts)
13. [launchd plist](#13-launchd-plist)
14. [Build pipeline](#14-build-pipeline)
15. [package.json changes](#15-packagejson-changes)
16. [README — CREATE (R2 correction)](#16-readme--create-r2-correction)
17. [Multi-file UX (separate workstream)](#17-multi-file-ux-separate-workstream)
18. [Test plan](#18-test-plan)
19. [Edge cases and failure modes](#19-edge-cases-and-failure-modes)
20. [Acceptance criteria](#20-acceptance-criteria)
21. [Rollback plan](#21-rollback-plan)
22. [Risks and mitigations](#22-risks-and-mitigations)
23. [Open questions for review](#23-open-questions-for-review)
24. [Out of scope](#24-out-of-scope)
25. [Estimate breakdown](#25-estimate-breakdown-revised-in-r2)

---

## 1. Background

The bridge is a two-piece system that lets Claude Code talk to a Figma plugin running inside Figma:

- **Figma plugin** ("Claude Code Bridge"). Lives inside Figma. Exposes commands like `get_selection`, `set_fill_color`, `rename_node`, etc. Connects out to a WebSocket on `localhost:3055`.
- **MCP stdio process** (`figma-mcp`). Spawned by Claude Code when a session starts. Runs the WebSocket server on port 3055 (so the plugin can connect to it) AND exposes MCP tools to Claude Code over stdio.

Claude Code routinely spawns multiple sessions concurrently. Each session spawns its own `figma-mcp` process. Each process attempts to bind port 3055. Only one can win.

The current design (option 2 in the original triage) tried to handle this with **host-or-relay**:
- Whichever MCP wins port 3055 becomes the **host** and owns the plugin connection.
- The losers become **relay clients**, connecting back to the host's WebSocket as proxies.
- If the host dies, one of the relays attempts to **promote** itself by re-binding port 3055.

Relevant commits in `figma-mcp`:

```
2785a2d  Add relay mode so multiple sessions can share the bridge server
b53f7f7  Add relay-to-host promotion when original host session closes
00e8474  Add zombie cleanup and WebSocket heartbeat
```

There is also a separate, older, HTTP-based fork at `/Users/ethan/Documents/Figma-MCP/` (`figma-developer-mcp` v0.1.4, port 9000). **Not the same codebase.** Out of scope for this plan.

---

## 2. Problem statement

The host-or-relay model has reproducibly bad UX. Specifically:

### 2.1 Symptom (what the user sees)

- Plugin shows "Connected" in Figma but MCP calls return `connected: false, pluginCount: 0`.
- "Another instance is open, close it first" errors when reopening the plugin.
- Manual recovery: `lsof -i :3055`, identify stale `node /Users/ethan/Documents/projects/figma-mcp/dist/server/index.js` PIDs, `kill <pid>`, close and reopen the plugin in Figma.
- Frequency per the handoff: roughly **once per session** when an old Claude Code session left a stale process.

### 2.2 Verified live state at time of writing

```bash
$ ls /Users/ethan/Documents/projects/figma-mcp/src/server/
index.ts  mcp-server.ts  relay-client.ts  types.ts  websocket-server.ts

$ ls /Users/ethan/Documents/projects/figma-mcp/src/daemon
ls: ...: No such file or directory          # daemon dir does NOT exist

$ test -f ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist
# plist does NOT exist

$ lsof -i :3055 -P
node  2700  ethan  17u  IPv6  TCP localhost:3055 (LISTEN)
node  2700  ethan  20u  IPv6  TCP localhost:3055->localhost:51163 (ESTABLISHED)
node  2700  ethan  21u  IPv6  TCP localhost:3055->localhost:55340 (ESTABLISHED)
node  2700  ethan  22u  IPv6  TCP localhost:3055->localhost:62594 (ESTABLISHED)
```

Confirms: the host-or-relay code is currently live, the daemon doesn't exist yet, the plist isn't installed yet.

### 2.3 What "broken" actually means at the protocol level

Reading [`relay-client.ts:265-270`](../../../figma-mcp/src/server/relay-client.ts):

```ts
joinChannel(channelId: string): boolean {
  if (this.promoted && this.promotedServer) {
    return this.promotedServer.joinChannel(channelId);
  }
  return false;            // ← relays cannot join channels
}
```

**Relay clients can't `joinChannel`.** They return `false` unconditionally unless they've been promoted to host. So if your stdio MCP is a relay, even if the host has plugins connected, your session can't switch between them. Multi-file Figma usage is effectively single-host-only.

Similar story for [`relay-client.ts:243-262`](../../../figma-mcp/src/server/relay-client.ts) (`isPluginConnected`, `getConnectedFileInfo`) — relays return `cachedStatus` which is populated via the `relay_status_response` message. There's a 5-second timeout on the cache refresh ([line 209](../../../figma-mcp/src/server/relay-client.ts:209)) and no guarantee the host actually broadcasts state changes to relays. **State drift is structural, not a bug.**

---

### 2.5 Status freshness — the design contract (R2)

**This is the central failure mode the daemon refactor must eliminate, and R1 didn't.** Documenting it explicitly so the implementation can be evaluated against this bar.

#### The failure shape

In R1, I planned to keep the relay client's caching behaviour. That cache (`relay-client.ts:22-27,196-212`) is populated only by `refreshStatus`, which is called only from `connect` ([line 104](../../../figma-mcp/src/server/relay-client.ts:104)) and from the post-promotion reconnect ([line 146](../../../figma-mcp/src/server/relay-client.ts:146)). There is no periodic poll. There is no daemon-side push.

[`mcp-server.ts:33-34`](../../../figma-mcp/src/server/mcp-server.ts:33) gates every command on `wsServer.isPluginConnected`, which on the relay client returns `cachedStatus.connected` ([line 248](../../../figma-mcp/src/server/relay-client.ts:248)).

Concretely, the broken scenario:

1. Daemon is running. No plugin connected yet.
2. Claude Code session starts → MCP spawns → connects to daemon → `cachedStatus = { connected: false, pluginCount: 0 }`.
3. User opens Figma + plugin → daemon now has the plugin → daemon's own `getConnectedFileInfo` returns `connected: true`.
4. **MCP's cachedStatus is still `{ connected: false }`.** Nothing tells it to refresh.
5. User runs an MCP tool → command preflight checks `isPluginConnected` → false → returns `NOT_CONNECTED`.
6. From the user's view: plugin shows "Connected" in Figma, MCP says "Figma plugin not connected." **Indistinguishable from today's failure mode.**

The same happens after a plugin disconnect/reconnect during an MCP session: the cache stays stale until the WebSocket between MCP and daemon drops, which it doesn't.

#### Required contract for the daemon

**C1.** Plugin state visible to an MCP client must be eventually consistent with the daemon's view, with bounded staleness measured in seconds, not "until next reconnect."

**C2.** `isPluginConnected` must never return false when the daemon has a plugin connected on the active channel for longer than the staleness window.

**C3.** `get_connection_status` must reflect ground truth at the moment it's called. (Not a cache.)

**C4.** Command preflight (the gate inside the MCP tool helper) must not reject a command on the basis of stale status. If the cache says "not connected" but ground truth says "connected," the command should proceed (or the cache should be refreshed before the gate).

#### Implementation strategy

**Two complementary mechanisms** — push for general state, fresh-pull for safety on the user-facing query.

**Push (primary):** the daemon broadcasts a `client_status_update` message to every connected MCP client whenever its plugin state changes. Triggers:
- A plugin sends `join` (a new plugin connects).
- A plugin's WebSocket closes (a plugin disconnects).
- Active channel changes (e.g. a client called `client_join_channel`).

Message body: the same shape `getConnectedFileInfo` returns.

Client handler: replace `cachedStatus` with the pushed snapshot.

**Fresh-pull (defence-in-depth):** `get_connection_status` always sends a `client_status` request to the daemon and awaits the response. Caching is fine for the gating check inside the MCP tool helper — provided pushes are reliable, the cache will be fresh. The user-facing query must be ground truth.

For the gating check ([mcp-server.ts:33](../../../figma-mcp/src/server/mcp-server.ts:33)), use the cached status. If a request fails because the cached status is wrong, the error will be an explicit "Plugin not connected" from `sendCommand` rather than a silent skip; the next push (driven by the disconnect or arrival) will correct the cache.

**Worst-case staleness:** bounded by network round-trip from daemon to MCP client over the local socket — single-digit milliseconds in normal operation. If the local socket is saturated, push falls back to a queued send and recovers when the buffer drains.

#### What this changes about the file-by-file plan

`websocket-server.ts` is no longer "UNCHANGED" — it must broadcast `client_status_update` on plugin connect, plugin disconnect, and active-channel change. See updated §8.

`daemon-client.ts` adds a handler for `client_status_update` and stops trying to maintain the cache by polling. See updated §10.

A new wire message type `client_status_update` is added to `types.ts`. See updated §8.

---

## 3. Why the current host-or-relay model can't be patched

This is genuinely a distributed-consistency problem:

| Concern | Host-or-relay implication |
|---|---|
| **Source of truth** | Plugin state lives only on the host. Relays cache it but have no push-mirror guarantee. |
| **Election** | Race condition on host crash — multiple relays may try to bind port 3055 simultaneously. Whoever wins is the new host. The losers must reconnect as relays. The protocol doesn't formally arbitrate this. |
| **State recovery** | When a relay promotes to host, it has zero knowledge of any plugin connections the dead host owned. The plugin must reconnect from Figma's side. This is partially why "plugin shows Connected but MCP says no" — the plugin's view of the world has lagged the host's. |
| **Multi-file** | Relays can't `joinChannel` (see §2.3). Multi-file requires being the host, which only one session can be. |
| **Zombie processes** | The host process has stdin-EOF and parent-PID heartbeat checks ([index.ts:50-74](../../../figma-mcp/src/server/index.ts:50)) to detect when its parent (Claude Code) dies. But if the parent gets `SIGKILL`'d or the system suspends, those heartbeats can lag. The window between "Claude Code died" and "host realizes and exits" is ~5 seconds at minimum, sometimes longer. New sessions in that window see `EADDRINUSE` and fail to start, OR connect as relays to a dying host. |

Patching any single one of these (e.g. better state mirroring, stronger heartbeats, deterministic election) gets us closer but never to a state where it just works. The host-or-relay model is fundamentally **N processes attempting to coordinate without a coordinator**. We need a coordinator.

---

## 4. Goals and non-goals

### Goals

- **G1.** Plugin connects once to the bridge and stays connected as long as Figma is open, regardless of how many Claude Code sessions come and go.
- **G2.** Zero manual intervention to clear stuck states under normal use (no `kill <pid>`, no plugin reopens, no copy-pasting channel codes).
- **G3.** Multi-Figma-file support actually works — `joinChannel` succeeds from any session, and disambiguation works without per-client config (any MCP client benefits).
- **G4.** Survives Mac login — daemon comes back automatically at user login, plugin reconnects when Figma opens.
- **G5.** Easy to reason about: one process owns plugin state, every other process is a thin client.
- **G6.** Cleanly reversible — if the daemon model causes problems, we can `git revert` and resume host-or-relay with no data migration.
- **G7. (R3)** Tool-agnostic: Codex, Cursor, and any other MCP-capable AI client gets the same UX (no copy-paste, multi-file aware) without any client-specific configuration.

### Non-goals

- **NG1.** Cross-host bridging (e.g. running figma-mcp on machine A, plugin on machine B). Not a use case today.
- **NG2.** Multi-user coordination (multiple humans editing). Single-user, single-machine.
- **NG3.** Plugin protocol changes. The plugin keeps its existing `localhost:3055` connect behaviour. Plugin code is unchanged.
- **NG4.** Persistent storage of plugin state across daemon restarts. Plugin reconnects from scratch on daemon restart. (See §19 for why this is fine.)
- **NG5.** A polished UI for the daemon. It's a background service. Logs to files; that's all.
- **NG6.** Replacing launchd with a userland process manager (PM2, etc.). launchd is built-in, free, reliable, and survives reboot — no reason to add a dependency.

---

## 5. Design alternatives considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **(a)** Keep host-or-relay, fix mirroring | No new infra | Doesn't fix multi-file. Doesn't fix promotion races. State drift is structural. | **Rejected** — can't get to "just works." |
| **(b)** File-lock-based election (one MCP wins via flock; others wait) | No background process | Still N processes coordinating. Lock holders die ungracefully. Doesn't fix multi-file. | **Rejected** — moves the problem, doesn't solve it. |
| **(c)** Daemon as singleton via launchd (this plan) | One owner, no election. Survives sessions and reboots. Multi-file falls out for free. Clean rollback. | Adds an install step. New concept (LaunchAgent) for users. | **Chosen** |
| **(d)** Replace WebSocket with HTTP + SSE | Slightly simpler in some ways | Still need a process owning the port. Doesn't change the core problem. Big rewrite. | **Rejected** — orthogonal to the architectural issue. |
| **(e)** Daemon as singleton via Node `child_process.spawn(detached:true)` from first MCP | No external install step | First MCP "promotes" itself to daemon by detaching, which has all the same election problems. Plus, no auto-restart on crash. | **Rejected** — reinvents launchd badly. |

Option (c) is meaningfully different from the others because it introduces an actor that **isn't tied to any Claude Code session's lifecycle**. That breaks the coupling that produces the existing failure modes.

---

## 6. Target architecture

```
┌─────────────────────────────────┐
│  Figma (Desktop or Browser)     │
│  ┌───────────────────────────┐  │
│  │ Claude Code Bridge plugin │  │────── ws://localhost:3055 ──────┐
│  └───────────────────────────┘  │                                 │
│  Plugin can be open in N Figma  │                                 │
│  files concurrently — protocol  │                                 ▼
│  already supports multi-channel │                     ┌──────────────────────────┐
└─────────────────────────────────┘                     │ figma-bridge-daemon      │
                                                        │ (launchd LaunchAgent,    │
                                                        │  KeepAlive on crash)     │
                                                        │                          │
                                                        │ - Owns port 3055 forever │
                                                        │ - Holds all plugin conns │
                                                        │ - Routes by channelId    │
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
                                          │ - No port binding      │   │ - No port binding       │
                                          │ - No promotion logic   │   │ - No promotion logic    │
                                          └────────────────────────┘   └─────────────────────────┘
```

Two protocols on the same socket:
- **Plugin ↔ daemon**: identical to the existing plugin ↔ host protocol. Plugin code does not change.
- **MCP client ↔ daemon**: identical to the existing relay-client ↔ host protocol (`relay_command`, `relay_response`, `relay_status`, `relay_status_response`). The renamed "daemon-client" reuses these messages; the daemon side is the existing `FigmaBridgeWebSocketServer` which already speaks them.

**Key insight:** the existing `FigmaBridgeWebSocketServer` and the existing relay protocol are already the right shapes for this. We're not redesigning anything — we're removing the part of the stdio process that *also* tries to be a host.

---

## 7. Architectural invariants

These should hold no matter how the implementation evolves:

- **I1.** At most one process owns port 3055. (The daemon. Always.)
- **I2.** A stdio MCP can never bind port 3055. (Pure client always.)
- **I3.** A stdio MCP terminating does not affect plugin connection. (Daemon owns the plugin socket.)
- **I4.** The daemon terminating means: plugin will reconnect once the daemon is up again (launchd-managed). MCP clients reconnect transparently with their existing reconnect timer.
- **I5.** The daemon has no per-session state. All session-affinity (which channel a given MCP is using) lives in the daemon's in-memory map keyed by the WebSocket connection itself, not by any persistent ID. When an MCP disconnects, its channel selection is forgotten — that's fine because a new MCP will call `join_channel` again.
- **I6.** *(R2)* Plugin state visible to an MCP client is push-mirrored from the daemon, not pulled-on-connect. After any change in the daemon's plugin set or active channel, every connected MCP client receives a `client_status_update` within the staleness window (single-digit ms in normal operation). See §2.5.
- **I7.** *(R2)* Plugin port narrowing: in the daemon model, the Figma plugin connects to exactly one port (3055). The 3055–3060 fallback range from the host-or-relay era is removed. See §10b.

---

## 8. File-by-file implementation plan

All paths relative to `/Users/ethan/Documents/projects/figma-mcp/`. **Revised in R2** to reflect the actual scope of the protocol changes.

| Path | Action | Effort |
|---|---|---|
| `src/daemon/index.ts` | **CREATE** | 30 min |
| `src/server/index.ts` | **MODIFY** (delete host-or-relay fork; depend on daemon-client; keep `FIGMA_MCP_PORT` env var name) | 10 min |
| `src/server/relay-client.ts` | **MODIFY + RENAME** to `daemon-client.ts` (delete promotion logic; add `client_status_update` push handler; add async `joinChannel` over the wire; ground-truth pull for `get_connection_status`) | 60 min |
| `src/server/websocket-server.ts` | **MODIFY (R2 + R3)** — R2: broadcast `client_status_update` on plugin join/leave/active-channel-change; add `client_join_channel` / `client_status` request handlers; rename `relay_*` → `client_*` per Q4. R3: convert `activeChannel` to per-client map (`activeChannelByClient: Map<WebSocket, string|null>`); track `mcpClients: Set<WebSocket>`. | 75 min |
| `src/server/mcp-server.ts` | **MODIFY (R2 + R3)** — R2: `joinChannel` and `getConnectedFileInfo` become async, await both. R3: tool descriptions get embedded disambiguation guidance per §17; `exec()` returns structured `AMBIGUOUS_FILE` error when multiple plugins are connected and no per-client active channel is set. | 25 min |
| `src/server/types.ts` | **MODIFY (R2)** — add new wire message types (`client_status_update`, `client_join_channel`, `client_join_channel_response`, `client_status`); update `FigmaBridge.joinChannel` signature to `Promise<boolean>`; update consumers (`websocket-server.ts` `joinChannel` becomes `async` returning `Promise<boolean>` — trivial wrap) | 15 min |
| `src/plugin/ui.ts` | **MODIFY (R2)** — narrow `WS_PORTS` to `[3055]`. Remove cycling logic. See §10b. | 10 min |
| `src/plugin/manifest.json` | **MODIFY (R2)** — narrow `allowedDomains` and `devAllowedDomains` to `ws://localhost:3055`. See §10b. | 5 min |
| `src/plugin/code.ts` | **UNCHANGED** | 0 |
| `scripts/install-daemon.sh` | **CREATE** | 25 min |
| `scripts/uninstall-daemon.sh` | **CREATE** | 5 min |
| `package.json` | **MODIFY** (add `build:daemon`, `install-daemon`, `uninstall-daemon` scripts) | 5 min |
| `README.md` | **CREATE (R2)** — does not currently exist; new file documenting one-time install + update + uninstall + multi-file note | 25 min |
| `~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist` | **CREATE** (via install script) | (covered above) |

**Total active code change:** ~3 hours focused. Docs + scripts + testing add another ~1.5 hours. See §25 for revised total.

---

## 9. Daemon entrypoint — code shape

`src/daemon/index.ts`:

```ts
// figma-bridge-daemon — singleton owner of the WebSocket port.
// Lifecycle managed by launchd. See ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist
// and scripts/install-daemon.sh.

import { FigmaBridgeWebSocketServer } from "../server/websocket-server.js";

const PORT = parseInt(process.env.FIGMA_MCP_PORT ?? "3055", 10);

async function main() {
  const wsServer = new FigmaBridgeWebSocketServer(PORT);

  try {
    await wsServer.start();
  } catch (err: any) {
    if (err.code === "EADDRINUSE") {
      console.error(`[figma-daemon] FATAL: port ${PORT} already in use.`);
      console.error(`[figma-daemon] Another daemon instance is running, or a stale figma-mcp process is bound.`);
      console.error(`[figma-daemon] Find offender: lsof -i :${PORT} -P`);
      process.exit(2);    // distinct exit code so launchd's KeepAlive doesn't restart-loop
    }
    throw err;
  }

  console.error(`[figma-daemon] Listening on port ${PORT}`);

  // Graceful shutdown: both signals trigger a clean wsServer.stop()
  // and exit(0) so launchd's `SuccessfulExit: false` policy does NOT
  // restart us. (We were asked to stop.)
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`[figma-daemon] Received ${signal}, shutting down...`);
    wsServer.stop();
    process.exit(0);
  };

  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Catch unhandled errors loudly so launchd's stderr log captures them.
  process.on("uncaughtException", (err) => {
    console.error("[figma-daemon] Uncaught exception:", err);
    process.exit(1);     // distinct from clean exit; launchd will restart
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[figma-daemon] Unhandled rejection:", reason);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("[figma-daemon] Fatal startup error:", err);
  process.exit(1);
});
```

### Notable differences from the current `server/index.ts`

| Property | server/index.ts (current) | daemon/index.ts (new) |
|---|---|---|
| Tries to fall back to relay on EADDRINUSE | Yes ([line 18-27](../../../figma-mcp/src/server/index.ts:18)) | **No** — exits with code 2. The daemon should be the only thing on this port; if it isn't, something is badly wrong. |
| Connects MCP server to stdio | Yes ([line 31-33](../../../figma-mcp/src/server/index.ts:31)) | **No** — daemon doesn't speak MCP. It's a pure WebSocket server. |
| stdin-EOF / parent-PID heartbeat zombie cleanup | Yes ([line 50-74](../../../figma-mcp/src/server/index.ts:50)) | **No** — the daemon has no parent process to track. launchd is its parent. |
| Shutdown signal handlers | Yes | Yes (kept) |

### Exit code policy (matters for launchd)

- `0` = clean exit (received SIGTERM/SIGINT). launchd plist sets `SuccessfulExit: false` in `KeepAlive`, so launchd will NOT restart.
- `1` = crash (uncaught exception). launchd will restart after `ThrottleInterval` (10s).
- `2` = misconfiguration (port already in use). launchd's `KeepAlive` policy treats this as a non-clean exit, so it WILL try to restart. **Open question for review:** is that the behaviour we want, or should we treat exit code 2 as fatal? See §23, Q5.

---

## 10. daemon-client.ts — what stays, what goes (Revised in R2)

`src/server/relay-client.ts` → `src/server/daemon-client.ts`. Renamed for accuracy.

### 10.1 Stays (largely unchanged)

- WebSocket connection + reconnect + heartbeat ([lines 37-91, 93-114](../../../figma-mcp/src/server/relay-client.ts:37))
- `pendingRequests` map + timeout handling ([lines 17, 188-194, 222-241](../../../figma-mcp/src/server/relay-client.ts:17))
- `sendCommand` (the sendCommand path is correct as-is, modulo deleting the "if promoted" branch)

### 10.2 Goes (deleted)

- `promoted: boolean` field ([line 20](../../../figma-mcp/src/server/relay-client.ts:20))
- `promotedServer: FigmaBridgeWebSocketServer | null` field ([line 21](../../../figma-mcp/src/server/relay-client.ts:21))
- The promotion attempt block in `scheduleReconnect` ([lines 122-134](../../../figma-mcp/src/server/relay-client.ts:122))
- The "if promoted, delegate to promotedServer" branches in `sendCommand` / `isPluginConnected` / `getConnectedFileInfo` / `joinChannel` / `stop` ([lines 215-217, 244-246, 253-255, 266-268, 278-281](../../../figma-mcp/src/server/relay-client.ts:215))
- **The `refreshStatus` polling pattern ([lines 196-212](../../../figma-mcp/src/server/relay-client.ts:196))** — replaced by push-based status updates from the daemon (§10.3).

### 10.3 Changes — push-based status (R2)

**This is the key behavioural change vs R1.**

The cache field stays (`cachedStatus`) but is no longer populated by `refreshStatus`. Instead:

- On `connect`, the client sends ONE `client_status` request and awaits the response, populating `cachedStatus` with the daemon's current snapshot. (Bootstrap.)
- The client adds a handler for the new `client_status_update` wire message. Whenever the daemon sends one, the client replaces `cachedStatus` with the pushed payload.
- `isPluginConnected` reads the cache (used by the per-command gate in `mcp-server.ts`).
- **`getConnectedFileInfo` does NOT read the cache.** It always sends a `client_status` request and awaits the response. This is the user-facing `get_connection_status` query — must be ground truth (contract C3 in §2.5).

**Why split the two reads:** the per-command gate runs hot (every tool call), so the cache is the right shape there — provided the cache stays fresh, which it does via push. The `get_connection_status` query is run by the user/Claude when they want to verify; it's not hot, and it has the strongest user expectation of correctness.

### 10.4 Changes — async `joinChannel` over the wire (R2)

Today's `joinChannel` is synchronous everywhere ([types.ts:45](../../../figma-mcp/src/server/types.ts:45), [websocket-server.ts:302](../../../figma-mcp/src/server/websocket-server.ts:302), [mcp-server.ts:64](../../../figma-mcp/src/server/mcp-server.ts:64)) and on the relay client returns `false` unconditionally ([relay-client.ts:265](../../../figma-mcp/src/server/relay-client.ts:265)) unless promoted.

**For the daemon model, `joinChannel` must round-trip to the daemon and the interface must become async.** This forces:

1. New wire message types in `types.ts`:
   ```ts
   type:
     | "join" | "message" | "response"            // existing plugin-side
     | "client_command"                            // was relay_command — see §23 Q4
     | "client_response"                           // was relay_response
     | "client_status"                             // request: client → daemon, "what's the state right now?"
     | "client_status_response"                    // response: daemon → client, snapshot
     | "client_status_update"                      // push: daemon → client, broadcast on state change
     | "client_join_channel"                       // request: client → daemon, "set my active channel"
     | "client_join_channel_response"              // response: daemon → client, success/failure
   ```

2. `FigmaBridge` interface:
   ```ts
   export interface FigmaBridge {
     // ...
     joinChannel(channelId: string): Promise<boolean>;   // was: boolean
   }
   ```

3. `FigmaBridgeWebSocketServer.joinChannel` becomes trivially async (just wrap the existing sync impl in `Promise.resolve`):
   ```ts
   async joinChannel(channelId: string): Promise<boolean> {
     if (this.channelToClient.has(channelId)) {
       const previous = this.activeChannel;
       this.activeChannel = channelId;
       if (previous !== channelId) this.broadcastStatusUpdate();   // §2.5 push trigger
       return true;
     }
     return false;
   }
   ```

4. `FigmaBridgeDaemonClient.joinChannel` becomes a real wire RPC:
   ```ts
   async joinChannel(channelId: string): Promise<boolean> {
     const id = uuidv4();
     return new Promise((resolve, reject) => {
       const timeout = setTimeout(() => {
         this.pendingRequests.delete(id);
         reject(new Error("client_join_channel timed out"));
       }, REQUEST_TIMEOUT_MS);
       this.pendingRequests.set(id, { resolve, reject, timeout });
       this.ws!.send(JSON.stringify({
         type: "client_join_channel",
         channel: "",
         id,
         data: { channelId },
       }));
     });
   }
   ```
   With a corresponding `client_join_channel_response` handler in `handleMessage` that resolves the pending request with the boolean from `data.success`.

5. `mcp-server.ts:64` updates to `await` the call:
   ```ts
   const success = await wsServer.joinChannel(channelId);
   ```

### 10.5 Connection failure messaging

When initial `connect` fails because the daemon isn't running, throw a clear error that the MCP server can surface upward — see §11.

### 10.6 Suggested final shape (sketch)

```ts
// src/server/daemon-client.ts
export class FigmaBridgeDaemonClient implements FigmaBridge {
  // ws, pendingRequests, reconnect/heartbeat fields kept from relay-client.
  // NO promoted, promotedServer fields.
  // cachedStatus kept but populated only by push.

  connect(): Promise<void> {
    // 1. Open ws to daemon.
    // 2. On open: send a single "client_status" request, await response,
    //    set cachedStatus from it. (Bootstrap.)
    // 3. Subscribe to "client_status_update" in handleMessage.
  }

  // Cache-driven (hot path, per-command gate)
  isPluginConnected(): boolean {
    return this.cachedStatus?.connected ?? false;
  }

  // Ground-truth pull (cold path, user-facing query)
  async getConnectedFileInfo(): Promise<{ ... }> {
    // Always round-trip to daemon for client_status. Returns pushed-snapshot shape.
  }

  async joinChannel(channelId: string): Promise<boolean> {
    // wire RPC via client_join_channel / client_join_channel_response
  }

  async sendCommand(command, channel?): Promise<any> {
    // unchanged from relay-client minus the "if promoted" branch
    // (uses client_command / client_response wire messages)
  }

  private handleMessage(msg) {
    switch (msg.type) {
      case "client_response":           /* existing relay_response logic */ break;
      case "client_status_response":    /* resolve pending status request */ break;
      case "client_join_channel_response": /* resolve pending join request */ break;
      case "client_status_update":      /* PUSH — replace cachedStatus */
        this.cachedStatus = msg.data;
        break;
    }
  }

  stop(): void { /* unchanged from relay-client minus the promoted branch */ }
}
```

### 10.7 What this means for `getConnectedFileInfo` becoming async

`FigmaBridge.getConnectedFileInfo` is currently synchronous. In R2's design, the daemon-client implementation must round-trip to the daemon. That makes it async, which propagates to `mcp-server.ts:54` where the `get_connection_status` tool reads it.

```ts
// mcp-server.ts (R2)
mcp.tool(
  "get_connection_status",
  "...",
  {},
  async () => {
    const info = await wsServer.getConnectedFileInfo();   // was: not awaited
    return formatResult({ ok: true, data: info });
  }
);
```

`FigmaBridgeWebSocketServer.getConnectedFileInfo` becomes trivially async by wrapping the existing impl in `Promise.resolve`. Same pattern as `joinChannel`.

This is one more place R1 was wrong about "websocket-server.ts: UNCHANGED."

---

## 10b. Plugin port narrowing (R2)

**Reviewer finding H3:** the daemon's "owns 3055" invariant is weaker than it sounds because [`ui.ts:4`](../../../figma-mcp/src/plugin/ui.ts:4) defines:

```ts
const WS_PORTS = [3055, 3056, 3057, 3058, 3059, 3060];
```

…and the plugin cycles through these in `scheduleReconnect` ([ui.ts:122-133](../../../figma-mcp/src/plugin/ui.ts:122)). [`manifest.json:9-13`](../../../figma-mcp/manifest.json:9) lists all six in `allowedDomains` and `devAllowedDomains`. The manifest's own `reasoning` field says these exist "to support FIGMA_MCP_PORT env var overrides."

In the daemon model, the port is fixed (one daemon, one port). The fallback range creates a hazard: if a stale `node dist/server/index.js` from before install is bound to 3056 (or 3057, etc.), the plugin can connect to it instead of the daemon. The user sees "Connected" in Figma but the daemon doesn't see the plugin and any new MCP client can't reach it.

### Fix: narrow to one port

```diff
// src/plugin/ui.ts
- const WS_PORTS = [3055, 3056, 3057, 3058, 3059, 3060];
- let currentPortIndex = 0;
+ const WS_PORT = 3055;
```

```diff
// src/plugin/ui.ts — connect()
- const port = WS_PORTS[currentPortIndex];
- const url = "ws://localhost:" + port;
+ const url = "ws://localhost:" + WS_PORT;
```

```diff
// src/plugin/ui.ts — scheduleReconnect()
- // Cycle through ports on reconnect attempts
- currentPortIndex = (currentPortIndex + 1) % WS_PORTS.length;
- console.log("[ui] Reconnecting on port " + WS_PORTS[currentPortIndex] + " (delay: " + reconnectDelay + "ms)...");
+ console.log("[ui] Reconnecting (delay: " + reconnectDelay + "ms)...");
  connect();
- // Only increase delay after a full cycle through all ports
- if (currentPortIndex === 0) {
-   reconnectDelay = Math.min(reconnectDelay * 1.5, RECONNECT_MAX_MS);
- }
+ reconnectDelay = Math.min(reconnectDelay * 1.5, RECONNECT_MAX_MS);
```

```diff
// src/plugin/manifest.json
  "networkAccess": {
    "allowedDomains": [
-     "ws://localhost:3055", "ws://localhost:3056", "ws://localhost:3057",
-     "ws://localhost:3058", "ws://localhost:3059", "ws://localhost:3060"
+     "ws://localhost:3055"
    ],
-   "reasoning": "Connects to a local MCP server over WebSocket for Claude Code integration. Multiple ports listed to support FIGMA_MCP_PORT env var overrides.",
+   "reasoning": "Connects to a local MCP server over WebSocket for Claude Code integration.",
    "devAllowedDomains": [
-     "ws://localhost:3055", "ws://localhost:3056", "ws://localhost:3057",
-     "ws://localhost:3058", "ws://localhost:3059", "ws://localhost:3060"
+     "ws://localhost:3055"
    ]
  }
```

### Trade-off: losing the FIGMA_MCP_PORT override

The narrowing eliminates the ability to run on a non-default port via `FIGMA_MCP_PORT`. R1 (and the current code) has this as a configurable knob; R2 collapses it.

**Argument for collapsing:** nobody uses it in practice (it's not documented in the README that doesn't exist; no setup notes mention it). The cost of keeping it is the singleton-violation hazard the reviewer flagged.

**Argument for keeping it:** future-proofing against port conflicts with other software.

**My lean:** collapse. If port conflict becomes a problem, expand the manifest's `allowedDomains` plus update the daemon and plugin port constants in lockstep. That's a deliberate, atomic change rather than a runtime fallback that creates ambiguity.

**Open question (Q9, R2):** see §23.

### Sweep check in install script

The install script should also sweep the entire 3055–3060 range at install time and refuse to install if anything else is listening:

```bash
# scripts/install-daemon.sh — preflight
for port in 3055 3056 3057 3058 3059 3060; do
  if lsof -i :"$port" -P -sTCP:LISTEN > /dev/null 2>&1; then
    echo "ERROR: port $port is in use. Identify and kill the offender first:"
    echo "  lsof -i :$port -P"
    exit 1
  fi
done
```

After install, only port 3055 needs to be sweep-checked (the daemon owns it). 3056–3060 can be revalidated occasionally if someone is debugging "why isn't this connecting" — a stale process on 3056 with the OLD plugin (pre-narrowing) would still connect there.

---

## 11. server/index.ts — simplification

Current code is 80 lines, much of which is the host-or-relay fork plus zombie cleanup. New version should be ~25–30 lines.

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FigmaBridgeDaemonClient } from "./daemon-client.js";
import { createMcpServer } from "./mcp-server.js";

const PORT = parseInt(process.env.FIGMA_MCP_PORT ?? "3055", 10);

async function main() {
  const client = new FigmaBridgeDaemonClient(PORT);

  try {
    await client.connect();
  } catch (err: any) {
    console.error("[figma-mcp] Cannot connect to figma-bridge-daemon.");
    console.error("[figma-mcp] Start the daemon with:");
    console.error("[figma-mcp]   launchctl load ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist");
    console.error("[figma-mcp] Or run scripts/install-daemon.sh from /Users/ethan/Documents/projects/figma-mcp/");
    console.error("[figma-mcp] Underlying error:", err.message);
    process.exit(1);
  }

  const mcp = createMcpServer(client);
  const transport = new StdioServerTransport();
  await mcp.connect(transport);

  console.error("[figma-mcp] Connected to daemon, MCP running on stdio");

  // Shutdown on parent (Claude Code) death.
  // No need for parent-PID heartbeat or stdin-EOF — those were for catching
  // when the host needed to release port 3055. Now we don't own the port,
  // so we just exit when stdin closes (Claude Code will SIGTERM us anyway,
  // but stdin-EOF is the fastest signal).
  const shutdown = () => {
    client.stop();
    process.exit(0);
  };
  process.on("SIGINT",  shutdown);
  process.on("SIGTERM", shutdown);
  process.stdin.on("end",   shutdown);
  process.stdin.on("error", shutdown);
}

main().catch((err) => {
  console.error("[figma-mcp] Fatal:", err);
  process.exit(1);
});
```

**Open question:** should we keep the periodic parent-PID heartbeat from the current code ([lines 62-74](../../../figma-mcp/src/server/index.ts:62))? My read is no — stdin-EOF + signal handlers are sufficient when we're not holding a port. But happy to keep it as belt-and-braces. See §23, Q4.

---

## 12. Install and uninstall scripts

### `scripts/install-daemon.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist"
DAEMON_JS="$REPO_ROOT/dist/daemon/index.js"
LOG_DIR="$HOME/Library/Logs"

# 1. Resolve a Node binary that's actually on this user's machine
#    (don't hardcode /usr/local/bin/node — fails on nvm, mise, asdf, Volta, Homebrew on Apple Silicon, etc.)
NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "ERROR: 'node' not found on PATH. Install Node 20+ and retry." >&2
  exit 1
fi
echo "Using Node: $NODE_BIN ($($NODE_BIN --version))"

# 2. Build the daemon
echo "Building daemon..."
cd "$REPO_ROOT"
npm run build:daemon

if [[ ! -f "$DAEMON_JS" ]]; then
  echo "ERROR: $DAEMON_JS not found after build." >&2
  exit 1
fi

# 3. Make sure log dir exists
mkdir -p "$LOG_DIR"

# 4. Write the plist
echo "Writing plist to $PLIST_PATH"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ethan.figma-bridge-daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$DAEMON_JS</string>
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
  <string>$LOG_DIR/figma-bridge-daemon.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/figma-bridge-daemon.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

# 5. Bootout any old version (idempotent — fine if not loaded)
#    R2: switched from legacy `load`/`unload` to modern `bootstrap`/`bootout`/`kickstart`.
#    The legacy commands still work but Apple has been deprecating them since macOS 10.11.
#    The modern API requires a service target (gui/<uid>/<label>).
USER_TARGET="gui/$(id -u)"
LABEL="com.ethan.figma-bridge-daemon"

launchctl bootout "$USER_TARGET/$LABEL" 2>/dev/null || true

# 6. Bootstrap new version
echo "Bootstrapping via launchctl..."
launchctl bootstrap "$USER_TARGET" "$PLIST_PATH"

# 7. Kickstart so it runs immediately (don't wait for next login)
launchctl kickstart "$USER_TARGET/$LABEL"

# 8. Verify
sleep 1
if launchctl print "$USER_TARGET/$LABEL" > /dev/null 2>&1; then
  echo "✓ Daemon registered with launchd"
else
  echo "WARNING: daemon not visible. Check $LOG_DIR/figma-bridge-daemon.err.log" >&2
  exit 1
fi

if lsof -i :3055 -P -sTCP:LISTEN > /dev/null 2>&1; then
  echo "✓ Daemon listening on port 3055"
else
  echo "WARNING: daemon not listening on 3055 yet. Check logs at $LOG_DIR/figma-bridge-daemon.err.log" >&2
fi

echo
echo "Install complete. Logs:"
echo "  stdout: $LOG_DIR/figma-bridge-daemon.log"
echo "  stderr: $LOG_DIR/figma-bridge-daemon.err.log"
```

### `scripts/uninstall-daemon.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

PLIST_PATH="$HOME/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist"
USER_TARGET="gui/$(id -u)"
LABEL="com.ethan.figma-bridge-daemon"

# R2: modern bootout (fail-silent if not bootstrapped) instead of legacy unload
launchctl bootout "$USER_TARGET/$LABEL" 2>/dev/null || true

if [[ -f "$PLIST_PATH" ]]; then
  rm -f "$PLIST_PATH"
  echo "✓ Removed $PLIST_PATH"
else
  echo "No plist at $PLIST_PATH (daemon was not installed via this script)"
fi

# Sanity-check the port is now free.
if lsof -i :3055 -P -sTCP:LISTEN > /dev/null 2>&1; then
  echo "WARNING: something is still listening on port 3055."
  echo "  Run: lsof -i :3055 -P"
fi
```

---

## 13. launchd plist

The install script writes this dynamically with the resolved Node path. Final form (with `$NODE_BIN` substituted):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ethan.figma-bridge-daemon</string>

  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>      <!-- substituted by install script -->
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
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
```

### Key choices and why

- **`KeepAlive` is a dict, not a bare `<true/>`.** The dict form lets us be selective: restart on crash (`Crashed: true`) and on non-clean exit (`SuccessfulExit: false`), but **don't** restart if we ourselves call `exit(0)` after SIGTERM. That makes uninstall work correctly — `bootout` sends SIGTERM, the daemon exits 0, launchd does not respawn.
- **`ThrottleInterval: 10`** stops launchd from respawning faster than every 10 seconds if we get into a crash loop.
- **`RunAtLoad: true`** means it starts immediately when the LaunchAgent is bootstrapped, and again at the next login. **(R2 clarification:** a LaunchAgent at `~/Library/LaunchAgents/` runs at **user login**, not at machine boot. The user's session doesn't exist before login, so neither does the LaunchAgent. After a cold reboot, the daemon comes back as soon as the user signs in. If you want the daemon running before login, you'd need a LaunchDaemon at `/Library/LaunchDaemons/` — strictly more complex (requires root install, drops to a `UserName`, no access to user keychain, etc.) and not needed here. Our use case is "I open Claude Code, the daemon is already running" — login-scoped is correct.)
- **No `LaunchOnlyOnce` or other one-shot keys** — we want it persistent across the session.
- **`PATH` includes both `/usr/local/bin` (Intel Homebrew) and `/opt/homebrew/bin` (Apple Silicon Homebrew)** so any subprocess we ever spawn (we don't currently, but defensive) can find binaries.
- **No `WorkingDirectory`** — the daemon doesn't care about CWD.
- **No `UserName`** — LaunchAgents (in `~/Library/LaunchAgents/`) inherently run as the current user. Don't confuse with LaunchDaemons (`/Library/LaunchDaemons/`) which run as root and need `UserName` to drop privileges.

---

## 14. Build pipeline

The current build uses esbuild for the server with an ESM-CJS interop banner ([package.json:9](../../../figma-mcp/package.json:9)):

```
esbuild src/server/index.ts --bundle --platform=node --target=node20 --format=esm
  --outfile=dist/server/index.js
  --banner:js="import{createRequire}from'module';const require=createRequire(import.meta.url);"
```

The daemon needs the same treatment. Adding a `build:daemon` script:

```
esbuild src/daemon/index.ts --bundle --platform=node --target=node20 --format=esm
  --outfile=dist/daemon/index.js
  --banner:js="import{createRequire}from'module';const require=createRequire(import.meta.url);"
```

Sanity-check: the daemon imports `FigmaBridgeWebSocketServer` from `../server/websocket-server.js`. esbuild's `--bundle` flag follows that import and pulls everything reachable into a single `dist/daemon/index.js`. The `ws` package goes inline. No external deps at runtime — daemon doesn't even need `node_modules` to be installed when launchd runs it.

**Open question:** should we use `--external:ws` to keep `ws` external (smaller bundle, faster builds, but launchd needs `node_modules` reachable)? Bundled is simpler — no install dependency at runtime, just `dist/daemon/index.js`. See §23, Q6.

---

## 15. package.json changes

```diff
 "scripts": {
-  "build": "npm run build:server && npm run build:plugin",
+  "build": "npm run build:daemon && npm run build:server && npm run build:plugin",
+  "build:daemon": "esbuild src/daemon/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=dist/daemon/index.js --banner:js=\"import{createRequire}from'module';const require=createRequire(import.meta.url);\"",
   "build:server": "esbuild src/server/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=dist/server/index.js --banner:js=\"import{createRequire}from'module';const require=createRequire(import.meta.url);\"",
   "build:plugin": "tsx scripts/build-plugin.ts",
+  "install-daemon": "bash scripts/install-daemon.sh",
+  "uninstall-daemon": "bash scripts/uninstall-daemon.sh",
   "dev": "concurrently \"npm run dev:server\" \"npm run dev:plugin\"",
+  "dev:daemon": "esbuild src/daemon/index.ts ... --watch",
   "dev:server": "...",
   "dev:plugin": "..."
 }
```

`dev:daemon` is optional but useful: rebuilds on file change. To take effect, you'd `launchctl unload` then `launchctl load` to pick up the new binary, OR run the daemon manually for the dev session (`node dist/daemon/index.js` after building).

---

## 16. README — CREATE (R2 correction)

There is no `README.md` in the figma-mcp repo today. R1 said "modify README"; the actual action is **create**. This is a small thing to flag for the estimate (creating a doc-from-zero takes longer than a dot edit) but worth getting right.

The new README covers a one-time install section roughly like:

> ## Install (one-time)
>
> The figma-mcp bridge has two pieces: a long-running daemon (managed by launchd) and an MCP stdio process (spawned by Claude Code per session).
>
> ```bash
> cd /Users/ethan/Documents/projects/figma-mcp
> npm install
> npm run build
> npm run install-daemon
> ```
>
> This installs a LaunchAgent that starts the daemon at login and keeps it running across Claude Code sessions. The daemon owns port 3055 and holds plugin connections; individual MCP processes are pure clients.
>
> Logs:
> - stdout: `~/Library/Logs/figma-bridge-daemon.log`
> - stderr: `~/Library/Logs/figma-bridge-daemon.err.log`
>
> ## Uninstall
>
> ```bash
> npm run uninstall-daemon
> ```
>
> ## Update (after pulling new code)
>
> ```bash
> npm run build:daemon
> launchctl kickstart -k "gui/$(id -u)/com.ethan.figma-bridge-daemon"
> ```
>
> The `-k` flag kills the running instance first, then starts a fresh one with the newly built binary. Or just rerun `npm run install-daemon` — it's idempotent (it `bootout`s the old instance, rewrites the plist, and `bootstrap`s the new one).

---

## 17. Multi-file UX — in the daemon, not a skill (revised in R3)

### Why R1 and R2 had this wrong

R1 and R2 framed multi-file disambiguation as "a skill in `.claude/`" — a config file inside Claude Code that walks the user through selecting which Figma file they meant. **That framing is wrong** for one specific reason: it works only in Claude Code.

The bridge speaks **MCP** (Model Context Protocol), which is a standard. Any MCP-capable AI client can talk to the daemon: Claude Code, Codex (OpenAI ChatGPT), Cursor, Continue, and others. If the disambiguation logic lives inside Claude Code, every other client falls back to copy-paste-channel-codes — exactly the workflow pain the daemon is meant to eliminate.

The user explicitly raised this: they want to use Codex to control Figma too. R3 reshapes this section accordingly.

### Where the disambiguation logic actually belongs

Two layers, both inside `figma-mcp` itself (no Claude-Code-specific files):

**Layer 1 — MCP tool descriptions.** Every MCP client receives the daemon's tool descriptions when it connects. These descriptions are read by the model on the other end (Claude, GPT, etc.). We embed the disambiguation guidance directly in those descriptions:

```ts
mcp.tool(
  "get_connection_status",
  "Check if a Figma plugin is connected and which file/page is open. " +
  "If pluginCount > 1, you MUST ask the user which file before invoking " +
  "any selection-dependent command. Use join_channel to select.",
  // ...
);

mcp.tool(
  "join_channel",
  "Select which Figma file to operate on when multiple are connected. " +
  "Required when pluginCount > 1. The channelId comes from the plugins[] " +
  "array returned by get_connection_status (each entry has channel and fileName).",
  // ...
);
```

The model sees these descriptions on every session, regardless of which AI client it's running in. Disambiguation behaviour falls out naturally.

**Layer 2 — structured error responses from the daemon.** When a command needs an active channel and the user has multiple files connected without choosing one, the daemon returns a structured error the model can recognise and act on:

```json
{
  "ok": false,
  "error": {
    "code": "AMBIGUOUS_FILE",
    "message": "Multiple Figma files are connected. Pick one with join_channel.",
    "data": {
      "plugins": [
        { "channel": "ps0gqiuc", "fileName": "Dictation app", "pageName": "Home" },
        { "channel": "k82mqd7e", "fileName": "2025 design system", "pageName": "Tokens" }
      ]
    }
  }
}
```

Any reasonable AI client, on receiving an `AMBIGUOUS_FILE` error, will surface the choice to the user, take the answer, call `join_channel`, and retry. No client-specific skill needed.

### Per-client active channel (Q13 — see §23)

Today's daemon has a single `activeChannel: string | null` field shared across all connected clients ([websocket-server.ts:21](../../../figma-mcp/src/server/websocket-server.ts:21)). With proper multi-file UX, this needs to become **per-client** (keyed by the MCP client's WebSocket connection):

```ts
// Before:
private activeChannel: string | null = null;

// After:
private activeChannelByClient = new Map<WebSocket, string | null>();
```

Without this change, two simultaneous sessions (one in Claude Code, one in Codex) would interfere: client A calls `join_channel("Dictation app")`, client B's commands now also go to "Dictation app" until B calls `join_channel` itself.

Auto-pick on the first plugin still happens (preserves the single-file case where users never deal with channels at all), but it's per-client: a new client's active channel defaults to "the only plugin if there's just one" or `null` if there are multiple.

### Behaviour to encode (revised)

1. Single Figma file open → daemon auto-picks; `get_connection_status` returns `pluginCount: 1` with `activeChannel` set; commands just work. **No copy-paste, no channel codes.** ✓
2. Zero Figma files open → daemon returns `pluginCount: 0`; `exec()` returns `NOT_CONNECTED`; user is prompted to open the plugin.
3. Two+ Figma files open and the client hasn't called `join_channel` yet → first command attempt returns `AMBIGUOUS_FILE` with the plugin list; the model on the other end asks the user; calls `join_channel`; retries.
4. Mid-session switch ("now use the design system file") → user asks the model; model calls `join_channel(other.channel)`; commands route to the new file.

### What this changes in the file-by-file plan

- `mcp-server.ts`: tool descriptions get the disambiguation hints embedded. `exec()` checks per-client active channel and returns `AMBIGUOUS_FILE` when ambiguous. ~15 min on top of the R2 changes.
- `websocket-server.ts`: `activeChannel: string | null` → `activeChannelByClient: Map<WebSocket, string|null>`. `joinChannel` becomes scoped to a specific WebSocket. The on-disconnect cleanup removes the entry. ~30 min on top of the R2 changes.
- `types.ts`: new error code `"AMBIGUOUS_FILE"` documented. (Just a string; no schema change.) ~2 min.

### What this means for the estimate

Multi-file is no longer a separate ~30–60 min workstream. It's bundled into the daemon refactor — adds ~45–60 min to §25's total. Trade-off: every MCP client benefits from day one, no Claude-Code-specific skill to maintain, no second shipping moment to coordinate.

### What this does NOT do

- Does not enforce *which* file the user picked. The model on the other end is responsible for asking the user well. The daemon just provides clear errors and clear options.
- Does not persist channel selection across daemon restarts. If the daemon restarts, every client's channel is forgotten and they re-disambiguate next time. That's correct behaviour — daemon restart is rare and re-disambiguation is cheap.

---

## 18. Test plan

In order. Each step should pass before moving on.

### T1. Clean install on a machine with no prior daemon

```bash
cd /Users/ethan/Documents/projects/figma-mcp
npm run build
npm run install-daemon
```

**Expected:**
- `launchctl list | grep figma-bridge-daemon` shows the daemon with PID and exit status 0.
- `lsof -i :3055 -P -sTCP:LISTEN` shows ONE process: `node ... dist/daemon/index.js`.
- `~/Library/Logs/figma-bridge-daemon.log` has `[figma-daemon] Listening on port 3055`.
- `~/Library/Logs/figma-bridge-daemon.err.log` exists but is empty (or has only the listen line, since stderr is where Node's `console.error` goes).

### T2. Plugin connects

Open Figma → run the Claude Code Bridge plugin. From a Claude Code session:

```
get_connection_status
```

**Expected:** `{ connected: true, pluginCount: 1, ... }`.

### T3. MCP comes and goes (the central proof of value)

1. Note current plugin status via `get_connection_status` → `connected: true, pluginCount: 1`.
2. Quit Claude Code entirely (Cmd+Q).
3. **Plugin UI in Figma still says "Connected"** — daemon didn't go down with the MCP.
4. Reopen Claude Code, start a new session. From the new session: `get_connection_status` should immediately return `connected: true, pluginCount: 1`. **No reconnect dance, no plugin reopening, no PID killing.**

### T4. Multi-file

1. Open the bridge plugin in a second Figma file. (Figma allows running the same plugin in multiple files simultaneously.)
2. `get_connection_status` returns `pluginCount: 2` with both files in `plugins[]`.
3. `join_channel(plugins[0].channel)` succeeds, returns true.
4. `get_selection` (or any selection-dependent command) operates on the selected file.
5. `join_channel(plugins[1].channel)` then `get_selection` operates on the other file.

### T5. Daemon crash resilience

1. Identify daemon PID: `lsof -i :3055 -P -sTCP:LISTEN | awk 'NR==2 {print $2}'`.
2. `kill -9 <pid>`.
3. Wait ~12 seconds (slightly longer than the 10s `ThrottleInterval`).
4. `lsof -i :3055 -P -sTCP:LISTEN` shows the daemon back, with a new PID.
5. Plugin will need to reconnect (Figma side — the WebSocket dropped). After reconnect, `get_connection_status` returns `connected: true, pluginCount: 1`.

### T6. Concurrent MCP sessions

1. Open three Claude Code sessions concurrently.
2. From each, run `get_connection_status` and (if a Figma file is open) `get_selection`.
3. All three should succeed with consistent results. No `EADDRINUSE` errors. No "another instance is open" errors.

### T7. Mac reboot

1. Reboot.
2. Without opening Claude Code, check `lsof -i :3055 -P -sTCP:LISTEN`. **Daemon should be running** because `RunAtLoad: true`.
3. Open Figma + plugin → connects.
4. Open Claude Code → `get_connection_status` works first try.

### T8. Graceful uninstall

```bash
npm run uninstall-daemon
```

**Expected:**
- `launchctl list | grep figma-bridge-daemon` returns nothing.
- `lsof -i :3055 -P -sTCP:LISTEN` returns nothing.
- `~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist` is gone.

### T9. Reinstall after uninstall

After T8, `npm run install-daemon` should succeed and the daemon should be back up.

### T10. (R2) Status freshness — late plugin connect

The acceptance test for the §2.5 contract.

1. Daemon running, no plugin connected.
2. Open Claude Code → MCP spawns → run `get_connection_status` → expect `connected: false, pluginCount: 0`.
3. Open Figma + plugin (plugin connects to daemon).
4. **Within 1 second**, run `get_connection_status` again → **expect `connected: true, pluginCount: 1`** without restarting Claude Code.
5. Run a real tool call (e.g. `get_selection`) → must succeed; the cache must have updated via push.

**Failure mode this catches:** the exact bug R1 would have shipped. If T10 fails, the push mechanism is broken or the cache isn't being updated.

### T11. (R2) Status freshness — plugin disconnect mid-session

1. Daemon running, plugin connected. MCP active. Confirm `connected: true`.
2. Quit Figma (or close the plugin) → daemon's plugin set drops to empty.
3. **Within 1 second**, run `get_connection_status` → expect `connected: false`.
4. Run a tool call → expect `NOT_CONNECTED` error (preflight gate works because cache updated via push).

### T12. (R2) Plugin port narrowing — stale process on 3056

1. Manually start a stale `node dist/server/index.js` listening on 3056 (simulate the reviewer's H3 hazard).
2. Run install-daemon — preflight should detect 3056 is in use and refuse to install.
3. Kill the stale process. Reinstall succeeds.
4. Open Figma + plugin (post-narrowing build) → plugin connects ONLY to 3055. Verify by reading plugin console: should see "WebSocket connected on port 3055" and never attempt 3056.

### T13. (R3) Multi-file disambiguation via MCP error response

The acceptance test for §17. Validates that disambiguation works without any Claude-Code-specific config — and therefore would work for Codex, Cursor, etc.

1. Daemon running. Open the bridge plugin in two Figma files (e.g. "Dictation app" and "2025 design system"). `get_connection_status` returns `pluginCount: 2` and the plugin list.
2. From a fresh Claude Code session, immediately try `get_selection` (without first calling `join_channel`).
3. **Expected:** the response is a structured error:
   ```json
   {
     "ok": false,
     "error": {
       "code": "AMBIGUOUS_FILE",
       "message": "Multiple Figma files are connected. Pick one with join_channel.",
       "data": { "plugins": [...] }
     }
   }
   ```
4. The model on the other end should naturally surface this to the user. Call `join_channel("ps0gqiuc")`. Retry `get_selection` → succeeds, operates on the picked file.
5. Mid-session: call `join_channel("k82mqd7e")` (the other file). `get_selection` now operates on the second file.

### T14. (R3) Per-client active channel — sessions don't interfere

Validates the Q13 design.

1. Daemon running with two plugins connected (as T13).
2. Open Claude Code session A. Call `join_channel("Dictation app")`.
3. Open Claude Code session B (in parallel). Call `get_connection_status` first → expect `AMBIGUOUS_FILE` on the first command attempt (B has no active channel set yet, even though A picked one). Call `join_channel("2025 design system")`.
4. **Expected:** session A's commands continue routing to "Dictation app". Session B's commands route to "2025 design system". No interference.
5. Close session A. Daemon removes A's entry from `activeChannelByClient`. Session B unaffected.

---

## 19. Edge cases and failure modes

| Case | Behaviour | Mitigation |
|---|---|---|
| **User runs install-daemon while old daemon is running** | Install script unloads first, then loads new. Net: daemon restarts, plugin reconnects. | Plugin reconnect is automatic. ~2s of downtime. |
| **User has nvm/mise/asdf and Node version changes after install** | Plist references the Node binary path captured at install time. If that node is gone (e.g. nvm uninstall), daemon fails to start. | Document in README: rerun `install-daemon` after Node version changes. Could enhance install script to write a wrapper shell script (`scripts/run-daemon.sh`) that does `which node` at runtime, but that's extra complexity. Prefer documentation for now. **See §23, Q1.** |
| **Plugin disconnects (Figma quit)** | Daemon's `pluginCount` drops. MCP `get_connection_status` returns `connected: false, pluginCount: 0`. Daemon stays up. | Expected behaviour. Plugin reconnect happens when user reopens Figma + plugin. |
| **Daemon crashes mid-command** | MCP client's `pendingRequests` get rejected with `"Relay disconnected"` (currently `relay-client.ts:75`, post-rename `daemon-client.ts`). Reconnect timer kicks in. After daemon restarts (10s), reconnect succeeds. | Already handled by the existing reconnect logic. The 30s request timeout means in-flight commands at crash time may hang for up to 30s before failing. **Acceptable.** |
| **Two daemons spawn simultaneously** | One wins port; the other gets `EADDRINUSE` and exits with code 2. launchd's `KeepAlive` would normally restart, but ThrottleInterval=10s gives it pause. Worst case: 10s of crash-loop until the loser stops trying. | In practice, this only happens if someone manually runs `node dist/daemon/index.js` while the launchd-managed daemon is alive. **Acceptable.** Could harden by changing exit code 2 handling — see §23, Q5. |
| **Stale figma-mcp processes from before install** | Old `node ... dist/server/index.js` still binding port 3055 → daemon can't start, exits 2 → launchd retries, also fails. | Install script should detect this and instruct user to kill stale processes. **TODO: add to install-daemon.sh.** |
| **Plugin connects to daemon, daemon restarts, plugin reconnects but stdio MCPs still think they're disconnected** | Stdio MCPs have their own reconnect timer (3s default, exponential backoff to 30s). After daemon comes back, MCPs reconnect within ~3-30s. | Already handled. Worst-case ~30s lag visible to user. |
| **Channel selection lost on daemon restart** | After daemon restart, MCP reconnects but its previous `join_channel` selection is gone (daemon has no persistence). Next `get_selection` would fail. | The Claude-Code-side disambiguation skill (§17) should detect "no active channel for this MCP" and re-disambiguate. **This is why §17 isn't optional.** Without it, daemon restart breaks multi-file flow. |
| **launchd refuses to load** (e.g., plist permissions wrong) | `launchctl load` returns nonzero. Install script bails with the launchd error message. | Install script's `set -euo pipefail` + the `launchctl list | grep` check should catch this. |
| **Disk full / log rotation** | `~/Library/Logs/figma-bridge-daemon.log` grows unboundedly. | Document log rotation as a known limitation. macOS doesn't auto-rotate user-LaunchAgent logs. Real fix would require `newsyslog` config or a separate cron job. **Out of scope.** |
| **Apple Silicon Rosetta mismatch** | If user's `node` is x64 but their Figma is arm64 (or vice versa), no problem — daemon and Figma talk over WebSocket, not in-process. | No mitigation needed. |

---

## 20. Acceptance criteria (revised in R3)

The refactor is "done" when ALL of these hold:

- **A1.** Three or more Claude Code sessions used in a row over a workday without killing any PIDs, reopening the Figma plugin, or copy-pasting channel codes.
- **A2.** Two or more Figma files connected to the bridge concurrently; the AI on the other end (Claude Code) correctly disambiguates via `AMBIGUOUS_FILE` errors and `join_channel`, all driven by tool descriptions and structured errors — no Claude-Code-specific skill required.
- **A3.** After Mac login (post-reboot), daemon starts automatically and Figma plugin connects without manual intervention.
- **A4.** Zero "port in use" or "another instance is open" errors during normal use over a one-week period.
- **A5.** All test plan items T1–T14 pass.
- **A6. (R3)** The same daemon, with the same tool descriptions, drives correct multi-file behaviour from at least one non-Claude MCP client (Codex / OpenAI ChatGPT, Cursor, or equivalent) — proving the tool-agnostic design (G7).

---

## 21. Rollback plan

If the daemon model causes issues that aren't quickly fixable:

1. `launchctl unload ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist`
2. `rm ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist`
3. `git -C /Users/ethan/Documents/projects/figma-mcp revert <refactor-commit-sha>` (or `git checkout main~N` to a pre-refactor state).
4. `npm run build`
5. Resume host-or-relay behavior.

**No data migration.** The daemon has no persistent state. Plugin connections are re-established by Figma reopening.

---

## 22. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Plist Node path goes stale after Node upgrade | Medium | Daemon won't start until reinstall | Document. Optionally: shell-wrapper script that resolves `node` at runtime. |
| `joinChannel` reimplementation introduces a regression in single-file mode | Low | Breaks all bridge use, not just multi-file | Test plan T3 covers single-file; explicit test T4 covers multi-file. |
| Daemon log files balloon | Low | Disk pressure over months/years | Documented limitation. Manual `rm` or `logrotate` config as needed. |
| User confused by new install step | Medium | One-time friction | README + a clear error message from `server/index.ts` when daemon isn't running (§11 covers this). |
| esbuild bundling of `ws` breaks at runtime due to dynamic require | Low | Daemon won't start | Test in dev before installing. The current server already bundles `ws` the same way and works. |
| launchd `KeepAlive` policy misfires (e.g., infinite restart loop) | Low | Macbook fan spins up, battery drains | `ThrottleInterval: 10` caps restart rate. Monitor `~/Library/Logs/figma-bridge-daemon.err.log` during early days. |
| Race: install script runs while old MCP is mid-command | Low | One command fails | Install script unloads daemon first; old MCPs see `relay disconnected` and reconnect. Fails any in-flight request. Acceptable for an explicit reinstall. |

---

## 23. Open questions for review

R3 status: most questions resolved. Q13 added. One remaining open question for the reviewer.

### Q1. (Resolved in R3) Node path in plist — hardcoded.

The install script captures the active Node binary path via `command -v node` and writes it into the plist. Recovery for Node moves: rerun `npm run install-daemon`. Documented in README. User is not on nvm/asdf/Volta so the wrapper-script alternative would buy little.

### Q2. (Resolved in R3 — locked to lean) Drop parent-PID heartbeat in server/index.ts.

stdin EOF and signal handlers cover the normal cases. The heartbeat was load-bearing when the host process owned port 3055; now the stdio MCP is a pure client, it's redundant.

### Q3. (Resolved in R2) New message types for `joinChannel`.

Resolved in R2: dedicated `client_join_channel` / `client_join_channel_response` message pair per §10.4.

### Q4. (Resolved in R3 — locked to lean) Rename `relay_*` → `client_*`.

Done. We're touching `types.ts` and `websocket-server.ts` for R2 already; the rename is ~5 minutes of additional churn. The protocol has no relays anymore, calling them relays will mislead future readers.

### Q5. (Resolved in R3 — locked to lean) Daemon EADDRINUSE behaviour: exit 2, launchd retries.

Self-healing for the common stale-process scenario. ThrottleInterval=10s bounds the cost if something is permanently bound. Errors show up loudly in `~/Library/Logs/figma-bridge-daemon.err.log` either way.

### Q6. (Resolved in R3 — locked to lean) Bundle `ws` and `uuid` into the daemon binary.

esbuild `--bundle` produces a single `dist/daemon/index.js` with no `node_modules` runtime dependency. ~50KB extra in the binary; simpler operationally.

### Q7. (Resolved in R3 — reshaped) Multi-file disambiguation lives in the daemon and MCP tool surface, NOT in a Claude-Code-specific skill.

User explicitly wants other MCP-capable tools (Codex / OpenAI ChatGPT, Cursor, etc.) to handle multi-file correctly without per-client setup. A skill in `.claude/` only serves Claude Code. By embedding disambiguation guidance into the MCP tool descriptions and surfacing structured `AMBIGUOUS_FILE` errors from the daemon, every MCP client benefits from day one. See rewritten §17.

### Q8. (Resolved in R3 — locked to lean) Install script in bash.

The script's job (call `launchctl`, write a plist, `lsof` to verify) is squarely in shell territory.

### Q9. (Resolved in R3) Narrow plugin to port 3055-only.

User has never used `FIGMA_MCP_PORT` overrides in practice. The fallback range was the source of H3. Drop it. If port conflict ever materialises, edit `WS_PORT` in `ui.ts` + `manifest.json` `allowedDomains` + daemon constant in lockstep.

### Q10. (Resolved in R3 — locked to lean) `client_status` is both a one-shot request (used for bootstrap and ground-truth pulls) AND a subscribe target (the daemon broadcasts `client_status_update` on changes).

Cache for the per-command gate, ground-truth pull for the user-facing `get_connection_status` query. Belt-and-braces against any push-loss bug, one round-trip per user query.

### Q11. (Resolved in R3 — locked to lean) Daemon tracks MCP clients in `mcpClients: Set<WebSocket>`.

Add on first non-plugin message (`client_status` or `client_command`); remove on close. Broadcast `client_status_update` only to this set, not to plugins.

### Q12. (Resolved in R3 — same as Q4, locked to lean) `relay_*` wire messages renamed.

See Q4.

### Q13. (R3, NEW) Per-client active channel — open for reviewer

**Background.** Today's daemon has a single shared `activeChannel: string | null` field ([websocket-server.ts:21](../../../figma-mcp/src/server/websocket-server.ts:21)). With multi-file UX working through MCP tool descriptions (§17), two simultaneous sessions (e.g. Claude Code and Codex) would interfere: client A calls `join_channel("Dictation app")` and client B's commands silently route to the same file.

**Proposed change.** Convert to a per-client map:

```ts
// Before:
private activeChannel: string | null = null;

// After:
private activeChannelByClient = new Map<WebSocket, string | null>();
```

`joinChannel` becomes scoped to a specific WebSocket. `sendCommand` looks up the active channel for the calling WebSocket. On client disconnect, the entry is removed.

Auto-pick on the first plugin still happens — but per-client: when a new client connects and there's exactly one plugin, its active channel defaults to that plugin. If there are multiple plugins, its active channel defaults to `null` (and the client gets `AMBIGUOUS_FILE` on the first command).

**Open for review:**
- Is this the right semantics? Specifically: should `auto-pick` on a single-plugin world ALSO happen for new clients that join after the plugin is already there, or only at plugin-join time?
- Are there any existing protocol assumptions that would break? (E.g. does any tool today rely on `activeChannel` being a global property?)
- Any concern about race conditions on `joinChannel` from two clients hitting the daemon at the same instant?

This is the only genuinely open question in R3. Everything else is locked.

---

## 24. Out of scope

- **Cross-host bridging.** Daemon stays on `localhost`.
- **Plugin code changes.** The plugin is unchanged.
- **MCP tool surface changes.** All exported tools (`get_selection`, `set_fill_color`, etc.) keep the same signatures.
- **Persistent storage of plugin state.** Daemon is in-memory only.
- **Log rotation.** Manual or via external tools if needed.
- **Multi-user / multi-machine support.**
- **Code signing the daemon binary.** Local-only, no signing needed.
- **Auto-update of the daemon when figma-mcp pulls new code.** Manual reinstall step documented in README.

---

## 25. Estimate breakdown (revised in R3)

R1 estimate: 3.5h. R2: 6h (after reviewer flagged the protocol-change scope). R3: 7–7.5h (multi-file UX folded in via §17's daemon-side approach instead of a separate skill).

| Step | Time |
|---|---|
| Confirm existing shapes by re-reading websocket-server.ts, types.ts, mcp-server.ts | 15 min |
| Write `src/daemon/index.ts` | 30 min |
| Update `types.ts`: new wire messages + async `FigmaBridge.joinChannel` + async `FigmaBridge.getConnectedFileInfo` + `AMBIGUOUS_FILE` error code (R2 + R3) | 20 min |
| Update `websocket-server.ts` (R2 + R3): broadcast `client_status_update`; add `client_join_channel` and `client_status` handlers; track `mcpClients` set; wrap `joinChannel`/`getConnectedFileInfo` async; **R3: convert `activeChannel` → `activeChannelByClient: Map<WebSocket, string|null>`; per-client auto-pick** | 90 min |
| Rename + simplify `relay-client.ts` → `daemon-client.ts`: delete promotion logic; replace polling with `client_status_update` push handler; ground-truth pull for `getConnectedFileInfo`; real wire-RPC `joinChannel` (R2) | 75 min |
| Update `mcp-server.ts` (R2 + R3): await `joinChannel`; await `getConnectedFileInfo`; **R3: tool descriptions include disambiguation hints; `exec()` returns structured `AMBIGUOUS_FILE` when ambiguous** | 25 min |
| Rename `relay_*` → `client_*` wire types (Q4) — touches types.ts + websocket-server.ts + daemon-client.ts in tandem | 15 min |
| Modify `src/server/index.ts` (delete host-or-relay fork; depend on daemon-client; drop parent-PID heartbeat per Q2) | 10 min |
| Plugin narrowing (R2): `ui.ts` constants + reconnect logic, `manifest.json` allowedDomains | 15 min |
| Rebuild plugin and verify it still loads in Figma after manifest change | 10 min |
| Write `scripts/install-daemon.sh` (bootstrap/bootout/kickstart, port-sweep preflight, hardcoded Node path per Q1) | 30 min |
| Write `scripts/uninstall-daemon.sh` | 5 min |
| `package.json` updates | 5 min |
| **Create** `README.md` (R2 — does not exist today) | 25 min |
| Run T1–T12 manually + new T13–T14 for multi-file (see §18) | 60 min |
| Buffer for edge-case fixes during testing | 45 min |
| **Total** | **~7.5 hours** |

The R3 increase over R2 (~1.5h) comes from:
- Per-client active channel refactor in `websocket-server.ts` (~30 min)
- Tool description revisions and `AMBIGUOUS_FILE` error wiring in `mcp-server.ts` (~15 min)
- Two new test cases for multi-file disambiguation (~15 min)
- Increased buffer for the broader surface area

**Recommendation:** budget a full day. The natural seam if breaking up: "land §8–§11 + §10b first (the daemon, protocol, port narrowing), live with it for a few days, then land the install scripts, README, and §17 multi-file work as a follow-up." But install needs to happen for the daemon to be usable at all, so the seam mostly just adds a context switch.

---

## Sign-off

When ready to implement, the path forward is:

1. Resolve all open questions in §23.
2. Apply changes in §8 in the order listed (creating the daemon first, then simplifying server/index.ts, then renaming relay-client).
3. Build, install, run T1–T9.
4. Use for a week.
5. If clean: delete `relay-client.ts` from git history is unnecessary — keeping it as `daemon-client.ts` is enough; old code is in git anyway.
6. If problems: §21 rollback.
