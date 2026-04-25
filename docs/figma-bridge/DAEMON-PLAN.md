# Figma Bridge — Singleton Daemon Refactor

**Status:** DRAFT (Revision 2) — review-only. Do NOT implement until plan is signed off.

**Target repo:** `/Users/ethan/Documents/projects/figma-mcp/` (the active bridge: stdio MCP + WebSocket on port 3055).

**Related entry:** [BACKLOG.md → "Figma Bridge — refactor to singleton daemon architecture"](../../BACKLOG.md)

---

## Revision history

### Revision 2 — addressing review feedback

Reviewer flagged four substantive issues with R1. All confirmed against code; all addressed below.

| # | Issue | Where addressed |
|---|---|---|
| H1 | R1 kept relay-style "cache only on connect/reconnect" status, which preserves the exact stale `connected: false` failure mode the refactor is supposed to eliminate. ([mcp-server.ts:33](../../../figma-mcp/src/server/mcp-server.ts:33), [relay-client.ts:99,146](../../../figma-mcp/src/server/relay-client.ts:99)) | New §2.5 *Status freshness — design contract*. Updated §7 (added invariant I6). Rewrote §10 to require push-driven status. Updated §8 to flag `websocket-server.ts` as MODIFY. |
| H2 | R1 said `websocket-server.ts`, `mcp-server.ts`, and `types.ts` are unchanged, but real `joinChannel` requires changes in all three. The current `FigmaBridge.joinChannel` is synchronous; making it remote forces async, which ripples through. ([types.ts:45](../../../figma-mcp/src/server/types.ts:45), [mcp-server.ts:64](../../../figma-mcp/src/server/mcp-server.ts:64), [types.ts:2](../../../figma-mcp/src/server/types.ts:2)) | Updated §8 to MODIFY those files. New protocol detail in §10. Added §10.4 on the interface async-ification. |
| H3 | R1's "daemon owns 3055" invariant doesn't survive the plugin's 3055–3060 port-cycling logic ([ui.ts:4](../../../figma-mcp/src/plugin/ui.ts:4), [manifest.json:9](../../../figma-mcp/manifest.json:9)). | New §10b *Plugin port narrowing*. Updated §8. Updated §7 invariants. |
| M1 | R1 conflated machine-boot with user-login behaviour for LaunchAgents and used legacy `launchctl load`/`unload`. | Updated §13 (login vs boot phrasing). Updated §12 to use `bootstrap`/`bootout`/`kickstart`. |
| S1 | No `README.md` exists — "modify README" is really "create docs". | §16 retitled. |
| S2 | R1 introduced `FIGMA_MCP_PORT` while existing code uses `FIGMA_MCP_PORT`. Drift, not intentional. | All `FIGMA_MCP_PORT` corrected to `FIGMA_MCP_PORT` throughout. |

### Revision 1

Initial draft. See git history for full content.

---

## TL;DR

Today, every Claude Code session spawns its own `figma-mcp` stdio process. Each tries to bind port 3055; the winner is "host" and the rest become "relay clients" that proxy through it. State doesn't reliably mirror across this fleet, and the failure mode — plugin shows Connected in Figma while MCP returns `connected: false, pluginCount: 0` — costs ~10–15 minutes per occurrence to manually unstick.

**Proposal:** replace host-or-relay with **one always-on daemon** (managed by macOS launchd) that exclusively owns the WebSocket and the plugin connection. All MCP stdio processes become **pure clients** of the daemon. No election. No promotion. No distributed state to mirror.

**Estimate:** ~1.5–2 hours of focused work for the refactor itself. ~30 min more for the install scripts and README. Multi-file UX skill is a separate workstream (~30 min).

**Reversibility:** entirely reversible via `git revert` + `launchctl unload` + `rm` of the plist. Nothing persistent moves.

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
- **G2.** Zero manual intervention to clear stuck states under normal use (no `kill <pid>`, no plugin reopens).
- **G3.** Multi-Figma-file support actually works — `joinChannel` succeeds from any session.
- **G4.** Survives Mac reboot — daemon comes back automatically, plugin reconnects when Figma opens.
- **G5.** Easy to reason about: one process owns plugin state, every other process is a thin client.
- **G6.** Cleanly reversible — if the daemon model causes problems, we can `git revert` and resume host-or-relay with no data migration.

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
| `src/server/websocket-server.ts` | **MODIFY (R2)** — broadcast `client_status_update` on plugin join/leave/active-channel-change; add `client_join_channel` / `client_status` request handlers; preserve existing `relay_*` handlers during transition (or rename — see §23 Q4) | 45 min |
| `src/server/mcp-server.ts` | **MODIFY (R2)** — `joinChannel` becomes async, await it; cache-refresh hint after channel change | 10 min |
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

