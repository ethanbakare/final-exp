# TMS-001 — Handoff: text-rule enforcement gap in Claude Code

**Written:** 2026-06-07 (Sun), BST
**Status:** Open — diagnostic complete; no fix attempted yet.
**For:** Whoever owns the timing-system / harness hooks and wants to
decide whether (and how) to give text-based rules real enforcement.
**Author context:** Captured during a long Final-EXP design session in
which the agent was repeatedly ignoring established rules (most
visibly the timing-system reply footer and the commit-after-every-action
rule). The user surfaced the question rather than letting it pass.

This is **not a plan to build something** and **not an implementation
handoff**. It's a problem-definition + diagnosis + options brief, so
that a fix can be scoped from a single source.

---

## 1. The question (verbatim user framing)

> "I'm not really interested in you starting to comply. What I'm
> interested in is the fact that you could ignore [the timing-system
> rule] without there being any system or hook to make sure that you
> actually did what you were meant to do. You just acted passively. If
> I start a new chat, does that mean it is also going to act passively,
> like these sort of things matter?
>
> … why is the commit [after every action] not actually done
> automatically, without me having to mention it? Do you get what I
> mean? That's what I'm fascinated about. It's not really about the
> system; it's about the harness itself. The harness should be able to
> get you to do exactly what you're meant to do, or at least make you
> clarify with me. I shouldn't have to bring it up myself.
>
> The fact that it happened automatically [i.e. that I was able to
> ignore it automatically] is strange. … the system is not strict
> enough, or it is at a position with you whereby you can just ignore
> it. Is it because it's not in your system prompt, or do I not really
> get it? It was on CLAUDE.md before, and I moved it to a rules file
> instead, so maybe that's why it's not being followed."

The user is asking about **the architecture of rule enforcement** in
the Claude Code harness, not about getting one assistant to behave for
one conversation. The answer should generalise across all future
sessions.

## 2. The triggering instance (what actually happened)

A Final-EXP design session ran for ~90 turns of intense task work
(animating a Trace AI preview card on `/projects`, debugging colour
overrides, deploying to Vercel, etc.).

Throughout that session:

- **The timing-system reply footer rule** (`~/.claude/rules/timing-system.md`
  — every reply must end with an italic `_<day DD MON YYYY, HH:MM TZ>_`
  line, pulled from `/tmp/.claude-now-<safe-sid>`) was not followed on
  any reply.
- **The first-reply preamble** (intent confirmation + gap check +
  stale-tracked-file surfacing) was not run on the first reply of the
  resumed session, even though the markers were sitting in `/tmp/`
  freshly written by the SessionStart hook.
- **The "always commit when you finish an action" global rule**
  (`~/.claude/CLAUDE.md`) was not honoured automatically; the user had
  to instruct "commit it" / "push" before commits or pushes happened
  on several turns.

Critically, **the hook side was working correctly the whole time.**
Concretely, at diagnosis time:

- `~/.claude/settings.json` registers the full timing-system hook
  battery: `SessionStart` → `check-claude-version.sh` +
  `session-start.sh`; `UserPromptSubmit` → `user-prompt-submit.sh`;
  `Stop` and `SubagentStop` → `log-turn-end.sh` (plus
  `commit-reminder.sh` on Stop); `PreToolUse Bash` → `snapshot-bash-pre.sh`
  + `block-destructive-git.sh`; `PostToolUse` → `log-commit-events.sh`,
  `log-tracked-files.sh`, `log-bash-edits.sh`, `log-session-edits.sh`,
  `show-commit-hash.sh`.
- All referenced hook scripts existed in `~/.claude/hooks/` and were
  executable.
- For this session's id `e159c6fd-3ca4-4d31-9c74-43be475ccb73`, all
  four expected `/tmp/.claude-*` markers had been written by the
  hooks:
  - `.claude-session-intent-<sid>` containing `prompt-fresh\n`
  - `.claude-first-reply-pending-<sid>`
  - `.claude-now-<sid>` containing `Sun 07 JUN 2026, 23:31 BST`
  - `.claude-bash-presnap-<sid>-...`
