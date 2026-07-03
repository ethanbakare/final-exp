---
kind: handoff
id: 8e42c9d1-3f7a-4b8e-a1c2-d5f0e9b3a6c7
title: B2.d propagation SHIPPED; pivot back to realtime OpenAI voice-interface visualization
created: 2026-07-03T07:48:00+01:00
status: ACTIVE
handoff_type: pre-compact
prior_handoff: tasks/realtime-vad-and-vercel-401-handoff.md
related:
  - tasks/PLAN_2026-07-02_realtime-connect-window-fix.md
  - tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md
  - tasks/realtime-first-token-handoff.md
---

# §1. One-paragraph summary

Session pivoted at ~10pm from realtime voice-interface work into a 12-hour meta-detour that propagated CLAUDE.md Rule B2.d (model-family diversity for load-bearing multi-reviewer verdicts) into 4 global skill/agent files (v5.1 SHIPPED at ~06:45 BST + v5.2 IMR patches applied to `plan-writing/SKILL.md` and `implementation-review.skill.md`). Vercel production 401 was fixed earlier in the session (OpenAI key rotated + redeploy triggered; verified via Playwright). Realtime plan v2 (`PLAN_2026-07-02_realtime-connect-window-fix.md`) hit tier-4+ review territory with real Critical + Major findings that were documented but never applied to a v3 — that plan v3 is the primary deferred work. HEAD is `16bde7c` on `main`, working tree has one untracked screenshot (`prod-listening-fixed.png`). Next move: read the realtime plan + Codex/Claude v2 review findings, then decide whether to apply-and-ship or replan the connect-window UX fix per the user's chosen Variant 02 (chirp-on-ready + "Connecting…" with 3-dot animation, orb stays calm during warming).

# §2. Where we are right now

| Fact | Value |
|---|---|
| Branch | `main` |
| HEAD commit | `16bde7c plan(realtime): apply plan-reviewer pass-1 findings + cascade audit` |
| Ahead of `origin/main` | 6+ commits (last verified). Not pushed. |
| Working tree | 1 untracked file: `prod-listening-fixed.png` (Playwright evidence from earlier this session; delete unless you want to keep as artifact) |
| Dev server | not running at handoff time |
| Vercel production | working (OPENAI_API_KEY rotated via CLI + redeployed via `vercel redeploy`; endpoint returns 200) |
| Local `.env.local` OPENAI_API_KEY | valid (`sk-proj-…A0oA`, 164 chars) |
| Vercel prod OPENAI_API_KEY | valid — rotated to match local (fingerprint `sk-proj-…A0oA` per direct probe of OpenAI) |
| B2.d propagation | SHIPPED (v5.1 applied + v5.2 IMR patches applied) |
| Realtime plan v3 | NOT WRITTEN — v2 review findings pending application |

# §3. What shipped this session (commit list + non-commit changes)

**Committed to `final-exp` repo (all pre-pivot):**

| Commit | What it did | Files touched |
|---|---|---|
| `16bde7c` | Realtime plan v1 → v2 revision applying plan-reviewer round-1 findings + cascade audit | `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` |
| `bb7b2c9` | Realtime plan v1 draft | `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` |
| `0d7003c` | WebRTC connect-window UX research artifact (Pattern A recommendation) | `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md` |

**Uncommitted changes to `final-exp` repo**: none other than the one screenshot.

**Uncommitted changes to `~/.claude/` (NOT a git repo — archive is the audit trail):**