## 17. Multi-file UX (separate workstream)

The protocol already supports the daemon holding multiple plugin connections, one per Figma file (keyed by `channelId`). What's missing is the **conversational disambiguation logic** at the Claude Code usage level. This is **NOT a daemon code change** — it lives in Claude Code as a skill or slash command.

### Behavior to encode

1. Before any selection-dependent command, call `get_connection_status`.
2. `pluginCount === 0` → tell the user "Open the Claude Code Bridge plugin in Figma, then retry."
3. `pluginCount === 1` → auto-select via `join_channel(plugins[0].channel)`.
4. `pluginCount > 1` and no active channel for this stdio MCP → ask "I see N files connected: [list]. Which one?" then `join_channel(selected)`.
5. Mid-session switching: if the user says "switch to X", call `join_channel(x.channel)`.

### Implementation options

- **Option A:** A custom slash command `/figma-use` in `.claude/commands/figma-use.md` that walks the user through file selection.
- **Option B:** A skill (`figma-bridge-disambiguation` or similar) that auto-triggers when figma-mcp tools are invoked without an active channel.
- **Option C:** CLAUDE.md instructions documenting the flow as natural-language guidance for the model.

**Recommendation:** Option B (skill). Slash commands require explicit invocation; skills auto-trigger on the right signals. CLAUDE.md is the weakest because it depends on the model remembering procedural details under load.

This is **out of scope for the daemon refactor itself** — it's a follow-up.

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

## 20. Acceptance criteria

The refactor is "done" when ALL of these hold:

- **A1.** Three or more Claude Code sessions used in a row over a workday without killing any PIDs or reopening the Figma plugin.
- **A2.** Two or more Figma files connected to the bridge concurrently; Claude correctly disambiguates or auto-selects (assumes §17 skill is also done — A2 is conditional).
- **A3.** After Mac reboot, daemon starts automatically and Figma plugin connects without manual intervention.
- **A4.** Zero "port in use" or "another instance is open" errors during normal use over a one-week period.
- **A5.** All test plan items T1–T9 pass.

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

These are the places where I'd push back on myself. Want your input before implementing.

### Q1. Node path in plist — hardcoded or wrapper script?

**Option A** (current plan): install script does `command -v node` at install time, hardcodes the resulting absolute path into the plist. **Pro:** simplest. **Con:** Node version upgrades require reinstall.

**Option B**: install script writes a wrapper at `scripts/run-daemon.sh`:
```bash
#!/usr/bin/env bash
exec "$(command -v node)" "$REPO_ROOT/dist/daemon/index.js"
```
Plist's `ProgramArguments` calls the wrapper. The wrapper resolves Node fresh at every launch.

**Con of B:** launchd doesn't run shells with the user's PATH by default. The wrapper would need to source `~/.zshrc` or similar to find `nvm`-shimmed node. That gets ugly fast.

**My lean:** A. Document "rerun install-daemon after Node upgrades" in README. Easier and works.

**Your call?**

### Q2. Should we keep parent-PID heartbeat in server/index.ts?

The current server/index.ts has a 5-second `process.kill(parentPid, 0)` heartbeat ([lines 62-74](../../../figma-mcp/src/server/index.ts:62)) to catch zombie scenarios where stdin doesn't close cleanly on parent death. This was load-bearing when the host process needed to release port 3055.

