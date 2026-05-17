---
name: divergence-seam-review
description: Pre-merge interrogation of a code change that COPIED-AND-ADAPTED an existing pattern, added a new consumer/writer/role to a shared artifact, or wired into a runtime/tooling system. Use AFTER the implementer's own gate passes but BEFORE merge/sign-off — when the user says "I mirrored X and adapted it", "this is the parallel arm of Y", "ported from Z", "added another writer to <file/store>", "is this safe to merge", "did the divergence break anything", or after any change whose plan said "mirror X, adapt Y". NOT plan review (that runs pre-code, on intent). NOT generic code review (that runs on the whole diff, for correctness/style). This runs on (reference + diff + plan-as-contract), and only on the deltas where implementation departed from its reference or gave a shared thing a new role. Outputs a per-divergence-site findings list naming the unwritten invariant each site puts at risk.
---

# Divergence & Seam Review

A scalpel, not a sweep. It exists to catch the one bug class plan-review structurally cannot see and generic code-review reliably walks past: **a copied pattern that was adapted at one point, silently breaking an invariant the original was quietly upholding** — and its sibling, **a shared artifact that gained a new role/consumer/writer without anyone re-deriving its contract.**

It is deliberately narrow. Its power is focus. If you find yourself reviewing the whole diff for correctness, you are using the wrong tool — stop and use code-review.

## Why this exists (the lesson it encodes)

Plan-review reasons about *intent as written* and runs *before code exists*. It cannot evaluate an adaptation that hasn't been made yet, and it cannot simulate dynamic cross-tool behavior (a bundler watching an imported module, effect-cleanup ordering, a process-wide singleton, HMR, caches, schedulers). Generic code-review reads the whole diff for local correctness and will pass `import data from './x.json'` unless the reviewer happens to know `x.json` is runtime-mutable *and* knows the bundler's watch semantics.

Between "the plan was sound" and "the code is locally correct" sits the unguarded zone where copy-then-diverge bugs are born. This skill is the guard for that zone. Its input is not a document and not the whole diff — it is **the reference, the divergence, and the contract the reference silently carried.**

## Mindset

- **Treats the reference as a fence (Chesterton).** The pattern being copied works for reasons that may be unwritten. The job is to make those reasons explicit *before* judging whether the adaptation preserves them — never "the divergence looks fine," always "here is what the original guaranteed; here is whether the change still guarantees it."
- **Treats the implementation as a hypothesis against the reference as the spec.** Symbol existence ≠ behavioral equivalence. A prop named the same, a function shaped the same, a file in the same place — none of these prove the invariant survived.
- **Assumes the dangerous bug is dynamic, not static.** The static diff can be flawless and the system still broken because of how parts compose at runtime/build time. Always ask what *system* the change now touches that it didn't before.
- **Narrow on purpose.** Refuses out-of-lane work. Generic correctness, style, and intent are explicitly someone else's job; saying so is part of doing this job well.

## When to run

Trigger on these *change shapes* (not document types):

- A change whose plan/handoff said **"mirror X / parallel-arm of X / port of X, adapt Y"** — the adaptation `Y` is the review target.
- A change that adds a **new consumer, writer, reader, or role to a shared artifact** (a file, a store, a singleton, a JSON the app writes, a context, a cache key, a schema).
- A change that **wires into a runtime/tooling system** whose behavior is not universally internalized: bundler/module-graph, dev HMR/Fast-Refresh, effect mount/cleanup ordering, a process-wide singleton's lifecycle, a cache layer, a scheduler, hydration.
- **Pre-merge, after the implementer's own gate (tsc/tests) passes** — early enough to fix cheaply, late enough that the divergence is concrete and interrogable.

Do **not** run for:

- Plan / spec / handoff review before code exists → `plan-review`.
- General correctness, logic, or style review of a diff → code-review.
- Greenfield code with no reference pattern and no shared-artifact touch (no divergence to interrogate).

## The central move — the divergence interrogation

For every divergence site and every role-accretion site, run this five-step loop. This is the analog of plan-review's five-step critique pattern; the unit here is *invariant preservation across a copy/role boundary*, not validity of a critique.

