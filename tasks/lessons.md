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

### 13) When the user narrows scope to one layer, do not modify adjacent layers
- `mistake`: Changed the AI Confidence background treatment while the user was only asking to adjust the white transcript card geometry.
- `root_cause`: Treated Figma as a literal multi-layer implementation spec instead of isolating the failing layer.
- `rule`: If the user points to one visual problem layer, keep all other working layers unchanged unless they explicitly ask to touch them.
- `prevention_check`: Before patching, name the exact layer(s) allowed to change and reject any edits outside that set.

### 14) Do not compensate for layout problems by changing typography unless asked
- `mistake`: Reduced text and control sizing while trying to fix AI Confidence mobile composition.
- `root_cause`: Used typography as a secondary escape hatch instead of fixing the actual container geometry.
- `rule`: When the complaint is about crop, size, or alignment, adjust geometry first; do not change font sizes, line heights, or control sizes unless the user asks.
- `prevention_check`: If the bug report mentions position/scale/crop, diff only layout properties before considering typography changes.

### 15) Re-check the actual reference node before using Figma as a layout target
- `mistake`: Continued making AI Confidence layout changes while the current Figma selection was a different frame.
- `root_cause`: Assumed the referenced design was still selected instead of validating the live selection immediately before patching.
- `rule`: For Figma-driven adjustments, confirm the exact selected node right before implementation and stop if the selection is not the intended reference.
- `prevention_check`: Read the current Figma selection and state the node id/name before making any design-matching change.

### 16) After repeated failed tuning passes, stop and reset to a simpler implementation rule
- `mistake`: Layered scaling, overflow, and percentage overrides onto AI Confidence instead of resetting to a clearer mobile-specific composition.
- `root_cause`: Iterated on a compromised approach after it had already shown signs of drifting away from the user’s intent.
- `rule`: After two failed visual passes on the same component, stop stacking patches and replace the approach with one simple rule tied directly to the stated intent.
- `prevention_check`: If the user has corrected the same component twice, summarize the new single rule before the next code change.

### 17) When a preview should match a real product component, inspect and reuse the source component logic first
- `mistake`: Kept hand-building AI Confidence preview text, underlines, and badge behavior instead of reading the actual tracker components that already define them.
- `root_cause`: Tried to approximate the visual outcome from memory/reference instead of grounding the preview in the product’s real implementation.
- `rule`: If the user asks to match an existing product component, inspect the real component and reuse its behavior/styling path before creating a custom preview approximation.
- `prevention_check`: Before patching, identify the source component file that already implements the behavior and verify whether the preview can wrap or reuse it directly.

### 18) When the user asks for diagnosis first, do not implement before answering the diagnostic question
- `mistake`: Moved the AI Confidence preview text down before first answering whether the original tracker actually clips the top of the confidence pill.
- `root_cause`: Switched from analysis mode to fix mode before resolving the user’s requested verification step.
- `rule`: If the user explicitly asks to check the original behavior first, answer that question from the source before making any new change.
- `prevention_check`: Before patching, restate the verification question and confirm it has been answered with source evidence.
