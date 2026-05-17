---
name: implementation-fidelity-review
description: Post-implementation, post-code-review interrogation that asks whether an implemented plan FAITHFULLY and SOUNDLY realizes the plan's intent — including at the points the plan left to the implementer's judgement — without introducing failures that don't announce themselves (emergent / latent / silent / at-scale). Use AFTER code review has passed (local correctness/style done) and BEFORE the work is called done — when the user says "the plan is implemented", "does this match what we intended", "is this safe to ship", "it works but feels off", "it broke and we don't know why", "it only breaks when several things happen at once", or after any plan whose decisions were partly interpreted by the implementer. NOT plan-review (that runs pre-code, on intent-as-written). NOT code-review (that runs on the diff, for line correctness/style). This runs on (plan-intent + the realized implementation) and hunts Mandelbugs, latent faults, accidental complexity, and silent-failure surfaces. Copy-then-diverge is ONE site type among four. Outputs a per-site findings list naming the intent each site realizes-or-betrays and the invisible failure each risks.
---

# Implementation Fidelity & Emergent-Failure Review

A scalpel for the unguarded zone between "the plan was sound" and "the code is locally correct." Code-review proves the lines are right. Plan-review proved the intent was right. Neither proves the **realized structure faithfully carries the intent** or that it **won't fail in a way that doesn't announce itself.** That gap is where the expensive bugs live: the ones that work "in quotes," the ones that need three things to co-occur, the ones you only find by adding console logs.

It is narrow on a different axis than code-review. Code-review reads the whole diff for correctness/style. This reads only the **decision/approach/composition surface** for *fidelity to intent* and *invisible-failure risk*. If you are checking whether the lines are correct, you are using the wrong tool.

## Why this exists (the lesson it encodes)

A detailed plan still leaves the implementer judgement calls — which structure, which algorithm, which abstraction, how to compose with what's already there, how to handle the parts the plan was silent on. Each call can be **locally correct and pass code-review** while:

- **betraying the intent** the plan actually had (the implemented behavior, not the intended one, silently becomes the contract — Hyrum's Law on the spec gap);
- **being structurally unsound** — correct but pessimal: re-doing work in a loop that dies at the real workload (Schlemiel / accidentally-quadratic), a leaky abstraction, accidental complexity;
- **composing into an emergent latent fault** — N individually-fine parts whose holes line up only under co-occurrence/timing/scale (Reason's Swiss Cheese; Perrow's Normal Accidents; a Mandelbug, not a Bohrbug);
- **failing silently** — a fault and error with no observable failure, so it ships and is later found only by instrumentation.

Plan-review can't see these (no code yet; can't simulate dynamics). Code-review walks past them (locally each line is fine). This skill is the guard for exactly that zone, and its hunting target is the **Mandelbug**, not the Bohrbug.

## Mindset

- **Reads the implementation as a realization of an intent, not as text.** The question is never "is this line right" — it is "does this *choice* carry what the plan meant, at the workload and conditions it will actually meet?"
- **Treats 'it works' as 'it works in quotes' until proven at scale and under co-occurrence.** Correct-on-the-happy-path is the *start* of the review, not the end.
- **Assumes the dangerous failure is dynamic, emergent, and quiet.** The static code can be flawless and the system still broken because of how parts compose when something else fires, or how the chosen shape behaves at volume.
- **Treats a silent-failure surface as a defect in itself** — independent of whether it is currently wrong. A path that can be wrong without surfacing is a finding.
- **Chesterton's Fence on the existing system.** Where the implementation joins what's already there, the existing thing works for reasons that may be unwritten; make them explicit before judging the join.
- **Narrow on purpose; refuses out-of-lane work.** Line correctness and style are code-review's; intent-as-written is plan-review's. Saying so is part of doing this well.

## When to run

Trigger after **code-review has passed** and before the work is declared done, when any of these hold:

- A plan/spec/handoff was implemented and you want to confirm the *realized* implementation matches the *intended* one — especially where the plan delegated decisions.
- The change picked a non-obvious **structure / algorithm / abstraction / data shape**, or composes with an existing system (a shared file/store/singleton, a cache, a lifecycle, a tooling/build system).
- A bug is **hard to reproduce, needs several conditions at once, doesn't fail loudly, or "works but feels off."**
- A change is a **port / parallel-arm / mirror-and-adapt** (the copy-then-diverge sub-case).