1. **Name the reference precisely.** What exact pattern was copied? Locate its canonical instances (`grep`/`Read` — not memory). If there are siblings (Coral/Tube/Radial), enumerate them; siblings that all do the same thing are encoding an invariant.
2. **Surface the unwritten invariant.** Ask: *what is true of every sibling that nobody wrote down, and why does the pattern depend on it?* Force it into one sentence. If you cannot state it, you have not understood the fence — keep reading the siblings until you can.
3. **Locate the exact divergence.** Where does this implementation do something no sibling does? Diff it against the nearest sibling line-for-line at that point. The bug is almost never in the copied part; it is in the one place it stopped being a copy.
4. **Test the invariant against the divergence — dynamically.** Does the adaptation still satisfy the sentence from step 2, *including under the runtime/tooling system the change now touches*? Run the seam checklist below. "It compiles / it looks parallel" is not an answer; trace what the system *does* with the change.
5. **Classify.** Preserved (state the proof) · Broken (state the failing input/condition and the blast radius) · Unprovable-from-static (escalate: it needs a dynamic check — name which, e.g., a prod-build smoke).

The triage tell, mirroring plan-review's "usually/typically": any divergence justified by *"it's basically the same as X"*, *"just adapted for context"*, *"DRY — reuse the source"*, or *"should behave identically"* is an unverified invariant claim. Make it verified or mark it open.

## The three lenses

Every finding descends from one. Naming the lens tells the reader *why it is dangerous*, not just *what changed*.

### Lens I — Invariant preservation (copy boundary)
The copied pattern upheld something implicit; the adaptation may not. Tell: N siblings do it one way, this does it another, and no comment explains why the difference is safe. *Worked example below — the canonical instance.*

### Lens II — Role accretion (shared artifact)
A file/store/singleton/schema/cache that already had roles gains another (new writer, new reader, new consumer, a build-time *import* of a runtime artifact). Tell: the same thing is now shaped by one more part, and the composition rule between the old roles and the new one is unwritten. **A new role for a shared artifact is a mandatory trigger to re-run the project seam-audit** (if one exists) — not because seam-audits are written once, but because they must be re-run whenever an artifact's role-set changes.

### Lens III — Dynamic coupling (runtime/tooling)
The change couples into a system whose behavior nobody internalized: module graph ↔ dev watcher ↔ Fast-Refresh ↔ React effect-cleanup ↔ a singleton ↔ a cache ↔ hydration ↔ a scheduler. Tell: the static code is correct and the failure is purely in *how it composes when something else fires*. This is the lens plan-review and code-review both miss; it is the reason this skill is dynamic-first.

## Process

Inverted relative to plan-review: do **not** read the whole change end-to-end. Start from the deltas.

1. **Get the contract.** Read the plan/handoff section that told the implementer what to mirror/adapt. Extract the literal instruction ("mirror radial, adapt the fallback").
2. **Enumerate divergence sites.** Diff the implementation against its nearest sibling(s). List every point where it stopped being a copy. This is the work list — usually 1–5 sites, not the whole diff.
3. **Enumerate role-accretion sites.** For every shared artifact the change touches, ask: did it gain a writer/reader/consumer/import it didn't have? Each is a site.
4. **Run the divergence interrogation** (the five steps) on each site.
5. **Run the seam checklist** (below) on each site, hard.
6. **Pre-mortem, dynamic flavor.** "This shipped. It breaks in production, or only in dev, or only after the 50th save, or only when two of these fire together. Which site, which co-occurring condition?" Name the condition; if a static read can't rule it out, that's an Unprovable-from-static finding with a named dynamic check.
7. **Output** the per-site findings list.

## The seam checklist (the concrete edge — apply at every site)

Plan-review can't carry a checklist this concrete because it runs pre-code. This skill can and must, because it has the diff. At each divergence/role site, ask literally:

- **Mutable-artifact import.** Does this change `import`/bundle a file (or value) that the application writes at runtime? → The bundler now watches it; every write is a rebuild/Fast-Refresh in dev and a frozen-stale snapshot in prod. *(Canonical bug. See worked example.)*
- **Effect cleanup × singleton.** Does an unmount/cleanup path tear down a process-wide singleton (audio context, socket, worker, observer, timer)? What unmounts that subtree, and can a *routine* user action (save, navigate, HMR) trigger that unmount?
- **Key-driven remount.** Did a `key=` (or conditional render, or parent gate that can return null/skeleton) get tied to something that changes on a routine action? Remount tears down everything the subtree owns.
- **New writer to a shared store/file.** Two+ writers now. Is the precedence/merge/format rule written? Does the new writer's on-disk shape stay readable by the existing reader?
- **Default/fallback sourced from live data.** Is a "fallback/seed/default" derived from the same artifact it's meant to back up? Then it isn't a fallback — it's an alias that drifts (prod) or rebuilds (dev). Fallbacks must be decoupled constants.
- **Cache/identity key reuse.** Does the change reuse a cache key, memo dep, or composite id across a new dimension where collisions or false-hits are now possible?
- **Dev-vs-prod divergence.** Does the behavior depend on a dev-only mechanism (Fast-Refresh, source maps, double-invoke)? Then it *must* be checked against a production build — the dev symptom and the prod symptom differ. Recommend the prod-build smoke as the backstop; do not declare safe on a dev-only check.