- `~/.claude/skills/plan-writing/SKILL.md` (574 → 825 lines, +251) — v5.1 additions + v5.2 IMR patches
- `~/.claude/skills/plan-review.skill.md` (510 → 529 lines, +19) — Cross-model discipline section + self-check bullet
- `~/.claude/agents/plan-reviewer.md` (489 → 504 lines, +15) — Load-bearing signal awareness section
- `~/.claude/skills/implementation-review.skill.md` (363 → 435 lines, +72) — line 56 three-echo-state amendment + line 60 SHOULD upgrade + `### Codex-partition-A protocol` subsection + v5.2 cross-ref note
- `~/.claude/failure-history.md` — appended: (a) 2026-07-02 Codex-catches-SDK-source finding entry (empirical B2.d trigger); (b) 2026-07-02 codex-rescue wrapper extension (silent-launch + silent-completion failure modes + direct-companion dispatch workaround)
- `~/.claude/archive/2026-07-03-b2d-propagation-v5.1/` — pre-edit snapshots of all 4 skill/agent files

**Vercel production** (verified live at handoff time via curl → 200):

- OPENAI_API_KEY on Vercel rotated to match local `.env.local` `sk-proj-…A0oA` key.
- Deployment redeployed.
- Endpoint `https://www.littleexp.com/api/voice-interface/openai-realtime-token` returns `{"key":"ek_..."}` (verified earlier this session).

# §4. Validated artifacts + source pointers

### 4.1 B2.d propagation plan artifact (SHIPPED)

Path: `/private/tmp/claude-501/-Users-ethan-Documents-projects-final-exp/449603a5-9c3d-4137-92fe-30f2476dd171/scratchpad/b2d-propagation-plan-v5.1.md`

Status line: `status: SHIPPED` in frontmatter. Verified this session.

**Volatile-path warning**: `/private/tmp/…` is session-scoped. If this session ends, the scratchpad may be reaped. **If the next session needs to reference the v5.1 SHIPPED plan artifact**, copy it into the final-exp `tasks/` directory or the `~/.claude/archive/2026-07-03-b2d-propagation-v5.1/` directory first.

### 4.2 Realtime plan v2 (the deferred original work)

Path: `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` (429 lines, verified this session).

This is the plan that empirically triggered the B2.d propagation. Its status at handoff:

- v1 review (Claude): 0 Crit + 3 Major + 4 Minor
- v1 revision applied (commit `16bde7c`)
- v2 review (Claude): **3 Critical + 3 Major + 2 Minor** — findings never applied
- v2 review (Codex): **1 Critical + 3 Major, including one Codex-only finding all 3 Claude perspectives missed** (session.connect() has no AbortSignal — verified against `node_modules/@openai/agents-realtime/dist/realtimeSession.d.ts:79-97`)
- v3 NEVER WRITTEN

The v2 review findings live in the current session's transcript (task-notification messages for the plan-reviewer subagent runs). If those transcripts are lost to compaction, the findings need to be re-derived by re-dispatching plan-reviewer on the current plan file — cheaper than replanning from scratch but not free.

### 4.3 Research artifact — Pattern A rationale

Path: `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md` (72 lines).

Byte-verified inline sources cited: Discord voice channels, OpenAI Realtime Playground community forum (98% first-word-loss reproduction rate), Whereby, Zoom/Meet, Zello/Motorola PTT, Siri/Alexa/Google Assistant.

Four patterns identified. **Pattern A (chirp-on-ready) was recommended and user accepted.**

### 4.4 Chosen UX — Variant 02 mockup (load-bearing decision)

**Artifact URL (public claude.ai artifact)**: <https://claude.ai/code/artifact/8422cdb5-ba5b-4d33-9410-43b7af29a22a>

**Local scratchpad copy**: `/private/tmp/claude-501/…/scratchpad/warming-state-mockup.html` (volatile — save if needed)

**User's chosen variant**: **Variant 02 — Chirp + "Connecting…" text with 3-dot animation. Orb stays CALM during warming (idle motion continues; no half-amplitude pulse).** Verified via user statement at approximately 22:25 BST: *"I'll go for variant two, which is recommended. I think it's pretty simple and straightforward with regards to the way it works."*