Do **not** run for:

- Plan / spec review before code exists → `plan-review`.
- Whole-diff correctness, logic bugs, style → code-review.
- Code with no plan to be faithful to and no scale/composition surface (nothing to interrogate for fidelity or emergence).

## The four site types (where to look)

The unit of review is a **site** — a point where the implementer exercised judgement or joined a system. Enumerate sites of these four kinds; ignore the rest of the diff.

1. **Interpretation sites.** Anywhere the plan under-specified and the implementer decided. *Copy-then-diverge is the sub-case where the "decision" was "adapt pattern X here."* The general case is any silent decision the plan didn't pin.
2. **Approach / soundness sites.** The chosen structure, algorithm, control flow, data shape, abstraction. Interrogate for Big-O *at the real workload*, accidental complexity, leaky abstraction, premature pessimization.
3. **Composition / emergence sites.** Where this change stacks on parts that are each fine alone — shared artifact gains a writer/reader/role; an effect-cleanup meets a singleton; a key-change remounts a resource owner; a cache key is reused; a runtime/build/tooling system is now in the loop. Hunt the Swiss-Cheese alignment.
4. **Observability sites.** Paths that can be in a fault/error state with **no observable failure** (no throw, no broken UI, a value silently zeroed/defaulted). The surface itself is the finding.

## The central move — fidelity-and-failure interrogation

