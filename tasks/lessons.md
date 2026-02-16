# Lessons

## 2026-02-16

### 1) Keep fixes scoped to the exact requested delta
- `mistake`: Changed Section 16 header structure/behavior instead of only applying color changes.
- `root_cause`: Implemented a custom visibility/spacing override rather than reusing existing section pattern.
- `rule`: For style tweaks, mirror the existing section structure first; only change the requested property.
- `prevention_check`: Compare target section JSX/CSS against the reference section before patching.

### 2) Verify class interactions before introducing new utility classes
- `mistake`: Used classes that conflicted with existing hidden divider behavior.
- `root_cause`: Did not validate interaction with existing `.eldugo-divider-orange` default rules early enough.
- `rule`: Before introducing utility classes, inspect all base selectors affecting the same element/class combination.
- `prevention_check`: Run `rg` for all selectors touching the element and confirm computed behavior path.

### 3) Trigger rule for this file
- Add a lesson entry immediately after any explicit user correction or when verification shows a regression caused by my change.