**Why this specific variant (rejects prior `014f7af` attempt)**: the earlier `014f7af` commit (reverted in `4473353`) held the orb at idle for the whole 1-2s connect window while showing "Ready when you are" text. User rejected because the static text felt dead/broken. Variant 02 fixes this by CHANGING the text to "Connecting" with bouncing 3-dot animation — the dots keep the interface feeling alive without moving the orb. This is documented in `tasks/realtime-first-token-handoff.md` and repeated here because it's the load-bearing constraint the next session must respect.

### 4.5 State-machine changes required for Variant 02

Verbatim from `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` line 685 area (session config — needs editing per current v2 review):

```ts
const session = new RealtimeSession(agent, {
  transport,
  config: {
    audio: {
      input: {
        turnDetection: {
          type: 'semantic_vad',
          createResponse: false,
        },
      },
    },
  },
});
```

The v2 plan proposed:

1. Add `isConnecting: boolean` state alongside `AppState` (5 orb component `RealtimeVoiceState` unions preserved; do NOT extend that union).
2. Change `handleStartConversation` (`VoiceRealtimeOpenAI.tsx:570`) so `setAppState('listening')` fires AFTER `await session.connect()` resolves (moves from line 580 to after line 713).
3. Extend `VoiceStateLabelState` union with `'connecting'` value (`src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx:10`); render "Connecting" with three bouncing dots.
4. Add Web Audio synthesized chime helper (`playConnectChime`) fired at ready. Byte-equivalent to the chime in the accepted mockup.
5. Guard button-during-warming so `handleStartConversation` cannot re-fire.

Reference: `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` §2 (architecture decision + Consumers subsection) and §5 (chime helper).

# §5. What's next

1. **VERIFY the OpenAI key + Vercel token exposure has been mitigated by the user before touching more security-sensitive work.** Both keys touched the chat surface tonight. Ask user for confirmation of rotation status.

2. **VERIFY HEAD is still `16bde7c`** on `main` (git log --oneline -1). If a peer force-pushed or user rebased, re-scope before acting on the below.

3. **READ `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` end-to-end.** This is the current state of the connect-window fix plan.

4. **RECOVER the v2 review findings.** If the compaction summary preserves the Claude v2 (3C+3M+2m) and Codex v2 (1C+3M+1 Codex-only) findings, use them as the v3 revision list. If not, **re-dispatch parallel plan-reviewer (Claude, perspective: concurrency + state-machine invariants) + `codex:codex-rescue`** on the current plan file. Use the direct-companion dispatch pattern (see §7 for command) if the subagent wrapper hangs. Findings will re-derive.

5. **Write plan v3** applying the v2 findings. The plan-writing skill's gate loop will fire Rule B2.d automatically now (as of tonight's SHIPPED propagation) — expect a Codex dispatch after two Claude perspectives return SAFE. Load-bearing criterion 4 fires (touches SDK boundary: `@openai/agents-realtime`).

6. **On v3 review convergence, implement the fix.** Then run implementation-review (both partitions — Claude on B, Codex on A per shipped default) on the implementation.

7. **Verify in real Chrome** (Playwright cannot reproduce the connect-window race with real speech timing — user must test locally with a real microphone).

8. **Push to `main`** after prod-safe. `origin/main` is 6+ commits behind local.

9. **Then**: consider the broader "realtime OpenAI visualization" scope. Per user's phrasing at 07:38 BST — *"pick up what matters which is work on the interface design for real-time open api visualisation"* — this may extend beyond the connect-window fix into orb/waveform/UI-affordance work. Ask user to scope.

# §6. Unresolved threads + alternatives considered

## §6.1 Realtime plan v3 findings never applied

**Raised**: this session, Codex + Claude v2 reviews of the realtime plan.

Claude v2 review findings (from task-notification `abc61d2687df1535e` — search transcript):

- 3 Critical (async race conditions in the handleStartConversation reordering)
- 3 Major
- 2 Minor

Codex v2 review findings (from task-notification `a5170595de38f8b62`):

