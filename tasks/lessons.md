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

### 4) Distinguish margin vs padding in spacing requests
- `mistake`: Implemented vertical spacing as container padding when the requested behavior was margin-based spacing between grouped containers.
- `root_cause`: I mapped numeric spacing values to the wrong box model property.
- `rule`: When spacing is described as distance between blocks/groups, default to `margin`; use `padding` only for internal inset spacing.
- `prevention_check`: Confirm expected visual outcome by asking “does this spacing move the element itself or its content?” before patching.

### 5) Avoid fragile pseudo-class targeting when sibling structure is mixed
- `mistake`: Used `.eldugo-variations-container:first-of-type` to target the first variations container, but a preceding header `div` made that selector unreliable.
- `root_cause`: Relied on element-type pseudo-class instead of explicit semantic hooks in JSX.
- `rule`: For first/second-specific styling in mixed sibling trees, add explicit classes in JSX instead of using `:first-of-type`.
- `prevention_check`: Verify selector match against actual DOM sibling types before shipping.

### 6) Confirm scaling behavior semantics before coding image responsiveness
- `mistake`: Assumed Section 12 strip should behave like fluid images, but requirement was fixed-size-with-crop on viewport shrink.
- `root_cause`: Mapped "responsive" to automatic downscaling instead of preserving intrinsic/threshold size.
- `rule`: For hero/strip assets, explicitly decide between `scale`, `contain`, or `crop` behavior and implement that model directly.
- `prevention_check`: If user says "should not scale down", use `min-width` + centered crop (`overflow: hidden`) rather than fluid width-only behavior.

### 7) Apply reversions narrowly to the requested scope
- `mistake`: Added a mobile strip-width override that conflicted with the fixed-size crop behavior.
- `root_cause`: Follow-up tweak was applied without preserving the established scaling model.
- `rule`: When asked to adjust one property, do not introduce overrides that alter core behavior unless explicitly requested.
- `prevention_check`: Before patching, list which existing behavior must remain unchanged and validate the diff against that list.

### 8) Distinguish intrinsic-size percentages from viewport percentages
- `mistake`: Interpreted "80%" as viewport-relative width override instead of intrinsic-size reduction.
- `root_cause`: Ambiguity between percentage-based layout sizing and fixed-asset scaling intent.
- `rule`: For "smaller but still cropped" image requests, adjust fixed `min-width` threshold (intrinsic scale), not `width: %` of viewport.
- `prevention_check`: Validate that cropping behavior remains unchanged and only rendered asset scale shifts.

### 9) Validate effective spacing as sum of parent and child paddings
- `mistake`: Left large combined top spacing in Section 12 by keeping both section and container top padding active.
- `root_cause`: Focused on single rule values instead of net effective spacing across nested wrappers.
- `rule`: When tuning vertical rhythm, audit parent + child padding/margin together and remove redundant top space.
- `prevention_check`: Calculate effective top gap before text after every spacing change.

### 10) Lock responsive direction explicitly when user says "remain horizontal"
- `mistake`: Kept mobile stack behavior in Price Tags after explicit request to preserve horizontal layout.
- `root_cause`: Defaulted to prior mobile pattern instead of task-specific direction requirement.
- `rule`: When user specifies orientation, set that orientation explicitly in each active breakpoint.
- `prevention_check`: Verify mobile `grid-template-columns`/`flex-direction` values after patching.

### 11) Scale max-width constraints with mobile typography
- `mistake`: Left desktop `header-el-sp` max-width unchanged on mobile despite smaller font sizing.
- `root_cause`: Adjusted font size without recalibrating related line-length constraints.
- `rule`: When text size changes by breakpoint, review and tune `max-width` to keep visual proportion and line breaks intentional.
- `prevention_check`: For responsive typography edits, always verify paired `font-size` and `max-width` values together.

### 12) Override all affected sides when desktop spacing should not persist on mobile
- `mistake`: Changed only mobile top padding for Section 19 while desktop bottom padding remained active.
- `root_cause`: Partial-side override left inherited desktop bottom value (`167px`) on mobile.
- `rule`: When a section has desktop shorthand padding, mobile override must explicitly set full shorthand if different bottom/side behavior is required.
- `prevention_check`: Inspect computed top and bottom values after every breakpoint override.