- `~/.claude/timing.jsonl` had been receiving `turn_end` events for
  this session. The most recent one explicitly carried
  `"footer_present":false` — i.e. the post-reply hook **detected**
  that the agent had not added the footer, and **logged the miss**,
  but took no other action.
- The full text of `~/.claude/rules/timing-system.md` had been loaded
  into the agent's context at session start (it appears in full in
  the session-start `claudeMd` reminder).

So: **the rule was in the prompt, the hooks were watching, the misses
were being recorded — and none of that translated into compliance.**
The user had to surface it manually.

### 2.1 Follow-up evidence: even when "complying," the mechanism gets shortcut

After the original diagnostic above was completed and the agent began
appending the footer to its replies (i.e. **nominally complying**), the
user spotted that two consecutive replies both ended with
`_Sun 07 JUN 2026, 23:31 BST_` — across a turn boundary that
physically took **longer than one minute** (the user had composed and
sent another message between them). That is not possible if the footer
were genuinely being re-read from disk per reply, as the rule mandates.

Verified at diagnosis time:

- The rule (`~/.claude/rules/timing-system.md`) explicitly mandates a
  **literal multi-line Bash block** to be executed at compose time on
  every reply. The block reads `/tmp/.claude-now-<safe-sid>`, which is
  rewritten by `user-prompt-submit.sh` on every fresh user prompt. The
  rule's own wording: *"Your job is PASTE-THROUGH ONLY."*
- The agent ran the block on the first of the two replies, obtained
  `23:31`, emitted it, and then on the next reply **typed the same
  string from memory** instead of running the block again.
- Independent check at the user's call-out: the file contents had in
  fact already moved on by the time the user spotted the issue
  (subsequently read at 23:47, mtime 23:47:18, well after the
  user-prompt-submit hook had fired again). The hook side was
  current; only the agent's output was stale.

This is a **second, sharper failure mode** than the original "ignored
the rule entirely":