If any answer is "yes" and the composition rule is unwritten: that is a finding, severity by blast radius.

## Canonical worked example (teach from this)

**Context.** Circle Voice was ported by mirroring Radial ("one file, two consumers; flat on-disk; fallback when empty"). Coral/Tube/Radial all source their fallback from a **code constant**. The plan said: "ship the seed JSON; *it doubles as the in-code CIRCLE_FALLBACK source.*"

- **Lens I.** Siblings' invariant (unwritten): *a fallback is a standalone code constant, never a reference to a runtime-mutable file.* Stated in one sentence — that's step 2 done.
- **Lens II / III.** The adaptation: `import seed from './circle-waveform-voicesets.json'`. That JSON is the **live store the app rewrites on every Save**. New role: the live data file became a **bundled module**. Composition rule with the bundler/HMR: unwritten.
- **Seam checklist hit:** *Mutable-artifact import = yes.* Consequence: every Save → file write → dev watcher → Fast-Refresh → `RealtimeStatesEditor` remount → its effect-cleanup `audioService.stop()` → AudioContext closed → mic dead. Dev-only symptom; in prod the same import is a frozen-stale fallback. Circle-only because only circle diverged from the constant-fallback invariant.
- **What every prior gate missed and why:** plan-review (pre-code, can't see the import or simulate HMR), code-review (would pass a JSON import), and the implementer's own verification (blocked writes / fresh sessions / git-restore — structurally never combined live-session + real persist + dev-HMR). This skill catches it at step 2: the one-sentence invariant ("fallbacks are decoupled constants") makes the divergence indefensible on sight.

Use this as the reference for what a complete interrogation looks like: reference → one-sentence invariant → exact divergence → dynamic consequence → blast radius → why it hid.

## Output format

```
## Divergence & Seam Review — <change / scope>

### Reference & contract
- What was mirrored, the literal plan instruction, the sibling instances checked (file:line).

### Sites interrogated
1. **[Lens I/II/III] <site>** — reference invariant (one sentence) → the divergence → invariant preserved? proof, OR broken: failing condition + blast radius, OR unprovable-static: the dynamic check needed. (file:line)

### Verdict
- SAFE TO MERGE / FIX REQUIRED / NEEDS DYNAMIC CHECK (name it: prod-build smoke, interaction test).

### Out-of-lane (handed off, not reviewed here)
- Correctness/style → code-review. Intent/architecture → plan-review.
```

Rules: lens label mandatory on every finding. Cite the sibling you diffed against, not just the changed file. State invariants as single declarative sentences — if you can't, you didn't find the fence. Severity = blast radius of the broken invariant, not surface size. No theatre; direct, technical, calm. If a divergence is justified only by "basically the same / DRY / should behave identically," it is an open finding until proven.

## Boundaries — name your neighbours

- **Before you:** plan-review. If the *plan itself* told the implementer to do the dangerous thing, that's a plan-review gap — note it, don't fix it here.
- **After you:** the production-build interaction smoke (`build && start`, run the routine user action that writes data). This skill *names* the dynamic check; the smoke *runs* it. Dev-only findings are not closed until the smoke confirms prod behavior.
- **Not you:** code-review (whole-diff correctness/style). Refuse it explicitly; breadth here destroys leverage.

## Self-checks before returning

- Did I start from the deltas, not an end-to-end read? (If I read everything, I drifted toward code-review.)
- For each site: did I state the reference invariant as ONE declarative sentence before judging the divergence?
- Did I `grep`/`Read` the sibling instances, or trust the change's claim of parity?
- Did I run the seam checklist literally at every site, including the mutable-artifact-import and dev-vs-prod lines?
- Did I name a concrete dynamic check for anything I couldn't settle statically — or did I hand-wave "looks fine"?
- Is every finding's severity the blast radius of a broken invariant, not the size of the diff?
- Did I refuse out-of-lane work and say where it goes?
```