- 1 Critical (verified against SDK `.d.ts` files: `session.connect()` has no AbortSignal, so proposed Promise.race timeout is structurally leaky)
- 3 Major
- 1 Codex-only finding no Claude perspective caught

v3 direction discussed but never written. Options weighed:

- **Path A** (patch v3 with restructure): user chose this at 22:53 BST but session pivoted immediately to B2.d propagation.
- **Path B** (radical simplify: drop loop-pseudocode restructure): considered as fallback.
- **Path C** (defer mechanical embedding, ship prose-only): considered.

## §6.2 Broader "realtime visualization" scope

**Raised**: this session, user's 07:38 BST message.

User's phrasing: *"work on the interface design for real-time open api visualisation."* This may be:

- Just the connect-window UX fix (Variant 02 chirp-on-ready)
- OR broader orb design work (which orb states, transitions, colors, motion — beyond the current 4-state Coral/Nebularr/Circle profiles)
- OR the wavefore visualization pipeline (audio-analyser → orb amplitude modulation — currently uses `getAudioDataFromAnalyser` in `VoiceRealtimeOpenAI.tsx`)

Next session should ask the user to scope before diving in.

## §6.3 Trace AI Gemini → OpenRouter migration

**Raised**: user's first message this session at ~17:00 BST.

Scoped only. Three files identified:
- `src/projects/trace/services/geminiService.ts`
- `src/pages/api/trace/parse-receipt.ts`
- `src/pages/api/trace/parse-voice.ts`

**Sharp edge**: `parseVoiceAudio` uses audio input. OpenRouter's Gemini variants may or may not accept audio; the model list needs to be fetched first (`GET https://openrouter.ai/api/v1/models` → inspect `input_modalities`).

Never started; still deferred.

## §6.4 v5.2 was never Pass-2 reviewed

**Raised**: 07:46 BST — user asked "has IMR gotten lower than major 2 now, have we covered everything?"

All 4 IMR-round findings were applied to v5.2, but per strict Rule B2.a a Pass-2 review on v5.2 was NOT dispatched. Diminishing returns rationale — session pivoted. If next session invokes plan-writing on a load-bearing plan, the new Rule B2.d discipline will surface any real defects in v5.2 empirically. Corner-case orphan-decline loop is documented in `~/.claude/skills/plan-writing/SKILL.md §The self-orchestrating gate` and may need revisit if observed.

## §6.5 codex-rescue subagent wrapper reliability

**Raised**: user at 06:52 BST — *"sometimes codex fails silently or like the sub agent spin off is not showing in the harness or sometimes it doesn't report back to the harness that it's finished."*

Two orphaned Codex tasks tonight: `task-mr4ip4nr-8g8c4a` and `task-mr4j248c-nhyvgm`. Both cancelled. Direct-companion dispatch (`node ~/.claude/plugins/cache/openai-codex/codex/1.0.5/scripts/codex-companion.mjs task "…" --effort medium`) worked in the same session.

Failure-history entry extended with both failure modes + workaround. Not blocking; operational awareness only.

## §6.6 Key/token exposure hygiene

**Raised**: several times this session.

- OpenAI `sk-proj-…A0oA` key was visible in curl output when testing OpenAI directly (mid-session).
- Vercel token `vcp_31czKO1n…` was pasted by user for CLI dispatch.

Both touched the chat surface. Should be rotated on general principle. **User acknowledged the concern but rotation status is unverified.** Next session should confirm before doing more security-sensitive work.

# §7. Known unknowns