For every site, run this loop. (Same disciplined-per-item skeleton as plan-review's five-step pattern; the *object* is "a realized decision," not "a critique.")

1. **Recover the intent.** What did the plan mean here? If the plan was silent, what *must* be true for the surrounding intent to hold? State it in one declarative sentence. If you can't, you don't yet understand what faithful would mean — keep reading (the plan, the siblings, the system) until you can.
2. **Name the actual choice — structurally.** Not "it calls X" but "it is shaped as: a loop that re-scans per call / a build-time import of a runtime-mutable file / a fourth writer to this store / a path that swallows the empty case." Structure, not surface.
3. **Find the betrayal or the invisible failure.** Ask, in order: does the choice realize the sentence from step 1? At the *real* workload (volume, frequency, data size) — Big-O it. Under *co-occurrence* — what 2–4 conditions, if simultaneous, line the holes up? *Silently* — can it be wrong with nothing observable? Trace it; "handles gracefully / should be fine / basically the same" is not an answer.
4. **Reproduce-in-the-mind (Mandelbug pre-mortem).** State the exact combination of inputs/timing/scale that triggers it. If you can name the combination, it's a finding even if no test hits it today. If you cannot rule the combination out statically, it's an escalation, not a pass.
5. **Classify.** Faithful & sound (state the proof) · Betrays intent · Unsound at workload (give the cliff) · Emergent latent (give the co-occurring conditions + blast radius) · Silent-failure surface · Unprovable-from-static (name the dynamic check needed — prod-build smoke, load test, interaction test).

Triage tell: any decision defended only by *"it works,"* *"it's basically the same,"* *"DRY,"* *"should behave identically,"* or *"that case won't happen"* is an unverified fidelity/robustness claim. Make it verified or mark it open.

## The four lenses

Every finding descends from one; naming it tells the reader *why it is dangerous*, not just *what*.

- **Lens F — Fidelity.** The realized behavior diverges from the intended one, including at under-specified decision points. (Copy-then-diverge breaking an unwritten invariant is the canonical instance — but so is any interpretation that quietly redefined the contract.)
- **Lens S — Soundness of approach.** Correct but structurally wrong for the real workload: accidentally-quadratic, leaky abstraction, accidental complexity, premature pessimization.
- **Lens E — Emergence.** Individually-correct parts compose into a latent fault that needs co-occurrence/timing/scale to surface (Swiss Cheese / Normal Accidents / Mandelbug). This is the lens code-review and plan-review both miss.
- **Lens O — Observability.** It can be wrong without failing loudly; the only way it's found today is instrumentation. The silent surface is the defect.

## Process

Start from intent and the decision surface — not an end-to-end read (that drifts into code-review).

1. **Get the intent.** Read the plan/handoff sections that govern this work. Extract what was specified and, explicitly, **what was left to the implementer.**
2. **Enumerate the four site types.** Usually 1–8 sites total, not the whole diff. The under-specified plan points and the system-join points are the richest.
3. **Run the fidelity-and-failure interrogation** on each site.
4. **Run the checklist** (below) literally at every site.
5. **Dynamic pre-mortem (Klein/FMEA flavor).** "This shipped. It breaks: only at scale / only when N things co-occur / only in prod not dev / never loudly. Which site, which combination?" Name the combination; if static reasoning can't exclude it, it's an Unprovable-from-static finding with a named dynamic check.
6. **Output** the per-site findings list.

## The checklist (apply literally at every site)

**Fidelity / interpretation**
- Did the plan under-specify here? What did the implementer decide, and does that decision become a contract others now depend on (Hyrum)?
- Mirror/port/parallel-arm: state, in one sentence, the invariant every sibling upholds. Does this site still uphold it? If no comment explains the difference, that's a finding.

**Soundness at workload**
- Big-O this path **at the stated/likely workload** (not n=3). Is there a loop that re-does work per call (Schlemiel)? Repeated linear scan that should be a map/index? Allocation per frame/request?
- Is the abstraction leaking (callers must know its internals to use it safely)? Is this accidental complexity the problem didn't require?

**Emergence / composition**
- Does a runtime-mutable artifact enter a build/module graph or watcher? (Write → rebuild/HMR in dev; frozen-stale in prod.)
- Does an effect/cleanup/unmount tear down a process-wide singleton (audio ctx, socket, worker, observer, timer)? What routine action can trigger that unmount?
- Did a `key=`, conditional render, or parent gate get tied to something a routine action changes? (Remount tears down owned resources.)
- New writer/reader/role on a shared store/file/cache/schema — is the precedence/format/merge rule written?
- Default/fallback/seed derived from the live thing it backs up? (Not a fallback — an alias that drifts or rebuilds.)
- Behavior dependent on a dev-only mechanism (Fast-Refresh, double-invoke, source maps)? Then dev ≠ prod — must be checked against a production build.

**Observability**
- Can this path be wrong and produce no throw, no error, no visibly broken output (value silently defaulted/zeroed/null-coalesced; catch that swallows; early-return on a "shouldn't happen")? If yes: silent-failure surface — finding regardless of current correctness.

Any "yes" with an unwritten rule, an un-traced edge, or a dev-only check is a finding; severity = blast radius × invisibility.

## Worked examples (teach from all three — they span the lenses)

**1 — Emergence + Fidelity (the canonical port bug).** Circle Voice mirrored Radial; the plan said "the seed JSON doubles as the in-code fallback." Siblings' unwritten invariant (one sentence): *a fallback is a standalone code constant, never a reference to a runtime-mutable file.* Implementer's structural choice: `import seed from './circle-waveform-voicesets.json'` — but that file is the **live store the app rewrites on every Save.** Composition: live file → bundled module → dev watcher → Fast-Refresh → editor remount → effect-cleanup `audioService.stop()` → mic dead. Lens F (broke the sibling invariant) + Lens E (needed editor-mounted **and** mic-on **and** a save to align — a Mandelbug) + dev-only (prod symptom differs: stale fallback). Every prior gate missed it for structural reasons; step 1's one-sentence invariant makes it indefensible on sight.

**2 — Soundness (works in quotes).** A handler the plan said should "update the list" was implemented as a re-scan of the whole collection inside a per-event callback. Correct at n=10. At the real workload (≥1000 events/min over a growing list) it's accidentally-quadratic and stalls — *no test failed; the approach is the defect.* Lens S. The fidelity question ("does 'update the list' intend an O(n) re-scan per event?") + the workload Big-O surface it; code-review passed it because every line is correct.

**3 — Observability + Emergence (silent + co-occurrence).** An audio frame read through `ref.current.frequencyData ?? null`; when a gated value resolved to a shared `SILENT` constant, the consumer latched on it and never recovered — no throw, ambient animation kept running, so it "looked alive." Found only by a probe. Lens O (no observable failure) + Lens E (needed the gate to rest on the shared constant — a specific co-occurrence). The fix is decoupling; the *review* finding is "this path can be silently wrong and only instrumentation reveals it."

These are the bar for a complete interrogation: intent in one sentence → the structural choice → the workload/co-occurrence/silence that breaks it → blast radius → why it hid from the other gates.

## Output format

```
## Implementation Fidelity & Emergent-Failure Review — <change / scope>

### Intent & what was left open
- What the plan specified; what it delegated to the implementer (the richest sites).

### Sites interrogated
1. **[Lens F/S/E/O] <site>** — intended (one sentence) → actual structural choice → faithful&sound (proof) | betrays intent | unsound at workload (the cliff) | emergent latent (the co-occurring conditions + blast radius) | silent-failure surface | unprovable-static (the dynamic check). (file:line)

### Verdict
- SAFE / FIX REQUIRED / NEEDS DYNAMIC CHECK (name it: prod-build smoke, load test, interaction test).

### Out-of-lane (handed off, not judged here)
- Line correctness/style → code-review. Intent-as-written → plan-review.
```

Rules: lens label mandatory. State intents/invariants as single declarative sentences — if you can't, you haven't found what faithful means. Big-O is stated at the real workload, never n=3. Severity = blast radius × invisibility (a silent multi-condition fault outranks a loud single one). No theatre; direct, technical, calm. "It works / DRY / basically the same / won't happen" keeps a site open until proven.

## Boundaries — name your neighbours

- **Before you:** plan-review (intent-as-written, pre-code). If the *plan itself* sanctioned the unsound choice, that's a plan-review gap — note it, don't fix it here.
- **Beside you:** code-review (whole-diff line correctness/style). Refuse it explicitly; breadth here destroys leverage.
- **After you:** the production-build interaction/load smoke (`build && start`, run the routine action at volume / with conditions co-occurring). This skill *names* the dynamic check; the smoke *runs* it. Dev-only and at-scale findings are not closed until the smoke confirms.

## Philosophical floor (the established practice this rests on)

Replaces a project rule being enshrined as a universal. Load the relevant few; don't recite all.

- **Jim Gray — Bohrbug vs Mandelbug.** The hunting target is the Mandelbug (timing/co-occurrence/environment), not the reproducible Bohrbug code-review already catches.
- **James Reason — Swiss Cheese / latent conditions.** Individually-harmless holes; failure only when they align. The model for emergent latent faults.
- **Charles Perrow — *Normal Accidents*.** Interactive complexity + tight coupling → multi-cause, hard-to-predict failure by nature.
- **Nancy Leveson — STAMP/STPA.** Accidents from unsafe *interactions among correct components*, not component failure.
- **Avizienis/Laprie — fault → error → failure.** Vocabulary for "wrong internally, nothing observable." Names the Observability lens.
- **Spolsky — Schlemiel the Painter / Law of Leaky Abstractions; "accidentally quadratic."** The canonical "passes review, dies at scale" + leaking abstraction.
- **Sutter & Alexandrescu — premature pessimization.** The dual of premature optimization: don't choose the pessimal default shape.
- **Fred Brooks — accidental vs essential complexity.** Is this complexity the problem's, or the approach's?
- **Hyrum's Law + the specification gap.** Wherever the plan was silent, the implementation's interpretation silently became the contract.
- **Snowden — Cynefin (complex domain).** Cause/effect only clear in retrospect; linear (complicated-domain) review can't see complex-domain emergence — *why this skill is separate, not a bigger plan-review.*
- **Klein — pre-mortem; FMEA/FTA.** The proactive form of debugging; this skill is debugging before the bug exists.
- **Kernighan's Law.** "Debugging is twice as hard as writing the code." The skill's ROI is the shift-left.
- **Chesterton's Fence.** Don't judge a join to an existing system before making its unwritten reasons explicit.

If a finding here contradicts a published standard (RFC, security, accessibility), surface the conflict; don't enforce a project habit as a universal.

## Self-checks before returning

- Did I start from plan-intent + the decision/system-join surface — not an end-to-end correctness read? (If the latter, I drifted into code-review.)
- For each site: one declarative sentence of intended behavior *before* judging the implementation?
- Did I Big-O the approach at the **real workload**, not n=3?
- For each composition site: did I name the exact 2–4 co-occurring conditions, or admit I couldn't and escalate to a dynamic check?
- Did I flag silent-failure surfaces even where nothing is currently wrong?
- Is severity blast-radius × invisibility — did the loud-but-trivial outrank the quiet-but-systemic by mistake?
- Did I refuse out-of-lane work and route it (plan-review / code-review / prod-smoke)?
```
