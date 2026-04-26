# Figma Bridge — Singleton Daemon Refactor

**Status:** DRAFT (Revision 5) — review pass-through complete; treat as implementation-ready pending final user sign-off.

**Target repo:** `/Users/ethan/Documents/projects/figma-mcp/` (the active bridge: stdio MCP + WebSocket on port 3055).

**Related entry:** [BACKLOG.md → "Figma Bridge — refactor to singleton daemon architecture"](../../BACKLOG.md)

---

## Revision history

### Revision 5 — final consistency pass

R4 reviewer pass confirmed no architectural blockers remain. Three categories of small consistency fixes applied:

| # | Issue | Fix |
|---|---|---|
| M1 | Edge-case table referenced "Claude-Code-side disambiguation skill"; A2 framed success around "the AI on the other end (Claude Code)" — both contradicted R4's tool-agnostic story. | Reworded to MCP-level disambiguation behaviour and "whichever MCP client is in use (Claude Code, Codex, Cursor, etc.)". |
| M2 | Three places still showed legacy `launchctl load`/`unload` (server/index.ts error message, dev:daemon note, edge-case row) — exact lines someone would copy-paste when debugging. | All converted to `launchctl bootstrap` / `bootout` / `kickstart` per §12. Revision-history references to the legacy commands kept (they're historical context). |
| L1 | Header still said "Revision 2"; TL;DR estimate said "(R3) ~7.5h" while §25 said R4 8.5h; TOC called §17 a "separate workstream"; out-of-scope said "plugin is unchanged" while §10b explicitly narrows the plugin port. | Header → R5; TL;DR → R4 8.5h; TOC reflects §17's actual title; out-of-scope reframed to "plugin main-thread command logic" with explicit acknowledgement of the port-narrowing scope change. |

No design changes. Plan is now treated as implementation-ready pending final user sign-off.

### Revision 4 — addressing R3 reviewer feedback

Reviewer's R3 pass agreed the architecture is sound but flagged five consistency/specification issues. All addressed below.

| # | Issue | Where addressed |
|---|---|---|
| H | Per-client active channel was named in R3 but the API surface still treats status as caller-agnostic. `getConnectedFileInfo()` and `client_status_update` would still produce wrong answers for sessions B, C, … unless tailored per-caller. | Rewrote §10.3, §10.6, §10.7. New §10.8 on the routing-state cache. The `client_status` and `client_join_channel` daemon-side handlers explicitly derive state from the sending WebSocket. The shared `FigmaBridge` interface is split: global plugin facts (pluginCount, plugins[]) vs per-client routing state (activeChannel, derived `connected`). The push payload is tailored per recipient. |
| MH | Stale "no plugin code changes" / "identical protocol" claims now conflict with R2/R3's port narrowing, wire-message renames, and new wire types. | Rewrote NG3 in §4, §6 architecture description, §10 framing. New honest framing: plugin's main-thread command API unchanged; plugin connection config narrowed (manifest, WS_PORT); plugin ↔ daemon WebSocket protocol unchanged; MCP-client ↔ daemon protocol IS changing. |
| M | §10b describes a port-sweep preflight, T12 tests it, §19 lists it as a TODO — but the §12 install-daemon.sh sketch doesn't actually include it. | Merged the preflight into §12. Removed the TODO from §19. |
| M | AMBIGUOUS_FILE hot-path preflight in `mcp-server.ts` was hand-waved — the only documented accessor was `isPluginConnected(): boolean`, which can't distinguish "not connected" from "ambiguous." | New §10.8 on `getRoutingState()`: a richer cached accessor that exposes `pluginCount`, `activeChannel`, and `plugins[]`. `mcp-server.ts` uses it to choose between `NOT_CONNECTED`, `AMBIGUOUS_FILE`, and proceeding to `sendCommand`. `sendCommand` retains a defensive check as a backstop. |
| L | Rollback (§21) still says `launchctl unload`; sign-off (§ at end) still says "T1–T9". Stale relative to R2 modernisation. | Updated to `bootout`. Updated to T1–T14. |

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

**Estimate (R4):** ~8.5 hours of focused work, including the install scripts, README, multi-file UX, and full T1–T14 test pass.

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
17. [Multi-file UX — in the daemon, not a skill (revised in R3)](#17-multi-file-ux--in-the-daemon-not-a-skill-revised-in-r3)
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
- **NG3.** *(Revised in R4)* Plugin **main-thread command API** changes. The set of commands the plugin handles (`get_selection`, `set_fill_color`, `rename_node`, etc.) and their semantics remain unchanged. **What does change is narrower:** the plugin's connection config (`WS_PORTS` constant in `ui.ts`, `allowedDomains` in `manifest.json`) is narrowed from 3055–3060 to 3055-only per §10b. The plugin ↔ daemon WebSocket message types (`join`, `message`, `response`) are unchanged. **The MCP-client ↔ daemon protocol IS changing** (new wire types `client_status`, `client_status_update`, `client_join_channel*`, plus `relay_*` → `client_*` rename). R3-and-prior phrasing of "identical protocol" was wrong; this NG line clarifies the actual scope.
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

Two protocols on the same socket (revised in R4 to reflect actual scope):

- **Plugin ↔ daemon**: WebSocket message types (`join`, `message`, `response`) are unchanged. Plugin's main-thread command API is unchanged. Plugin's connection config narrows to port 3055 only (see §10b).
- **MCP client ↔ daemon**: **changes meaningfully from the relay protocol.**
  - Wire types renamed from `relay_*` → `client_*` (Q4).
  - New types added: `client_status` (request/response), `client_status_update` (push), `client_join_channel` (request/response).
  - Status responses and pushes are now **per-caller** (derived from the sending WebSocket — see §10.7), not a single global snapshot.
  - The `FigmaBridge.joinChannel` and `FigmaBridge.getConnectedFileInfo` interface methods become async.
  - Per-client active channel: the daemon's `activeChannel: string | null` becomes `activeChannelByClient: Map<WebSocket, string | null>`.

**Key insight (revised):** the daemon role and host role have *similar* shapes (both own the WebSocket server, both broker plugin connections), but they are not interchangeable. The host model assumed one MCP process and shared state across whoever else relayed in. The daemon model has N independent MCP clients with independent routing state, plus a true singleton owner of the port. The protocol changes flow from that distinction.

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
| `src/server/websocket-server.ts` | **MODIFY (R2 + R3 + R4)** — R2: broadcast `client_status_update` (now tailored per recipient per R4); add `client_join_channel` / `client_status` request handlers (R4: derive response from sending WS, see §10.7); rename `relay_*` → `client_*` per Q4. R3: convert `activeChannel` to per-client map; track `mcpClients: Set<WebSocket>`. R4: per-client auto-pick rule; plugin-disconnect cleanup of stale `activeChannelByClient` entries. | 110 min |
| `src/server/mcp-server.ts` | **MODIFY (R2 + R3 + R4)** — R2: `joinChannel` and `getConnectedFileInfo` become async, await both. R3: tool descriptions get embedded disambiguation guidance per §17. R4: the exec helper reads `wsServer.getRoutingState()` (per §10.8) and chooses between `NOT_CONNECTED`, `AMBIGUOUS_FILE`, and proceeding. | 30 min |
| `src/server/types.ts` | **MODIFY (R2 + R4)** — R2: add new wire message types (`client_status_update`, `client_join_channel`, `client_join_channel_response`, `client_status`); update `FigmaBridge.joinChannel` and `getConnectedFileInfo` signatures to async. R4: add `ClientStatusSnapshot` shape; restructure `FigmaBridge` to expose `getRoutingState(): ClientStatusSnapshot`; add `data?: any` on the error response shape so AMBIGUOUS_FILE can carry plugins[]. | 25 min |
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

### 10.3 Changes — push-based status, per-caller (R2 + R4)

**This is the key behavioural change vs R1, refined in R4 to address per-caller correctness.**

The cache field stays (renamed `routingState` in R4 — see §10.8) but is no longer populated by `refreshStatus`. Instead:

- On `connect`, the client sends ONE `client_status` request and awaits the response, populating `routingState` with the daemon's snapshot **for this caller** (the daemon derives the response from the requesting WebSocket — global facts plus this caller's `activeChannel`). Bootstrap.
- The client adds a handler for the new `client_status_update` wire message. Whenever the daemon sends one, the client replaces `routingState` with the pushed payload. **Pushes are tailored per recipient** (each MCP client receives its own activeChannel reflected in the payload — see §10.7).
- `isPluginConnected` reads the cache (used by the per-command gate in `mcp-server.ts`).
- **`getConnectedFileInfo` does NOT read the cache.** It always sends a `client_status` request and awaits the response. This is the user-facing `get_connection_status` query — must be ground truth (contract C3 in §2.5).

**Why split the two reads:** the per-command gate runs hot (every tool call), so the cache is the right shape there — provided the cache stays fresh, which it does via per-caller push. The `get_connection_status` query is run by the user/AI when they want to verify; it's not hot, and it has the strongest user expectation of correctness.

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

### 10.6 Suggested final shape (sketch, revised in R4)

```ts
// src/server/daemon-client.ts
export class FigmaBridgeDaemonClient implements FigmaBridge {
  // ws, pendingRequests, reconnect/heartbeat fields kept from relay-client.
  // NO promoted, promotedServer fields.
  // routingState (renamed from cachedStatus) kept but populated only by push.
  private routingState: ClientStatusSnapshot = {
    pluginCount: 0,
    plugins: [],
    activeChannel: null,
    connected: false,
  };

  connect(): Promise<void> {
    // 1. Open ws to daemon.
    // 2. On open: send one client_status request, await response,
    //    set routingState from it (per-caller bootstrap).
    // 3. Subscribe to client_status_update in handleMessage.
  }

  // Hot-path: rich routing state for mcp-server's AMBIGUOUS_FILE / NOT_CONNECTED
  // preflight without a round-trip.
  getRoutingState(): ClientStatusSnapshot {
    return this.routingState;
  }

  // Convenience over getRoutingState().connected — interface compatibility.
  isPluginConnected(): boolean {
    return this.routingState.connected;
  }

  // Ground-truth pull (user-facing query — must reflect "right now").
  async getConnectedFileInfo(): Promise<ClientStatusSnapshot> {
    return this.requestClientStatus();   // wire RPC client_status / client_status_response
  }

  async joinChannel(channelId: string): Promise<boolean> {
    // wire RPC via client_join_channel / client_join_channel_response.
    // After resolution, routingState is updated by the self-targeted push
    // the daemon emits (§10.7).
  }

  async sendCommand(command, channel?): Promise<any> {
    // Unchanged from relay-client minus the "if promoted" branch.
    // Uses client_command / client_response wire messages.
  }

  private handleMessage(msg) {
    switch (msg.type) {
      case "client_response":              /* existing relay_response logic */ break;
      case "client_status_response":       /* resolve pending status request */ break;
      case "client_join_channel_response": /* resolve pending join request */ break;
      case "client_status_update":         /* PUSH — replace routingState */
        this.routingState = msg.data;
        break;
    }
  }

  stop(): void { /* unchanged from relay-client minus the promoted branch */ }
}
```

### 10.7 Per-caller status — daemon-side (R4)

The reviewer's H finding: with `activeChannel` per-client, the daemon can no longer produce a single shared `getConnectedFileInfo` answer. Each caller's view of "is a plugin connected" depends on **that caller's** `activeChannel`, plus global plugin presence.

#### Daemon-side message handlers (server)

The `client_status` and `client_join_channel` wire handlers in `websocket-server.ts` derive their response from the sending WebSocket. They do NOT go through a shared `FigmaBridge.getConnectedFileInfo` abstraction.

```ts
// src/server/websocket-server.ts — handleMessage (sketch, R4)
case "client_status": {
  const response = this.buildStatusFor(ws);   // ws is the requesting client
  ws.send(JSON.stringify({
    type: "client_status_response",
    channel: "",
    id: msg.id,
    data: response,
  }));
  break;
}

case "client_join_channel": {
  const channelId = msg.data?.channelId;
  const ok = this.channelToClient.has(channelId);
  if (ok) {
    this.activeChannelByClient.set(ws, channelId);
  }
  ws.send(JSON.stringify({
    type: "client_join_channel_response",
    channel: "",
    id: msg.id,
    data: { success: ok, channelId: ok ? channelId : null },
  }));
  if (ok) this.pushStatusUpdateTo(ws);   // self-targeted refresh
  break;
}
```

#### `buildStatusFor(ws)` (server-side derivation)

Computes a tailored snapshot for one specific MCP client:

```ts
private buildStatusFor(ws: WebSocket): ClientStatusSnapshot {
  const activeChannel = this.activeChannelByClient.get(ws) ?? null;
  const plugins = Array.from(this.clients.values()).map(p => ({
    channel: p.channel,
    fileName: p.fileName,
    pageName: p.pageName,
  }));
  return {
    pluginCount: plugins.length,                    // global
    plugins,                                        // global
    activeChannel,                                  // per-caller
    connected:
      activeChannel !== null &&
      this.channelToClient.has(activeChannel),     // derived per-caller
  };
}
```

#### `pushStatusUpdateTo(ws)` and broadcast semantics

When global plugin state changes (a plugin joined or left), the daemon iterates `mcpClients` and calls `pushStatusUpdateTo(client)` for each one — which builds a tailored snapshot for that client. The active-channel field in each push reflects the recipient's per-client active channel, not a shared one.

When ONE client calls `client_join_channel`, the daemon pushes only to that one client (its activeChannel changed; nobody else's did).

Special case: when a plugin disconnects, the daemon must also clear `activeChannelByClient` entries that point at the gone channel before broadcasting. Otherwise clients would receive a snapshot showing `connected: false` while still having their dead `activeChannel` set, which is internally inconsistent.

#### `FigmaBridge` interface (revised in R4)

The shared interface gets clarified — it is consumed only by `mcp-server.ts` against a daemon-client. The `FigmaBridgeWebSocketServer` no longer needs to implement it (its public surface is the wire-message handlers, not the interface).

```ts
// src/server/types.ts (R4)
export interface ClientStatusSnapshot {
  pluginCount: number;
  plugins: Array<{ channel: string; fileName: string; pageName: string }>;
  activeChannel: string | null;
  connected: boolean;
}

// FigmaBridge becomes the daemon-client's contract specifically.
export interface FigmaBridge {
  sendCommand(command: CommandMessage): Promise<any>;
  // Hot-path read of cached routing state. Returns the most recent
  // pushed snapshot. Used by mcp-server.ts:exec for AMBIGUOUS_FILE
  // and NOT_CONNECTED preflights without a round-trip.
  getRoutingState(): ClientStatusSnapshot;
  // User-facing query — round-trips to daemon for ground truth.
  getConnectedFileInfo(): Promise<ClientStatusSnapshot>;
  joinChannel(channelId: string): Promise<boolean>;
  stop(): void;
  // Convenience wrapper around getRoutingState().connected for callers
  // that don't need the full shape.
  isPluginConnected(): boolean;
}
```

This split is what the reviewer's H finding was asking for: status reads that go through `FigmaBridge` are honest about being per-caller (the `getRoutingState` and `getConnectedFileInfo` accessors are properties of one daemon-client instance, which IS a single caller). Server-side derivation lives in `websocket-server.ts` outside the interface.

### 10.8 Routing-state cache for AMBIGUOUS_FILE preflight (R4)

The reviewer's M-AMBIGUOUS finding: `mcp-server.ts:exec` needs to distinguish three states without round-tripping every command:

| State | What `exec` should do | Today's API can express? |
|---|---|---|
| No plugin connected | Return `NOT_CONNECTED` | Yes via `isPluginConnected() === false` |
| Multiple plugins, this client hasn't picked one | Return `AMBIGUOUS_FILE` with plugin list | **No** — `isPluginConnected()` returns false (because activeChannel is null), indistinguishable from "no plugin" |
| One plugin auto-picked OR client picked | Proceed to `sendCommand` | Yes |

The fix: extend the cache to a richer shape and expose it via `getRoutingState()`. `mcp-server.ts:exec` becomes:

```ts
async function exec(command: string, args: Record<string, any> = {}) {
  const state = wsServer.getRoutingState();

  if (state.pluginCount === 0) {
    return formatResult(notConnectedError());
  }

  if (state.activeChannel === null && state.pluginCount > 1) {
    return formatResult(ambiguousFileError(state.plugins));
  }

  if (state.activeChannel === null) {
    // pluginCount === 1 but daemon hasn't auto-picked yet
    // (rare race window; tell user to retry)
    return formatResult(notConnectedError());
  }

  try {
    const result = await wsServer.sendCommand({ command, args });
    return formatResult({ ok: true, data: result });
  } catch (err: any) {
    return formatResult({ ok: false, error: { code: "COMMAND_FAILED", message: err.message } });
  }
}

function ambiguousFileError(plugins: ClientStatusSnapshot["plugins"]): ToolResponse {
  return {
    ok: false,
    error: {
      code: "AMBIGUOUS_FILE",
      message: "Multiple Figma files are connected. Pick one with join_channel.",
      data: { plugins },
    },
  };
}
```

#### Why preflight at the gate AND in `sendCommand`?

Defence in depth.

- **Gate (cache-driven):** fast, correct under normal conditions, gives clear errors. Catches the common case.
- **`sendCommand` server-side check:** if the cache somehow lags (push-loss bug, race during plugin-disconnect), the daemon's `sendCommand` handler still validates the caller's active channel exists in `channelToClient`. If not, it returns a server-generated error that the daemon-client surfaces as `COMMAND_FAILED` with a clear message.

#### What this changes about types.ts

```ts
// types.ts (R4)
export interface ToolResponse {
  ok: boolean;
  data?: any;
  error?: {
    code:
      | "NOT_CONNECTED"
      | "AMBIGUOUS_FILE"     // R3 announced, R4 specifies
      | "COMMAND_FAILED"
      | "EXPORT_FAILED"
      | "INVALID_INPUT"
      | "CHANNEL_NOT_FOUND";
    message: string;
    data?: any;              // AMBIGUOUS_FILE includes plugins[]
  };
}
```

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
    console.error("[figma-mcp] Start (or restart) the daemon with:");
    console.error(`[figma-mcp]   launchctl kickstart "gui/$(id -u)/com.ethan.figma-bridge-daemon"`);
    console.error("[figma-mcp] If the daemon was never installed, run scripts/install-daemon.sh from");
    console.error("[figma-mcp]   /Users/ethan/Documents/projects/figma-mcp/");
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

# 2. Port-sweep preflight (R4 — closes the gap §10b/T12 expected)
#    Refuse to install if anything is already listening on any port in the
#    legacy range. Stale `node dist/server/index.js` from before install is
#    the typical offender. Catches it loudly instead of letting the daemon
#    fight a phantom.
for port in 3055 3056 3057 3058 3059 3060; do
  if lsof -i :"$port" -P -sTCP:LISTEN > /dev/null 2>&1; then
    echo "ERROR: port $port is already in use." >&2
    echo "       Identify the offender and stop it before retrying:" >&2
    echo "         lsof -i :$port -P" >&2
    echo "       Then run: kill <pid>  (or kill -9 <pid> if it ignores SIGTERM)" >&2
    exit 1
  fi
done

# 3. Build the daemon
echo "Building daemon..."
cd "$REPO_ROOT"
npm run build:daemon

if [[ ! -f "$DAEMON_JS" ]]; then
  echo "ERROR: $DAEMON_JS not found after build." >&2
  exit 1
fi

# 4. Make sure log dir exists
mkdir -p "$LOG_DIR"

# 5. Write the plist
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

# 6. Bootout any old version (idempotent — fine if not loaded)
#    R2: switched from legacy `load`/`unload` to modern `bootstrap`/`bootout`/`kickstart`.
#    The legacy commands still work but Apple has been deprecating them since macOS 10.11.
#    The modern API requires a service target (gui/<uid>/<label>).
USER_TARGET="gui/$(id -u)"
LABEL="com.ethan.figma-bridge-daemon"

launchctl bootout "$USER_TARGET/$LABEL" 2>/dev/null || true

# 7. Bootstrap new version
echo "Bootstrapping via launchctl..."
launchctl bootstrap "$USER_TARGET" "$PLIST_PATH"

# 8. Kickstart so it runs immediately (don't wait for next login)
launchctl kickstart "$USER_TARGET/$LABEL"

# 9. Verify
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

`dev:daemon` is optional but useful: rebuilds on file change. To pick up the rebuilt binary in the running daemon, use `launchctl kickstart -k "gui/$(id -u)/com.ethan.figma-bridge-daemon"` (the `-k` flag kills the running instance first, then starts a fresh one). Alternative for an iterative dev loop: stop the launchd-managed daemon (`launchctl bootout "gui/$(id -u)/com.ethan.figma-bridge-daemon"`) and run the daemon manually with `node dist/daemon/index.js` so you see logs in the terminal.

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

### Per-client active channel (Q13 — see §23, §10.7, §10.8)

Today's daemon has a single `activeChannel: string | null` field shared across all connected clients ([websocket-server.ts:21](../../../figma-mcp/src/server/websocket-server.ts:21)). For multi-file UX to actually work — and for two simultaneous MCP clients (Claude Code + Codex, or two Claude Code sessions) to not interfere with each other — this becomes **per-client**:

```ts
// Before:
private activeChannel: string | null = null;

// After:
private activeChannelByClient = new Map<WebSocket, string | null>();
private mcpClients = new Set<WebSocket>();   // for tailored broadcast (§10.7)
```

The full surface area of this change is documented in §10.7 (server-side derivation, tailored pushes) and §10.8 (client-side routing-state cache, AMBIGUOUS_FILE preflight). Both of those are essential to actually fulfilling the R3-described UX — without them, the "per-client" framing is just a rename without the contract changes that make it correct.

Auto-pick on the first plugin still happens but is per-client. Detailed rule and the reviewer's open question on this are in §23 Q13.

### Behaviour to encode (revised)

1. Single Figma file open → daemon auto-picks; `get_connection_status` returns `pluginCount: 1` with `activeChannel` set; commands just work. **No copy-paste, no channel codes.** ✓
2. Zero Figma files open → daemon returns `pluginCount: 0`; `exec()` returns `NOT_CONNECTED`; user is prompted to open the plugin.
3. Two+ Figma files open and the client hasn't called `join_channel` yet → first command attempt returns `AMBIGUOUS_FILE` with the plugin list; the model on the other end asks the user; calls `join_channel`; retries.
4. Mid-session switch ("now use the design system file") → user asks the model; model calls `join_channel(other.channel)`; commands route to the new file.

### What this changes in the file-by-file plan

- `mcp-server.ts`: tool descriptions get the disambiguation hints embedded. The exec helper reads `wsServer.getRoutingState()` (per §10.8) and chooses between `NOT_CONNECTED`, `AMBIGUOUS_FILE`, and proceeding. ~15 min on top of the R2 changes.
- `websocket-server.ts`: see §10.7 for the full surface — `activeChannelByClient` map, `mcpClients` set, `client_status` and `client_join_channel` handlers, tailored push fan-out, plugin-disconnect cleanup of stale active channels. ~45 min on top of the R2 changes (R4 raised the estimate from R3's ~30 min once the per-caller correctness work was honestly accounted for).
- `types.ts`: new `ClientStatusSnapshot` shape; new error code `"AMBIGUOUS_FILE"` with `data.plugins[]` payload. (See §10.8 type definitions.) ~5 min.

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
| **Stale figma-mcp processes from before install** | Old `node ... dist/server/index.js` still binding port 3055 → daemon can't start. | The install script's port-sweep preflight (R4 — see §12 step 2) catches this at install time and refuses to proceed, instructing the user to kill the offender. After install, if a stale process binds AFTER install, the daemon's exit-2 + launchd retry policy is the safety net (see §22). |
| **Plugin connects to daemon, daemon restarts, plugin reconnects but stdio MCPs still think they're disconnected** | Stdio MCPs have their own reconnect timer (3s default, exponential backoff to 30s). After daemon comes back, MCPs reconnect within ~3-30s. | Already handled. Worst-case ~30s lag visible to user. |
| **Channel selection lost on daemon restart** | After daemon restart, MCP reconnects but its previous `join_channel` selection is gone (daemon has no persistence). Next `get_selection` would fail. | The MCP-level disambiguation behaviour (§17) handles this: when there are multiple plugins and no per-client active channel, the daemon returns `AMBIGUOUS_FILE` and the AI on the other end re-disambiguates with the user. The behaviour is encoded in tool descriptions and structured errors, so any MCP client (Claude Code, Codex, Cursor, etc.) handles it the same way — no client-specific skill required. **This is why §17 isn't optional.** Without it, daemon restart breaks multi-file flow. |
| **launchd refuses to bootstrap** (e.g., plist permissions wrong, malformed XML) | `launchctl bootstrap` returns nonzero. Install script bails with the launchd error message. | Install script's `set -euo pipefail` + the `launchctl print` verification step (§12 step 9) catches this. |
| **Disk full / log rotation** | `~/Library/Logs/figma-bridge-daemon.log` grows unboundedly. | Document log rotation as a known limitation. macOS doesn't auto-rotate user-LaunchAgent logs. Real fix would require `newsyslog` config or a separate cron job. **Out of scope.** |
| **Apple Silicon Rosetta mismatch** | If user's `node` is x64 but their Figma is arm64 (or vice versa), no problem — daemon and Figma talk over WebSocket, not in-process. | No mitigation needed. |

---

## 20. Acceptance criteria (revised in R3)

The refactor is "done" when ALL of these hold:

- **A1.** Three or more Claude Code sessions used in a row over a workday without killing any PIDs, reopening the Figma plugin, or copy-pasting channel codes.
- **A2.** Two or more Figma files connected to the bridge concurrently; whichever MCP client is in use (Claude Code, Codex, Cursor, etc.) correctly disambiguates via `AMBIGUOUS_FILE` errors and `join_channel`, driven entirely by tool descriptions and structured errors — no per-client configuration required.
- **A3.** After Mac login (post-reboot), daemon starts automatically and Figma plugin connects without manual intervention.
- **A4.** Zero "port in use" or "another instance is open" errors during normal use over a one-week period.
- **A5.** All test plan items T1–T14 pass.
- **A6. (R3)** The same daemon, with the same tool descriptions, drives correct multi-file behaviour from at least one non-Claude MCP client (Codex / OpenAI ChatGPT, Cursor, or equivalent) — proving the tool-agnostic design (G7).

---

## 21. Rollback plan

If the daemon model causes issues that aren't quickly fixable:

1. `launchctl bootout "gui/$(id -u)/com.ethan.figma-bridge-daemon"` *(R4 — modern command, replaces R1's `launchctl unload`)*
2. `rm ~/Library/LaunchAgents/com.ethan.figma-bridge-daemon.plist`
3. `git -C /Users/ethan/Documents/projects/figma-mcp revert <refactor-commit-sha>` (or `git checkout main~N` to a pre-refactor state). Don't forget the plugin port narrowing also reverts here, restoring the 3055–3060 fallback.
4. `npm run build`
5. Resume host-or-relay behavior. Plugin needs to be reopened in Figma so it reconnects to the now-host-or-relay stdio process.

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

### Q13. (R3 → R4) Per-client active channel — API surface, awaiting reviewer

R3 introduced this and the reviewer accepted the *direction* but flagged that the R3 API surface didn't actually express it. R4 redesigns the surface; this question is now: **does the R4 API surface get it right?**

#### What R4 commits to

1. Server-side: `activeChannel: string | null` becomes `activeChannelByClient: Map<WebSocket, string | null>`.
2. Server-side: dedicated wire-message handlers for `client_status` and `client_join_channel` that derive their response from the sending WebSocket. **No shared `getConnectedFileInfo` abstraction is preserved** for plugin-host vs client-facing views — they're different shapes.
3. Server-side: `client_status_update` pushes are **tailored per recipient** — each MCP client receives a snapshot reflecting its own active channel, not a shared one.
4. Client-side: `routingState` (renamed from `cachedStatus`) holds the latest pushed snapshot, populated only by push.
5. Client-side: new `getRoutingState(): ClientStatusSnapshot` method on `FigmaBridge` for `mcp-server.ts` to do AMBIGUOUS_FILE preflight without round-tripping. `isPluginConnected()` retained as a convenience over `routingState.connected`.
6. Auto-pick: when a plugin joins, the daemon scans `mcpClients` and for any client whose `activeChannel` is null and whose previous `pluginCount` was 0, sets activeChannel to the new plugin's channel and pushes an update. (i.e. auto-pick is per-client, fires on the moment-of-transition from "no plugin" to "exactly one plugin," whether that transition is caused by the client connecting or by a plugin joining.) **Reviewer should validate this auto-pick rule specifically.**
7. When a plugin disconnects, the daemon clears `activeChannelByClient` entries pointing at it before broadcasting status — see §10.7's "internally inconsistent" note.

Concrete file refs: §10.7, §10.8 for the contract; §17 for the multi-file behaviour it powers; §6 for the protocol-level summary.

#### Reviewer should still push back on:

- The auto-pick semantics (point 6) — alternatives include "never auto-pick; always require explicit `join_channel`" or "auto-pick only at the plugin-join moment, never on retroactive client-connect". Any of the three is defensible; R4 leans toward "fire on either transition" because it preserves the lovely property that single-file users never deal with channels at all.
- Race conditions: two clients hitting `client_join_channel` simultaneously. The daemon-side handler is single-threaded (Node event loop), so the race is bounded — but the *response order* depends on event-loop ordering. Concrete concern: if client A joins channel X then client B joins channel Y in rapid succession, both succeed; their pushes don't interfere because they're tailored. Should be safe but worth a sanity check.
- Whether the `FigmaBridge` interface should be split rather than just clarified. R4 keeps it as a single interface implemented only by the daemon-client; the WS server no longer implements `FigmaBridge` (it has wire-message handlers instead). Reviewer might prefer a hard split: `IDaemonClient` consumed by `mcp-server.ts`, no shared interface at all.

This is the only genuinely open question in R4. Everything else is locked.

---

## 24. Out of scope

- **Cross-host bridging.** Daemon stays on `localhost`.
- **Plugin main-thread command logic.** The set of commands the plugin handles and their semantics are unchanged. *(Note: the plugin's connection config does change — port narrowing in `ui.ts` and `manifest.json` per §10b. That's in scope; the main-thread command implementations are not.)*
- **MCP tool signatures.** All exported tools (`get_selection`, `set_fill_color`, etc.) keep the same arguments and return shapes. *(Tool descriptions get richer per §17, but that's metadata, not signature.)*
- **Persistent storage of plugin state.** Daemon is in-memory only.
- **Log rotation.** Manual or via external tools if needed.
- **Multi-user / multi-machine support.**
- **Code signing the daemon binary.** Local-only, no signing needed.
- **Auto-update of the daemon when figma-mcp pulls new code.** Manual reinstall step documented in README.

---

## 25. Estimate breakdown (revised in R4)

R1: 3.5h. R2: 6h (protocol-change scope honest). R3: 7–7.5h (multi-file folded in). R4: **8–8.5h** (per-caller API surface is more work than R3 hand-waved).

| Step | Time |
|---|---|
| Confirm existing shapes by re-reading websocket-server.ts, types.ts, mcp-server.ts | 15 min |
| Write `src/daemon/index.ts` | 30 min |
| Update `types.ts`: new wire messages, `ClientStatusSnapshot` shape, async `FigmaBridge.joinChannel` and `getConnectedFileInfo`, `getRoutingState` accessor, `AMBIGUOUS_FILE` error code with `data.plugins[]` payload (R2 + R3 + R4) | 25 min |
| Update `websocket-server.ts`: broadcast `client_status_update` (tailored per recipient); add `client_join_channel` and `client_status` handlers (each derives state from sending WS); convert `activeChannel` → `activeChannelByClient`; track `mcpClients` set; per-client auto-pick semantics; plugin-disconnect cleanup of stale active channels; rename `relay_*` → `client_*` (R2 + R3 + R4) | 110 min |
| Rename + simplify `relay-client.ts` → `daemon-client.ts`: delete promotion logic; replace polling with `client_status_update` push handler; rename `cachedStatus` → `routingState`; expose `getRoutingState()`; ground-truth pull for `getConnectedFileInfo`; real wire-RPC `joinChannel` (R2 + R4) | 75 min |
| Update `mcp-server.ts`: await `joinChannel` + `getConnectedFileInfo`; the exec helper reads `getRoutingState()` and produces `NOT_CONNECTED` / `AMBIGUOUS_FILE` / proceed; tool descriptions include disambiguation hints (R2 + R3 + R4) | 30 min |
| Modify `src/server/index.ts` (delete host-or-relay fork; depend on daemon-client; drop parent-PID heartbeat per Q2) | 10 min |
| Plugin narrowing (R2): `ui.ts` constants + reconnect logic, `manifest.json` allowedDomains | 15 min |
| Rebuild plugin and verify it still loads in Figma after manifest change | 10 min |
| Write `scripts/install-daemon.sh`: bootstrap/bootout/kickstart, **port-sweep preflight (R4 — actually included in §12 now, not just gestured at)**, hardcoded Node path per Q1 | 35 min |
| Write `scripts/uninstall-daemon.sh` | 5 min |
| `package.json` updates | 5 min |
| **Create** `README.md` (R2 — does not exist today) | 25 min |
| Run T1–T12 manually + T13–T14 for multi-file (see §18) | 60 min |
| Buffer for edge-case fixes during testing | 60 min |
| **Total** | **~8.5 hours** |

The R4 increase over R3 (~1h) comes from:
- The per-caller status work in `websocket-server.ts` is meaningfully more than R3 admitted: `buildStatusFor(ws)` derivation, tailored broadcasts, plugin-disconnect cleanup of stale `activeChannelByClient` entries (~25 min)
- `getRoutingState()` + the richer cached-state shape on the daemon-client (~10 min)
- Updated AMBIGUOUS_FILE preflight in `mcp-server.ts` is more than just a tool description tweak (~10 min)
- Larger testing buffer (these are the kinds of changes where one boundary case finds another)

**Recommendation:** budget a full day. The natural seam if breaking up: "land §8–§11 + §10b first (daemon, protocol, port narrowing), live with it for a few days, then land §17 multi-file behaviour, install scripts, README." Install needs to happen for the daemon to be usable, but multi-file is a coherent second commit.

---

## Sign-off

When ready to implement, the path forward is:

1. Resolve any remaining open questions in §23. *(R4 status: Q1, Q2, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12 resolved. Q3 resolved in R2. Q13 awaiting reviewer sign-off on R4's per-caller API redesign.)*
2. Apply changes in §8 in this order:
   1. Update `types.ts` (new wire types, ClientStatusSnapshot, async interface, error codes).
   2. Modify `websocket-server.ts` (per-client active channel map; new `client_status` / `client_join_channel` handlers; tailored push fan-out; rename `relay_*` → `client_*`).
   3. Rename `relay-client.ts` → `daemon-client.ts`; refit to push-based routing state and the new interface.
   4. Update `mcp-server.ts` (await async methods; embed disambiguation hints; route through `getRoutingState` for AMBIGUOUS_FILE preflight).
   5. Create `src/daemon/index.ts`.
   6. Simplify `src/server/index.ts` (depend on daemon-client; drop parent-PID heartbeat).
   7. Narrow plugin: `ui.ts` and `manifest.json`.
   8. Write install/uninstall scripts (with port-sweep preflight per §12).
   9. Update `package.json`.
   10. Create `README.md`.
3. Build, install, run T1–T14.
4. Use for a week. Validate A1–A6.
5. If clean: ship. The renamed `daemon-client.ts` is the canonical name going forward; old `relay-client.ts` lives in git history.
6. If problems: §21 rollback.
