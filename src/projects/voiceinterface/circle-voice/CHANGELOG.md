# Circle Voice — CSW-010 port CHANGELOG

Provenance for the otherexp → Final-EXP transplant (plan §14). Final-EXP is
the active home post-port; otherexp is the playground. Runtime divergence
signal = each bundle's `lastModified` (no `portVersion` JSON field — doc-only).

- **CSW-010 port v1 — 2026-05-17 — P1 (standalone page) complete.**
  P0 re-verified in otherexp (tsc clean; commits fba31bb/3c4d69a/a9f9d34;
  seed JSON unmutated; orb+editor+nav render; idle→talking→thinking→idle
  animate & settle; geometry parity to the handoff's expected wave-frozen
  numbers). Pre-flight clean (no three/@react-three; audioService
  byte-identical; lucide icons present in 0.486). Ported 5 verbatim units +
  circleWaveformControls; adapted circleVoice.ts (R2 no loose seeder, R3
  whole-array only, R7 extended integrity, §6 collision-checked 20-name
  pool); shipped seed voiceset + registered variant; added api.ts; page
  shell with R-11 (no standalone live-pin affordance). P1 gate PASS:
  render+animate, R-11 absence, edit→Update→reload persist, already-pinned
  preserved after standalone Update, Save-As pinned:false, 2-bundle, clash
  test (radial-states/realtime-state/realtime-coral byte-unchanged), tsc
  clean. Verified via Playwright + Chrome on the Final-EXP dev server.