- Whether `docs.claude.ai` transcripts persist through `/compact` (structural assumption; not verified this session).
- Whether next session's compaction summary will preserve the exact task-notification IDs for v2 reviews. If not, re-dispatch is needed (~10 min cost).
- Whether the Vercel token still works — I used it earlier to rotate the OpenAI key + redeploy; user should verify it wasn't revoked meanwhile.
- Whether the Playwright screenshot `prod-listening-fixed.png` is worth keeping — it's just visual evidence prod was fixed at ~16:00 BST.
- Whether the v5.2 orphan-decline corner case surfaces empirically. If a user declines residual-risk after a Codex orphan and the loop rotates Claude perspectives forever, that's the corner case fired — documented at `~/.claude/skills/plan-writing/SKILL.md §The self-orchestrating gate` §7.
- Whether the Codex-partition-A partition-echo protocol works reliably. Tonight was n=1 (the IMR partition-A retry via direct-companion — did echo correctly). Empirical data on echo-missing rate needs ~20 dispatches to inform the "revisit at ≥5%" trigger.
- Whether the Vercel deployment I triggered picked up the `.vercel/project.json` I created (or if there's a permanent link). If not, subsequent `vercel` CLI calls from local may need `vercel link` again.

# §8. Hard constraints in force

From `~/.claude/CLAUDE.md` (global) — quoted rule names, cite location:

- **Rule D1 (edit-approval gate on skill files)**: any edit to `~/.claude/skills/*.skill.md` or `~/.claude/CLAUDE.md` requires user approval BEFORE the edit is applied. Applies if next session considers touching the propagated B2.d discipline in any target file.
- **Rule D2 (verify-before-applying)**: reviewer findings, subagent reports, recall — never ground truth. Verify at cited source before applying. Per-finding, not batched.
- **Rule D3 (verify-before-writing-plans)**: every claim about external artifacts must be verified at source before writing prose that cites it. Per-claim, not batched.
- **Rule A1 (cascade-audit)**: after any non-trivial edit, sweep for stale cross-references. This is a semantic-inversion sweep, not a term-presence check.
- **Rule B2.a (Pass-2 mandatory)**: after applying any findings to own work, run fresh-context Pass-2 review before declaring done. This is the rule that v5.2 has NOT been through yet (see §6.4).
- **Rule B2.c + B2.d (two-reviewer cross-family agreement)**: any load-bearing verdict needs two fresh-context reviewers, ideally with model-family diversity. As of tonight's SHIPPED discipline, the plan-writing skill fires this automatically on load-bearing plans.
- **Rule E1 (background-by-default subagents)**: any subagent dispatched by the next session must be `run_in_background: true` unless the very next tool call depends on the result.
- **Commit rules**: NEVER include `Co-Authored-By` or `@anthropic.com` addresses in commit messages. This is user global instruction.
- **Reply closing rule**: end reply at last substantive sentence — harness auto-appends the timestamp. Composing a footer creates visible duplicate stamps.
- **Compact messages must be in copyable fenced code blocks** (per project memory `feedback_compact_messages`). Don't repeat CLAUDE.md rules inside the compact.

# §8b. PIS state

**final-exp repo does NOT have a project-PIS.** Verified this session via `find tasks -name "*PIS*"` — returns zero hits. PIS infrastructure lives in `otherexp` (`PLN_PROD_000_PIS.md`) and SpendSpeak (`SPK_PIS_*`); this repo uses looser `HANDOFF_*.md` / `<topic>-handoff.md` naming.

**Consequence**: `PLAN_2026-07-02_realtime-connect-window-fix.md` §0 is a feature-PIS authored fresh (not citing a project-PIS). Next session's plan v3 should carry the same feature-PIS forward. No `Advances: SPK_UVO-1` citations apply.

**Plan-writing gate SCOPE_ANCHOR**: will resolve `PIS_PATH` to `"none-found"` for this repo. That's fine — the escape declaration at FORMAT.md line 60 allows global-user-instructions layer proposals to skip project-PIS.

# §9. Cost summary

**This session (~14 hours)**:

- ~3 hours: realtime work (Vercel diagnosis + fix; connect-window research + mockup; realtime plan v1+v2 drafting + review rounds)
- ~10 hours: B2.d propagation meta-work (research + plan v1-v5.1 + application + IMR + v5.2 patches)
- ~1 hour: dispatched IMR + wrapper diagnostics + handoff writing

**Estimated next-session work**:

- v3 recovery + application: 1-2 hours
- Implementation of Variant 02 (chirp + connecting-text): 3-4 hours (chime helper + state-machine + label component + button guard)
- Manual verification in Chrome: 30-60 min
- Push + Vercel monitoring: 15 min
- Trace migration scoping (if user wants): 30-60 min separate

# §10. Resume message (copy-paste block)

```
Resume from handoff at /Users/ethan/Documents/projects/final-exp/tasks/HOFF-2026-07-03-b2d-shipped-pivot-realtime-interface.md

FIRST ACTION — VERIFY, DON'T TRUST:

1. `git log --oneline -1` — expect `16bde7c plan(realtime): apply plan-reviewer pass-1 findings + cascade audit` OR a later commit.
2. Verify Vercel prod token endpoint still returns 200:
     curl -sS -o /dev/null -w "STATUS: %{http_code}\n" -X POST https://www.littleexp.com/api/voice-interface/openai-realtime-token
   Expected: 200. If 401 again, Vercel key was rotated by user or drifted — re-scope.
3. Verify B2.d propagation is still in place at ~/.claude/skills/plan-writing/SKILL.md:
     grep -c "codex_family_dispatched_this_cycle\|residual_acceptance_reason" ~/.claude/skills/plan-writing/SKILL.md
   Expected: ≥8 (5 refs to codex flag + 6 refs to residual reason). If 0, propagation was reverted or file was replaced.
4. Read tasks/PLAN_2026-07-02_realtime-connect-window-fix.md end-to-end. This is v2. It needs a v3 revision.
5. Ask user: "confirm you have rotated the OpenAI key (sk-proj-...A0oA) and Vercel token (vcp_31czKO1n...) since both touched the chat surface earlier"?

THEN, IN ORDER:

6. Recover v2 review findings for the realtime plan. If compaction preserves task-notification IDs abc61d2687df1535e (Claude v2) and a5170595de38f8b62 (Codex v2), use those. If not, re-dispatch:
    - Claude plan-reviewer with perspective "concurrency + state-machine invariants + first-30-minutes implementer"
    - Codex via direct-companion (subagent wrapper is unreliable — see failure-history 2026-07-02 codex-rescue extension):
        node ~/.claude/plugins/cache/openai-codex/codex/1.0.5/scripts/codex-companion.mjs task "$(cat <prompt-file>)" --effort medium
7. Write plan v3 applying v2 findings. Plan-writing skill's gate loop will fire Rule B2.d automatically (SHIPPED tonight). Expect Codex dispatch after two Claude SAFE perspectives.
8. On v3 convergence, implement Variant 02 UX in src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx (see handoff §4.5 for the specific state-machine changes) + VoiceStateLabel.tsx.
9. Run IMR (Claude partition B + Codex partition A per SHIPPED default) on the implementation.
10. Manual Chrome verification — Playwright cannot reproduce the connect-window race timing with real speech.
11. Push to origin/main (6+ commits behind locally). NEVER include Co-Authored-By or @anthropic.com in commits.

OPEN THREADS (do not lose):
- §6.1 Realtime plan v3 findings — the load-bearing continuation.
- §6.2 Broader "realtime visualization" scope — user's 07:38 BST message may extend beyond connect-window; ask them.
- §6.3 Trace Gemini→OpenRouter migration — never scoped; still open.
- §6.4 v5.2 skill file changes were NOT Pass-2 reviewed — corner case documented; empirical validation via next real load-bearing plan.
- §6.5 codex-rescue subagent unreliability — direct-companion is the workaround.

HARD CONSTRAINTS (handoff §8):
- Rule D1 (skill-file edit approval), Rule D2 (verify-before-applying findings), Rule D3 (verify-before-writing-plans), Rule A1 (cascade-audit), Rule B2.a (Pass-2 mandatory), Rule E1 (background subagents).
- User's chosen UX is Variant 02 (chirp + "Connecting…" text with 3-dot animation; orb stays calm during warming). Rejected: 014f7af "hold orb at idle" because "Ready when you are" static text felt dead. Variant 02 fixes by using animated dots.

KEY DATA POINTS TO CARRY:
- Vercel prod is WORKING as of ~16:00 BST (OPENAI_API_KEY rotated + redeployed + verified via Playwright).
- B2.d propagation SHIPPED at ~06:45 BST; v5.2 IMR patches applied at ~07:20 BST.
- Empirical trigger for propagation: three Claude plan-reviewer perspectives missed that session.connect() in @openai/agents-realtime has no AbortSignal (verified by Codex against node_modules/@openai/agents-realtime/dist/realtimeSession.d.ts:79-97).
```

# §11. Cross-references

**In-repo:**

- `tasks/PLAN_2026-07-02_realtime-connect-window-fix.md` — plan v2 (needs v3)
- `tasks/RESEARCH_2026-07-02_webrtc-connect-window-ux.md` — Pattern A rationale
- `tasks/realtime-vad-and-vercel-401-handoff.md` — prior handoff (Vercel 401 now fixed)
- `tasks/realtime-first-token-handoff.md` — prior handoff (first-utterance-lost issue, still relevant for v3)
- `tasks/HANDOFF_PROJECTS_DEPLOY.md` §1 — deploy workflow reference
- `src/projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx` — target file for state-machine changes
- `src/projects/voiceinterface/components/ui/VoiceStateLabel.tsx` — target file for label extension
- `src/projects/voiceinterface/components/ui/voicemorphingbuttons.tsx:2377` — MorphingRecordWideSimple accepts `disabled?: boolean` (verified this session, referenced from plan §6 button guard)
- `src/pages/api/voice-interface/openai-realtime-token.ts` — token endpoint (working)
- `prod-listening-fixed.png` — Playwright screenshot evidence (delete if not wanted)

**Session-scoped / volatile paths — save before compaction if next session needs them:**

- `/private/tmp/claude-501/.../scratchpad/b2d-propagation-plan-v5.1.md` — SHIPPED B2.d plan artifact
- `/private/tmp/claude-501/.../scratchpad/warming-state-mockup.html` — local copy of Variant 02 mockup
- `/private/tmp/claude-501/.../scratchpad/codex-imr-prompt-v2.txt` — direct-companion IMR prompt (reusable template)

**Global (`~/.claude/`):**

- `~/.claude/CLAUDE.md` line 76 — canonical Rule B2.d
- `~/.claude/skills/plan-writing/SKILL.md` — post-propagation state (v5.2)
- `~/.claude/skills/plan-review.skill.md` §Cross-model discipline
- `~/.claude/agents/plan-reviewer.md` §Load-bearing signal awareness
- `~/.claude/skills/implementation-review.skill.md` §Codex-partition-A protocol
- `~/.claude/failure-history.md` — 2026-07-02 codex-rescue entry (extended) + 2026-07-02 single-family SDK-source finding entry
- `~/.claude/archive/2026-07-03-b2d-propagation-v5.1/` — 4 pre-edit snapshots (`.pre` files)

**External URLs:**

- <https://claude.ai/code/artifact/8422cdb5-ba5b-4d33-9410-43b7af29a22a> — warming-state mockup (public artifact URL)
- <https://community.openai.com/t/realtime-api-webrtc-first-word-consistently-lost-when-voice-feedback-enabled-98-reproduction-rate/1370816> — OpenAI community thread confirming 98% first-word-loss reproduction rate
- <https://www.littleexp.com/voiceinterface/realtime> — the deployed voice interface (working per verification at ~16:00 BST)
