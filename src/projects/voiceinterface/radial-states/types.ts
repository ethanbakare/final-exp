/**
 * Shared types for the radial-states module.
 *
 * `RadialState` lives here (not in api.ts or the animator hook) so api.ts
 * and useLinkedRadialAnimator.ts can both import it without a circular
 * dependency. See plan §6.5 — Reviewer R3 P2.1.
 */

export type RadialState = 'idle' | 'listening' | 'thinking' | 'talking';