Now that the stdio MCP is a pure client (doesn't bind a port), is the heartbeat still useful?

**My lean:** No. stdin EOF + signal handlers cover the normal cases. The heartbeat was mostly for the host scenario. Drop it for simplicity.

**Your call?**

### Q3. (Resolved in R2) New message types for `joinChannel`

Resolved: new dedicated message pair (`client_join_channel` / `client_join_channel_response`) per §10.4. The reviewer's H2 finding made clear that this is required, not optional, and that piggybacking on `client_command` would be hacky.

### Q4. Rename `relay_*` message types to `client_*`?

After the rename, the protocol doesn't really have "relays" — it has clients. Strictly cosmetic, but if we're touching the file anyway, the naming will read better forever after.

**My lean:** rename. Touches `types.ts`, `websocket-server.ts` (wherever it parses incoming messages), and `daemon-client.ts`. Maybe 15 minutes total.

**Your call?**

### Q5. Should daemon's `EADDRINUSE` exit be exit-2 (restart) or exit-3 (don't restart)?

If the daemon starts and finds port 3055 already in use (because, e.g., a stale `node dist/server/index.js` from before install is still there), should launchd keep retrying every 10s, or give up?

**Option A** (exit 2, restart): launchd keeps trying. Eventually the stale process dies, daemon starts. Self-healing. **Con:** if there's a real problem (some other software permanently bound port 3055), launchd hammers forever.

**Option B** (exit 0 with sentinel, don't restart): daemon prints clear error and stops. User must intervene. **Con:** the user has to notice and fix manually.

Since `KeepAlive: { Crashed: true, SuccessfulExit: false }` only restarts on non-clean exits, exit-0 wouldn't trigger a restart. Exit-2 would. Or we could use `ExitTimeOut` to delay.

**My lean:** A (exit 2, restart). The stale-process scenario is the common case and self-heals. The "permanently bound" scenario shows up loudly in logs. ThrottleInterval bounds the cost.

**Your call?**

### Q6. Bundle `ws` into daemon, or keep external?

`esbuild --bundle` pulls `ws` (and all transitive deps) into a single `dist/daemon/index.js`. Simpler runtime — no `node_modules` needed for the daemon to run.

Alternative: `--external:ws --external:uuid` keeps them external; daemon needs `node_modules` reachable at runtime.

**My lean:** bundle. The daemon is tiny; bundling adds ~50KB; runtime simplicity is worth it.

**Your call?**

### Q7. Multi-file disambiguation skill — included in this work or separate?

§17 is genuinely a separate workstream (skill in `.claude/skills/`, not figma-mcp code). But without it, multi-file fundamentally doesn't work conversationally even after the daemon ships.

**Option A:** ship the daemon refactor first, then ship the skill as a follow-up. Clean separation.

**Option B:** ship them together so multi-file works from day one of the daemon being live.

**My lean:** A. The daemon refactor is valuable on its own (single-file flows get massively better immediately). Multi-file is a nice-to-have that can wait. They're different code, different repos, different risk profiles.

**Your call?**

### Q8. Install script as `bash` or as a `tsx` script?

The repo already uses `tsx scripts/build-plugin.ts` for build scripts. Could write `install-daemon.ts` instead of `install-daemon.sh` for consistency.

**Pro of bash:** one less indirection, faster, matches the macOS-native vibe of launchd.
**Pro of tsx:** consistent with existing `scripts/build-plugin.ts`, can use TypeScript types for plist/config validation.

**My lean:** bash. The script's job (call `launchctl`, write a plist, `lsof` to verify) is squarely in shell territory. TypeScript adds nothing here.

**Your call?**

### Q9. (R2) Plugin port narrowing — collapse the 3055–3060 fallback?

Per §10b, R2 narrows the plugin to a single port (3055). This eliminates the `FIGMA_MCP_PORT` runtime override knob in the plugin's manifest.

**Option A (R2 default):** narrow to 3055. Anyone needing a different port edits both the plugin and the daemon.

**Option B:** keep the 3055–3060 fallback in the plugin manifest, but have the plugin only attempt 3055 by default; expose `FIGMA_MCP_PORT` in the daemon plist's `EnvironmentVariables` and document a way to switch the plugin too.

**My lean:** A. The override is effectively unused, and the fallback is the source of the H3 hazard. Edit lockstep if needed.

**Your call?**

### Q10. (R2) `client_status` request semantics — single-shot or subscribe?

§10.3 says: on connect, the client sends one `client_status` request (bootstrap), then receives `client_status_update` pushes thereafter.

Should the client also be able to send subsequent `client_status` requests for ground-truth pulls in `getConnectedFileInfo`? My current sketch does this — push for the cache, request/response for the user-facing query.

**Alternative:** the client never re-requests; trusts the push entirely. `getConnectedFileInfo` reads the cache.

**Pro of pull-on-query:** strongest correctness guarantee; survives any push-loss bug.
**Pro of trust-the-push:** simpler, no two paths.

**My lean:** pull-on-query. Belt and braces — the cost is one round-trip per user-initiated status check.

**Your call?**

### Q11. (R2) `client_status_update` push fan-out — broadcast to all clients vs targeted?

Today's daemon doesn't track which clients exist (the WebSocket server's `clients` map is for plugins, not for MCP clients). To broadcast `client_status_update`, the daemon needs to track MCP clients too — likely a new `Set<WebSocket>` keyed by the WS connection.

**Option A:** track all incoming WS connections in `mcpClients: Set<WebSocket>`. Add to the set when a non-plugin client first sends `client_status` or `client_command`. Remove on close. Broadcast iterates this set.

**Option B:** broadcast to all `wss.clients` and let each peer decide whether to handle the message. Simpler but plugins would receive `client_status_update` they don't care about.

**My lean:** A. Cleaner separation, plugins don't see daemon-internal messages.

**Your call?**

### Q12. (R2) Wire-message renames — `relay_*` → `client_*` (touched in Q4)

Q4 originally asked whether to rename. With R2's actual scope (we're touching `types.ts` and `websocket-server.ts` regardless), the cost of renaming during this work is ~5 minutes vs leaving "relay" terminology in a daemon-model codebase forever.

**My lean (firmer in R2):** rename. The system has no relays anymore. Calling them relays will mislead readers.

**Your call?**

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

## 25. Estimate breakdown (revised in R2)

Cumulative time, assuming focused work. R1 estimate was ~3.5 hours; R2 raises it because the protocol changes flagged by the reviewer (status push, async `joinChannel`, async `getConnectedFileInfo`, port narrowing) are real work.

| Step | Time |
|---|---|
| Confirm existing shapes by re-reading websocket-server.ts, types.ts, mcp-server.ts | 15 min |
| Write `src/daemon/index.ts` | 30 min |
| Update `types.ts`: new wire messages + async `FigmaBridge.joinChannel` + async `FigmaBridge.getConnectedFileInfo` (R2) | 15 min |
| Update `websocket-server.ts`: broadcast `client_status_update` on plugin join/leave/active-channel-change; add `client_join_channel` and `client_status` handlers; track `mcpClients` set; wrap `joinChannel` and `getConnectedFileInfo` async (R2) | 60 min |
| Rename + simplify `relay-client.ts` → `daemon-client.ts`: delete promotion logic; replace polling with `client_status_update` push handler; ground-truth pull for `getConnectedFileInfo`; real wire-RPC `joinChannel` (R2) | 75 min |
| Update `mcp-server.ts`: await `joinChannel`; await `getConnectedFileInfo` in `get_connection_status` (R2) | 10 min |
| Modify `src/server/index.ts` (delete host-or-relay fork; depend on daemon-client) | 10 min |
| Plugin narrowing: `ui.ts` constants + reconnect logic, `manifest.json` allowedDomains (R2) | 15 min |
| Rebuild plugin and verify it still loads in Figma after manifest change | 10 min |
| Write `scripts/install-daemon.sh` (with bootstrap/bootout/kickstart, port-sweep preflight) | 30 min |
| Write `scripts/uninstall-daemon.sh` | 5 min |
| `package.json` updates | 5 min |
| **Create** `README.md` (R2 — does not exist today) | 25 min |
| Run T1–T9 manually + new T10–T12 (R2 — see §18) | 45 min |
| Buffer for edge-case fixes during testing | 45 min |
| **Total** | **~6 hours** |

The R1 estimate of 3.5 hours was based on the now-disproven assumption that `websocket-server.ts`, `mcp-server.ts`, and `types.ts` were unchanged. Once the reviewer surfaced that assumption, the protocol work and the async-ification cascade roughly double the code-change time.

Multi-file disambiguation skill (§17): still separate, ~30–60 min.

**Recommendation:** budget half a day, not 2 hours. If the user wants to break this up, the natural seam is "land §8–§11 + §10b first (the daemon and the protocol changes), live with it for a few days, then land the install scripts and README as a follow-up." But install must happen for the daemon to actually be useful, so that seam mostly just adds a context switch.

---

## Sign-off

When ready to implement, the path forward is:

1. Resolve all open questions in §23.
2. Apply changes in §8 in the order listed (creating the daemon first, then simplifying server/index.ts, then renaming relay-client).
3. Build, install, run T1–T9.
4. Use for a week.
5. If clean: delete `relay-client.ts` from git history is unnecessary — keeping it as `daemon-client.ts` is enough; old code is in git anyway.
6. If problems: §21 rollback.