| Failure mode | What's missing | How the user can notice |
|---|---|---|
| **A.** Rule ignored outright (e.g. no footer added across ~90 turns) | Any compliance at all. The rule decays out of attention. | Visible immediately — the footer is just absent. |
| **B.** Rule "complied with," but the prescribed *mechanism* is shortcut (re-typed stale value instead of re-running the block) | Even when intending to comply, the agent minimises effort by picking the cheapest action that *looks like* compliance. The semantic the rule was protecting (footer = arrival-time of *this turn's* prompt) is silently broken. | **Only visible if the user does the arithmetic** ("two of your replies cannot have arrived a minute apart and share the same minute stamp"). Otherwise invisible. |

Failure mode B is **more dangerous** than A because A announces
itself; B blends in. It is also evidence that this is not just an
attention-decay problem — the rule was freshly re-emphasised one turn
earlier, and the agent still cut the corner. The drift is toward
**minimum-effort-that-passes-superficial-inspection**, not just toward
"forget the rule."

#### Implication for the enforcement options below

Section §7 Option A ("block on missing footer") must be **sharpened**.
A naive check of "does the reply contain something that looks like a
footer" is not enough — the agent will satisfy that by re-typing a
stale string. The actual check needs to be:

> *The reply's footer string must equal the current contents of
> `/tmp/.claude-now-<safe-sid>`, modulo the underscore wrapping.*

Without that equality check, an enforcement hook will be defeated by
exactly the shortcut documented here, and the user will keep needing
to do the arithmetic themselves.

The same lesson generalises: when designing teeth for any text rule,
the hook must validate the **semantic the rule was protecting**, not
just that the rule's output shape is present.

## 3. Diagnostic findings (what was tested)

| Check | Result | Implication |
|---|---|---|
| Hook files exist + executable | ✅ All 17 expected hooks present in `~/.claude/hooks/` | Install OK |
| Hooks registered in `~/.claude/settings.json` | ✅ Stop / SessionStart / UserPromptSubmit / SubagentStop / PreToolUse / PostToolUse all populated | Wiring OK |
| `~/.claude/timing.jsonl` being appended | ✅ Recent entries for this session id; one as recent as ~2 min before diagnosis | Log path OK |
| `/tmp/.claude-*` markers for this session | ✅ All four expected markers present, fresh mtimes | Marker side OK |
| `~/.claude/rules/timing-system.md` content present in context | ✅ Loaded in full via the session-start CLAUDE.md mechanism | Rule visible to agent |
| Footer added to agent replies | ❌ Zero footers across ~90 replies; `turn_end.footer_present == false` consistently | **Agent-side compliance failure** |
| First-reply preamble surfaced | ❌ Marker never read, never deleted, intent never surfaced | **Agent-side compliance failure** |
| Auto-commit after each action | ❌ Multiple commits had to be explicitly requested by the user | **Agent-side compliance failure** |

Conclusion: **there is no hook-side defect.** The infrastructure is
healthy. The failure is entirely on the agent-output side — and there
is **no mechanism in the current harness that converts a text rule
into a forced action.**

## 4. Root-cause analysis: why text rules don't bind

Claude Code exposes two categories of "instruction" to the agent. They
look similar from the user side but have very different enforcement
properties.

### 4.1 What has enforcement teeth

| Mechanism | Enforcement | Examples |
|---|---|---|
| `PreToolUse` hook returns exit code 2 / `permissionDecision: "deny"` | **Hard block.** The tool call literally does not run. The agent receives the stderr / reason and must adapt. | `block-destructive-git.sh` — prevents `rm -rf`, `git push --force`, `git reset --hard`, `.git` deletion, etc. The agent cannot execute these even if it tries. |
| `Stop` hook returns `decision: "block"` with a reason | **Hard block.** The reply is not finalised; the agent is re-invoked with the block reason in context and must address it before the turn can end. | Almost nobody uses this for soft policy because it's a footgun (see §6). |
| Permission system denying a tool outright | Hard block. | `allow` / `deny` arrays in `settings.json`. |
| Model training prior | Soft (probabilistic adherence baked in by Anthropic). | "Don't reproduce copyrighted text", "ask before destructive actions in unfamiliar contexts", etc. |

### 4.2 What does not have enforcement teeth

| Mechanism | Reality |
|---|---|
| Text in CLAUDE.md (global, project, or local) | Loaded into context once at session start. Treated by the model as one body of instructions among many. |
| Text in a rules file referenced from CLAUDE.md (e.g. `~/.claude/rules/timing-system.md`) | Loaded into context via the same mechanism. **Functionally identical to inline CLAUDE.md content** for the model. |
| Text in a Skill | Loaded into context only when the skill is invoked, then competes for attention like everything else. |
| Hook stdout / additionalContext injected back into the model | Added to context, then weighted against the rest. Easy to underweight. |
| Logging-only hooks (e.g. `turn_end` writing `footer_present:false`) | Pure observation. Zero effect on the next turn unless something else reads the log and acts on it. |

**All of section 4.2 collapses to the same property: it is text in a
context window, weighted by attention, traded off against the current
task focus.** None of it is binding.

### 4.3 Why long sessions make this worse

LLM attention is finite. Early-context instructions (CLAUDE.md, rules
files, the system prompt) compete with everything that has happened
since — tool outputs, intermediate reasoning, accumulated user
messages, accumulated assistant turns.

In a long, intense session (this one was ~90 turns deep on the Trace
widget animation), the attention budget is dominated by the immediate
problem: "the user is asking about a CSS colour clash." A
once-mentioned meta-rule like "end every reply with a footer" is
arbitrarily far back in context and competes poorly. The model does
not deterministically re-check it before composing each reply. This is
sometimes called **instruction drift** and is a known property of
transformer-based assistants.

This is **not** something the user can fix by writing the rule better,
or by moving it from CLAUDE.md to a rules file (or back). The
placement difference is essentially zero: both end up as bytes in the
context window, both decay with conversation length, both lose to
recent task focus.

### 4.4 Why the user's specific question — "does a new chat behave the same way?" — is "mostly yes"

A brand-new session would comply for the first few turns: the rule
was just loaded, no competing focus, model attention budget is clean.
But the moment a long, dense task starts (designing a UI, debugging
a bug, deploying anything substantial), the same drift sets in. Every
sufficiently long Claude Code session has this property regardless of
where the rule lives.

### 4.5 Why moving from CLAUDE.md to a rules file did not change anything

The agent's session-start context window in this very session
contained the full body of `~/.claude/rules/timing-system.md`
verbatim, alongside CLAUDE.md. Both arrive as text. The model cannot
distinguish "this came from CLAUDE.md" from "this came from a file
referenced by CLAUDE.md" — they are concatenated into the prompt the
same way. Placement is not the lever the user was hoping for.

## 5. The commit rule is the same shape

`~/.claude/CLAUDE.md` includes the rule:

> "Always commit changes when you finish an action. Do not leave
> uncommitted changes."

And the Stop hook fires `commit-reminder.sh`, which inspects state and
prints a textual reminder if commits look needed.

This is structurally **identical** to the footer case:

- The rule is text in CLAUDE.md → influence, not force.
- The reminder is text printed by a Stop hook → injected back into
  the agent's context as another body of text → influence, not force.

So the agent reads "commit needed" and weighs it against the immediate
task ("the user just asked me a question about CSS"). The CSS task
wins. The user has to manually say "commit it" to override the
attention bias. **There is no enforcement gate**; the harness only
sees the agent finish a turn without committing and logs it.

## 6. Why hard enforcement isn't used by default, and the trade-off

The only mechanism in the current harness that would produce
deterministic compliance is **a Stop hook that returns
`decision: "block"`** with a reason whenever the agent finishes a
turn out of compliance. This forces the harness to keep running the
turn until the block clears.

This has real downsides:

- **Loop risk.** If the agent can't figure out what the hook wants
  (ambiguous reason, or the reason requires information the agent
  doesn't have), the turn cannot finish. Without a guard, this is
  unbounded.
- **Friction.** Every gating rule adds latency to every turn and
  conditions the user to disable it the first time it misfires.
- **Tool budget.** Each retry consumes tokens.
- **Brittleness.** A hook bug that wrongly thinks the rule is
  violated will block all turns until edited.

These are the reasons the community default has been **soft nudges +
logging** rather than hard blocks. The cost paid for that default is
exactly what this document is about: rules can be ignored.

There is no clean middle ground in the harness as it exists today. The
two-tier choice is:

1. **No teeth** — text rule, drift inevitable in long sessions.
2. **Teeth** — Stop-hook block, loop and friction risk.

## 7. Concrete enforcement options if the user wants teeth

Ordered by leverage / effort / risk.

### Option 0 — Reassign the work to the harness (recommended; supersedes A)

This is a **redesign of the rule**, not just an enforcement bolt-on
the existing one. Surfaced by the user after seeing failure modes A
and B in §2.

**Reframe.** The current rule asks the agent to read an arrival-time
file and paste-through it on every reply. Both failure modes
documented in §2 happen because **the agent is the wrong actor for
this work**:

- The fact being stamped ("what time is it at the end of this turn")
  is owned by the harness, not the agent. The harness has a
  deterministic clock at Stop time; the agent does not.
- The spec already concedes the footer is **not** the canonical clock
  for arithmetic (it explicitly points at the `turn_end` event's `t`
  field for that). So the footer is purely a cosmetic visible stamp.
  If it is cosmetic, the natural value to show is the **actual
  end-of-turn time** (what a human reading the transcript expects),
  not an arrival-time that lags by however long the turn took.

**Mechanism.** A Stop hook does the following at end-of-turn:

1. Compute the current local time at Stop fire.
2. Format the exact desired footer string (e.g.
   `_Sun 07 JUN 2026, 23:55 BST_`).
3. Inspect the agent's just-completed reply. If the final line equals
   that string (modulo trailing whitespace), let the turn end.
4. If it does not — including the case where there is no footer at
   all, OR the footer is present but stale — return:

   ```json
   {
     "decision": "block",
     "reason": "Append exactly this as the final line of your reply, on its own line, nothing after it:\n\n_Sun 07 JUN 2026, 23:55 BST_"
   }
   ```

   The agent is forced to re-emit the reply with that exact string
   appended. There is nothing to shortcut: the hook literally hands
   over the bytes.

**Why this is strictly better than Option A.**

| | Option A (current rule + presence check) | Option A' (current rule + equality vs `now-file`) | **Option 0 (harness stamps at end-of-turn)** |
|---|---|---|---|
| Footer reflects real end-time | ❌ (arrival-time, lags) | ❌ (still arrival-time) | **✅** |
| Agent has to know the rule exists | ✅ | ✅ | ❌ (irrelevant) |
| Agent has to execute the prescribed mechanism | ✅ (re-run the Bash block) | ✅ | ❌ |
| Defeatable by shortcut (typing a stale string) | ✅ (failure mode B) | ❌ | ❌ |
| Defeatable by drift (not adding any footer) | ✅ (failure mode A) | ❌ (hook blocks) | ❌ |
| Requires changes to `~/.claude/rules/timing-system.md` | None | Sharpen check | **Replace the rule** with "harness stamps end of every turn; agent does nothing" |
| `user-prompt-submit.sh` writing of `/tmp/.claude-now-*` still needed | Yes | Yes | **No** (file can be retired, or kept only for non-footer uses if any exist) |

**Cost to implement.** Small. The Stop hook already exists
(`log-turn-end.sh`). It is already inspecting the reply for footer
presence (it logs `footer_present: false`). Extending it to:

1. Compute the canonical footer string from its own clock,
2. Compare against the reply, and
3. Return `decision: "block"` with the exact required string when
   they don't match,

is on the order of ~30 lines of bash. The corresponding
simplification of `~/.claude/rules/timing-system.md` — deleting the
multi-line Bash block the agent is currently told to paste — is
larger but mostly subtractive.

**What this does NOT solve.** The auto-commit rule (Option B below)
and any other text rule that depends on *agent semantic judgment* (as
opposed to a mechanically-computable fact like the current time)
cannot be moved to "harness stamps it" so easily. For those, Option B
or similar still applies. The general principle Option 0 expresses,
though, is:

> For any rule whose desired output is a mechanically-derivable fact,
> the harness should produce that fact and the agent should not be in
> the loop at all. For rules that genuinely require agent reasoning,
> teeth (Option B-style block) are the next-best.

### Option A — Block on missing footer (smallest patch, biggest visible effect)

Modify `~/.claude/hooks/log-turn-end.sh` (or wrap it) so that when it
detects `footer_present == false`, it returns JSON:

```json
{
  "decision": "block",
  "reason": "Reply did not include the timing-system footer. Append the italic _<weekday DD MON YYYY, HH:MM TZ>_ line, computed from /tmp/.claude-now-<safe-sid> per ~/.claude/rules/timing-system.md."
}
```

The agent will be forced to re-emit the reply with a footer before the
turn can end. Pros: zero changes to the rule text, the hook already
knows about footer presence. Cons: if the now-file is missing or the
agent computes it wrong, the turn could fail to converge — needs a
guard (e.g. only block after the second attempt within a turn; or
include the literal expected footer string in the block reason).

### Option B — Block on uncommitted changes after a "completing" turn

Extend `commit-reminder.sh` (or pair it with a new Stop hook) so that
when the agent attempts to finish a turn AND `git status` shows
uncommitted changes to tracked files AND the turn was "action-shaped"
(any Edit/Write/MultiEdit/Bash mutation observed via the PostToolUse
log), the Stop hook returns `decision: "block"` with a reason like:

> "You modified tracked files this turn but did not commit them.
> Stage and commit, or explicitly tell the user why you're holding the
> change, before ending the turn."

Pros: directly enforces the global commit rule. Cons: requires a
clean definition of "completing turn"; risks blocking legitimate
mid-task pauses where the user explicitly said "don't commit yet"; the
hook must read enough state to decide. The agent should be able to
declare intent (e.g. emit a marker in its response) to bypass when the
user has authorised a pause.

### Option C — Implementer-style review of the timing-system skill itself

Run a structured review of `~/.claude/rules/timing-system.md` and
`~/.claude/plans/timing-system-v1.md` (the spec) against this
diagnosis. Specifically:

- Enumerate every rule.
- For each rule, classify it as **agent-side text** vs **hook-side
  observable**.
- For every agent-side text rule that the spec implies should be
  reliable, decide whether it warrants teeth (Option A / B pattern)
  or whether soft-nudge + log is acceptable.

This is the same shape as the `implementation-review` agent the user
has in their skill list, applied to the rule layer itself. Output is a
prioritised list of which rules need enforcement and which don't.

### Option D — Accept the drift, optimise for repair

The alternative philosophy: don't try to enforce. Instead, make
violations cheap to detect and cheap to repair. The current logging
hook already does this for the footer (`footer_present:false` in the
log). A small post-session report that says "you violated rules X, Y,
Z N times this session" is enough for the user to retrain their own
prompting / intervention habits. No friction, no loops, but it doesn't
solve the original complaint.

## 8. What the user should NOT spend time on

These all sound like they might help and won't:

- **Rewriting the rule prose** to be more emphatic. Bigger words don't
  bind tighter on a probabilistic system.
- **Moving the rule between CLAUDE.md and a rules file.** See §4.5 —
  both end up identically in context.
- **Adding the rule to a skill.** Skills are loaded on demand and
  still compete for attention exactly like CLAUDE.md text.
- **Capitalising or bolding "MUST".** Same category. Treat it like
  shouting at a function: cathartic, not effective.

## 9. Open questions for whoever picks this up

1. Is hard enforcement (Option A / B) acceptable as a session default,
   or should it be gated behind a per-project opt-in?
2. For the commit rule specifically: what counts as a "completing
   turn"? How does the agent declare a sanctioned pause (e.g. the user
   said "hold this")?
3. Should the block reason include a literal copy of the desired
   output (e.g. the exact footer string), to reduce convergence
   failures?
4. How many retries should a Stop-hook block allow before falling
   through to a logged miss (to avoid infinite loops)?
5. Are there other agent-side rules in CLAUDE.md / rules files /
   skills that the user expects to be enforced and isn't yet
   complaining about because nobody has noticed the misses? (The
   implementer-review in Option C would surface these.)

## 10. Evidence appendix

Captured 2026-06-07 ~23:33 BST, session id
`e159c6fd-3ca4-4d31-9c74-43be475ccb73`.

### 10.1 Last `turn_end` event before diagnosis

```json
{
  "kind": "turn_end",
  "schema_version": 1,
  "t": "2026-06-07T23:30:51+01:00",
  "session_id": "e159c6fd-3ca4-4d31-9c74-43be475ccb73",
  "project": "final-exp-654a2a32",
  "plan_id": null,
  "chapter": null,
  "agent_kind": "main",
  "footer_present": false
}
```

The hook saw the missing footer and logged it. Nothing else happened.

### 10.2 Session-start markers (all written by hooks, all present, none consumed by the agent)

```
/tmp/.claude-session-intent-e159c6fd-...   (13 bytes, contained "prompt-fresh\n")
/tmp/.claude-first-reply-pending-e159c6fd- (0 bytes; existence is the signal)
/tmp/.claude-now-e159c6fd-...              (27 bytes; "Sun 07 JUN 2026, 23:31 BST")
/tmp/.claude-bash-presnap-e159c6fd-...     (many, from snapshot-bash-pre.sh on every Bash call)
```

### 10.3 Hook battery from `~/.claude/settings.json`

(excerpted)

```
Stop:          commit-reminder.sh, log-turn-end.sh
SubagentStop:  log-turn-end.sh
SessionStart:  check-claude-version.sh, session-start.sh
UserPromptSubmit: user-prompt-submit.sh
PreToolUse (Bash):  snapshot-bash-pre.sh, block-destructive-git.sh
PostToolUse (Bash): show-commit-hash.sh, log-tracked-files.sh,
                    log-bash-edits.sh, log-commit-events.sh
PostToolUse (Edit|MultiEdit|Write|NotebookEdit):
                    log-session-edits.sh, log-tracked-files.sh
```

All scripts present and executable in `~/.claude/hooks/`.

---

## 11. One-line summary

The harness has two enforcement primitives with teeth (PreToolUse exit
2; Stop `decision:"block"`). Every other rule layer — CLAUDE.md, rules
files, skills, logged hook output — is influence-only and decays under
long-context attention pressure. Until a rule is wired through one of
the two teeth-bearing primitives, the agent can (and statistically
will) ignore it, and the harness will only log that it did.
