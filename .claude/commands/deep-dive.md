You are performing a deep-dive investigation before making any code changes. Do NOT propose solutions, fixes, or workarounds until you have completed all research phases. The argument passed to this command describes the problem to investigate.

# Phase 1: Understand the Problem

1. Restate the problem in your own words — what is the user experiencing?
2. Separate symptoms from potential root causes
3. Identify the scope: which features, components, or systems are involved?
4. Do NOT propose any solution yet. You are only gathering information.

Output a short summary of your understanding before proceeding.

# Phase 2: Read All Related Code

1. Identify every file that touches the issue — components, services, types, configs, styles
2. Read each file completely. No skimming. No assumptions about what a file contains.
3. Trace the complete data flow end-to-end:
   - What calls what?
   - What triggers what?
   - What depends on what?
   - What are the exact function signatures, event names, and config options?
4. Document your findings with exact file paths and line numbers
5. If the issue involves a library or SDK:
   - Read the actual source code (node_modules), not just the TypeScript types
   - Find the implementation, not just the interface
   - Identify every configuration option, flag, method, and event available
6. If the user has provided reference implementations or documentation files, read those too

Do NOT propose any solution yet.

# Phase 3: Examine the Architecture

With the code fully read, evaluate:

1. Does the current approach follow best practices for this technology?
2. Is there proper separation of concerns?
3. Is something architecturally wrong that keeps causing issues?
4. Are we treating symptoms (patching behavior) instead of addressing root causes (wrong approach)?
5. Is there a simpler way to achieve the same outcome with less code?
6. Are there built-in features of the framework/SDK that we're not using?

Document any architectural concerns you find.

# Phase 4: Research if Stuck

If any aspect of the problem is unclear after reading the code:

1. Search the web for how others solve this specific problem
2. Check official documentation for the technologies involved
3. Look at reference implementations and example projects
4. Find GitHub issues, Stack Overflow threads, or blog posts about the exact scenario
5. Read source code of dependencies to find control points you might have missed

Do NOT guess. If you don't know how something works, look it up.

# Phase 5: Present Findings and Propose Solution

Only now, after completing all research:

1. Present a clear summary of what you found:
   - The complete data/event flow (with file:line references)
   - Any architectural issues discovered
   - All available control points and configuration options
2. Propose the simplest, most efficient solution:
   - Ground every claim in specific code you've read
   - Explain WHY this approach works (not just what to do)
   - If there are genuinely multiple valid approaches, explain the trade-offs
   - Default to the approach that works with the existing architecture, not against it
3. Ask the user to confirm the approach before writing any code

# Rules

- NEVER skip phases. Even if you think you know the answer, complete the research.
- NEVER propose a workaround before checking if the tool/SDK already supports what you need.
- NEVER assume how code works. Read it.
- If the issue has come up before, check git history to understand what was tried and why it failed.
- Prefer solutions that use existing capabilities over custom hacks.
- Less code is better. The simplest correct solution wins.
