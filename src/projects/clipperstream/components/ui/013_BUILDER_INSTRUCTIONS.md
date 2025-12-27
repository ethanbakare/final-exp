# Builder Instructions: ClipMasterScreen Refactor

**READ THIS ENTIRE DOCUMENT BEFORE STARTING**

**Estimated Time:** 8-12 hours over 4 phases
**Difficulty:** Medium (requires careful attention to detail)
**Risk Level:** Medium (phased approach with testing minimizes risk)

---

## 🎯 What You're Being Asked to Do

You're refactoring a **1589-line React component** (`ClipMasterScreen.tsx`) that has become unmaintainable. The component handles:
- Voice recording with transcription
- Online AND offline recording scenarios
- Audio storage in IndexedDB
- AI formatting and title generation
- Screen navigation
- Clip management (CRUD operations)

**The problem:** Everything is tangled together in one massive file, making it impossible to debug offline functionality.

**Your task:** Extract logic into 4 specialized hooks while **preserving all working functionality**.

---

## 📋 Pre-Work (Do This FIRST - 30 minutes)

### Step 1: Read These Files (in order)

Open and skim these files to understand what you're working with:

1. **`013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md`** (the main blueprint you'll follow)
   - Read the Executive Summary
   - Skim each phase overview
   - Don't memorize - just get familiar

2. **`ClipMasterScreen.tsx`** (the file you'll be modifying)
   - Location: `src/projects/clipperstream/components/ui/ClipMasterScreen.tsx`
   - Just scroll through it - notice how long it is (1589 lines)
   - See all the `useState` and `useEffect` hooks

3. **`ClipOfflineScreen.tsx`** (reference for expected behavior)
   - Location: `src/pages/clipperstream/showcase/ClipOfflineScreen.tsx`
   - This is a SHOWCASE file showing how offline recording should work
   - Don't modify it - use it as reference

4. **`clipStorage.ts`** (data model)
   - Location: `src/projects/clipperstream/services/clipStorage.ts`
   - See the `Clip` interface (you'll add one field in Phase 2)

5. **`useClipRecording.ts`** (existing hook - DON'T MODIFY)
   - Location: `src/projects/clipperstream/hooks/useClipRecording.ts`
   - This hook is already extracted - you won't touch it
   - Just know it exists

### Step 2: Set Up Your Environment

```bash
# 1. Make sure you're on the correct branch
git status

# 2. Create a new branch for this work
git checkout -b refactor/clip-master-screen-phases

# 3. Run the app to see current state
npm run dev

# 4. Test that online recording works
# (Instructions in "How to Test" section below)

# 5. Create a backup commit before starting
git add .
git commit -m "Backup before ClipMasterScreen refactor"
```

### Step 3: Open These Files in Your Editor

Have these files open in tabs (you'll be switching between them):

1. `ClipMasterScreen.tsx` (modifying)
2. `013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md` (following)
3. `clipStorage.ts` (reference)
4. Terminal (for testing)

---

## 🚨 CRITICAL RULES (Read Carefully)

### Rule 1: **DO NOT SKIP PHASES**

You MUST do phases in order:
- Phase 1 → Test → Commit → Phase 2 → Test → Commit → etc.

**DO NOT:**
- Do Phase 2 before Phase 1 is tested and committed
- Try to do multiple phases at once
- Skip testing after a phase

**Why:** Each phase builds on the previous one. If Phase 2 breaks and you haven't committed Phase 1, you'll have to redo everything.

---

### Rule 2: **ONLINE RECORDING IS THE CANARY**

After **EVERY phase**, you MUST test online recording:

**Test Steps:**
1. Open the app (http://localhost:3000/clipperstream or wherever it runs)
2. Click "Record" button
3. Allow microphone access
4. Speak for 5-10 seconds: "Testing testing one two three"
5. Click "Done"
6. **Expected:** Text appears with fade-in animation, title changes from "Recording 01" to AI-generated title
7. **If this fails:** STOP, rollback the phase, investigate

**This is your canary in the coal mine.** If online recording breaks, offline won't work either.

---

### Rule 3: **Some Things Are Working - Don't Touch Them**

These features work perfectly - **DO NOT MODIFY:**

| Feature | Status | What NOT to Do |
|---------|--------|----------------|
| Online recording | ✅ Perfect | Don't change the success path |
| Text animations | ✅ Perfect | Don't modify contentBlocks rendering logic |
| Screen transitions | ✅ Perfect | Don't change activeScreen navigation |
| Delete/rename/search clips | ✅ Perfect | Don't touch these handlers |
| UI components | ✅ Perfect | Don't modify ClipButtons, ClipList, ClipOffline, ClipRecordScreen |

**If the blueprint says "DELETE lines 977-1037"** → Delete them
**If the blueprint says "KEEP AS-IS"** → Don't touch it
**If the blueprint doesn't mention something** → Don't touch it

---

### Rule 4: **Use the Rollback Plan if Tests Fail**

Each phase has a rollback plan. **Use it immediately if:**
- Online recording breaks
- App crashes
- Console shows errors
- Tests don't pass

**Example rollback (from Phase 1):**
```bash
rm hooks/useClipState.ts
git checkout ClipMasterScreen.tsx
git commit -m "Rollback Phase 1: <reason>"
```

Don't try to "fix forward" - rollback, understand the issue, then try again.

---

### Rule 5: **Test After EVERY Phase, Not Just at the End**

Each phase has a "Testing Criteria" section with specific tests.

**Do this after each phase:**
1. Run ALL tests for that phase
2. Check off each item in the checklist
3. If ANY test fails → Rollback
4. Only proceed to next phase if ALL tests pass

**Don't do this:**
- ❌ Complete all 4 phases, then test at the end
- ❌ Skip tests because "it looks fine"
- ❌ Move on with failing tests

---

## 📖 How to Use the Blueprint

### The Blueprint Structure

Each phase has:
1. **Goals** - What this phase achieves
2. **Step-by-step instructions** - Exact code to write
3. **BEFORE/AFTER comparisons** - Shows what changes
4. **Testing Criteria** - What to verify
5. **Rollback Plan** - What to do if it breaks
6. **Commit Message** - What to write

### How to Follow Each Phase

**For each phase, do this:**

1. **Read the entire phase first** (don't start coding yet)
   - Understand what you're extracting
   - See the big picture

2. **Create the new hook file** (if phase creates one)
   - Copy the complete code from the blueprint
   - Save the file in the correct location

3. **Modify ClipMasterScreen.tsx**
   - Follow the BEFORE/AFTER sections exactly
   - Use your editor's search to find the exact lines
   - Delete what it says to delete
   - Add what it says to add

4. **Check for TypeScript errors**
   - Your editor should show red squiggles if something's wrong
   - Fix imports if needed

5. **Test according to Testing Criteria**
   - Do EVERY test in the checklist
   - Check off each one

6. **Commit with the provided message**
   - Copy the commit message from the blueprint
   - Add any notes about issues you encountered

7. **Take a break** (5-10 minutes between phases)

---

## 🧪 How to Test

### Test 1: Online Recording (Most Important)

**Do this after EVERY phase:**

1. Start the dev server: `npm run dev`
2. Navigate to the ClipperStream page
3. Click the "Record" button (should see waveform)
4. Speak for 5-10 seconds: "This is a test recording one two three"
5. Click "Done" button
6. **Wait 2-5 seconds** (transcription happens)
7. **Expected results:**
   - ✅ Text appears with fade-in animation
   - ✅ Title changes from "Recording 01" to something like "Test Recording Summary"
   - ✅ "Copied to clipboard" toast appears
   - ✅ No errors in console

**If ANY of the above fail:** STOP and rollback.

---

### Test 2: Offline Recording (Phase 2+)

**Do this after Phase 2 and Phase 3:**

1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Check "Offline" checkbox (simulates no internet)
4. Click "Record" button
5. Speak for 5-10 seconds
6. Click "Done"
7. **Expected results:**
   - ✅ Shows "Clip 001" with gray icon (not spinning)
   - ✅ "Audio saved for later" toast appears
   - ✅ No crashes

8. Click "Record" button again (while still offline)
9. Speak for 5-10 seconds
10. Click "Done"
11. **Expected results (Phase 2 specific):**
    - ✅ Shows BOTH "Clip 001" AND "Clip 002" (not replaced)
    - ✅ Both visible in the list

12. Uncheck "Offline" (simulate coming back online)
13. **Expected results (Phase 3 specific):**
    - ✅ Text appears automatically for both clips
    - ✅ "Clip 001" and "Clip 002" disappear
    - ✅ Shows transcribed text instead

---

### Test 3: Navigation and CRUD

**Do this after each phase:**

1. **Home screen:**
   - ✅ Clips appear in list
   - ✅ Can scroll
   - ✅ Search works

2. **Click a clip:**
   - ✅ Navigates to detail view
   - ✅ Shows text

3. **Back button:**
   - ✅ Returns to home screen

4. **Delete a clip:**
   - ✅ Clip removed from list
   - ✅ No errors

---

## ⏱️ Expected Timeline

| Phase | Time | What You'll Create | Lines Changed |
|-------|------|-------------------|---------------|
| **Phase 1** | 2-3 hours | `useClipState.ts` (150 lines) | Delete ~150, Add ~10 |
| Break | 15 min | Rest, review | - |
| **Phase 2** | 2-3 hours | `usePendingClipsQueue.ts` (220 lines) | Delete ~200, Add ~20 |
| Break | 15 min | Rest, review | - |
| **Phase 3** | 3-4 hours | `useTranscriptionOrchestrator.ts` (280 lines) | Delete ~250, Add ~30 |
| Break | 30 min | Rest, thorough testing | - |
| **Phase 4** | 1-2 hours | `useRecordingSession.ts` (120 lines) | Delete ~100, Add ~20 |
| Final Testing | 30 min | All tests, verification | - |

**Total:** 8-12 hours (spread over 1-2 days recommended)

---

## 🛑 When to STOP and Ask for Help

**Stop and reach out if:**

1. **Online recording breaks after a phase**
   - This is the most critical test
   - Don't proceed if this fails

2. **TypeScript errors you can't resolve**
   - Missing imports
   - Type mismatches
   - "Cannot find name" errors

3. **Phase 3 testing fails**
   - Background transcription not showing
   - Wrong clip getting transcription
   - This is the most complex phase

4. **You're confused about the instructions**
   - Better to ask than guess wrong

5. **Tests pass but something feels wrong**
   - Console warnings
   - Strange behavior
   - Performance issues

**How to ask for help:**
1. Note which phase you're on
2. What test failed (exact test from checklist)
3. Console errors (screenshot)
4. What you've tried

---

## 📦 What Success Looks Like

After all 4 phases, you should have:

✅ **5 files created:**
- `hooks/useClipState.ts` (150 lines)
- `hooks/usePendingClipsQueue.ts` (220 lines)
- `hooks/useTranscriptionOrchestrator.ts` (280 lines)
- `hooks/useRecordingSession.ts` (120 lines)

✅ **ClipMasterScreen.tsx reduced:**
- From: 1589 lines
- To: ~270 lines (83% reduction)

✅ **All tests passing:**
- ✅ Online recording works perfectly
- ✅ Offline recording creates pending clips
- ✅ Multiple pending clips show (not just one)
- ✅ Coming back online transcribes automatically
- ✅ Navigation, delete, rename, search all work

✅ **4 git commits:**
- "Phase 1: Extract clip state"
- "Phase 2: Extract pending clips queue"
- "Phase 3: Extract transcription orchestrator"
- "Phase 4: Extract recording session state"

✅ **Zero bugs introduced:**
- No regressions
- All existing features still work
- Offline functionality now works

---

## 🎓 Pro Tips

### Tip 1: Read Before Coding
Spend 5 minutes reading the entire phase before writing any code. Understanding the big picture prevents mistakes.

### Tip 2: Use Find/Replace Carefully
When changing from singular (`selectedPendingClip`) to array (`selectedPendingClips`), use your editor's "Find All" to see ALL occurrences before changing.

### Tip 3: Keep the Blueprint Open
Have the blueprint on a second monitor or half your screen. You'll be switching back and forth constantly.

### Tip 4: Commit Often
The blueprint says to commit after each phase, but you can commit more often (e.g., after creating each hook file, before modifying ClipMasterScreen).

### Tip 5: Test in Incognito
If something behaves weirdly, try in an incognito window (clears localStorage/sessionStorage).

### Tip 6: Check the Showcase File
If you're confused about expected behavior, look at `ClipOfflineScreen.tsx` - it's a working demo.

---

## 🚀 Ready to Start?

**Before you begin, verify:**

- [ ] I've read this entire document
- [ ] I've skimmed all 4 phases in the blueprint
- [ ] I have the files open in my editor
- [ ] I've created a backup commit
- [ ] I've tested that online recording currently works
- [ ] I understand I must test after EVERY phase
- [ ] I know when to stop and ask for help
- [ ] I have 2-3 hours for Phase 1 (don't start if you have < 2 hours)

**If all checked, proceed to Phase 1 in the blueprint!**

**Good luck! This refactor will make the codebase much cleaner and debuggable.**

---

## 📞 Quick Reference

| Question | Answer |
|----------|--------|
| Can I skip Phase 2? | ❌ No - must do all phases in order |
| What if online recording breaks? | 🛑 Stop immediately, rollback, investigate |
| Can I modify ClipOfflineScreen.tsx? | ❌ No - it's reference only |
| How long should each phase take? | Phase 1-2: 2-3 hrs, Phase 3: 3-4 hrs, Phase 4: 1-2 hrs |
| What if I'm stuck? | Ask for help (see "When to STOP and Ask for Help") |
| Can I do all phases in one sitting? | Not recommended - take breaks between phases |
| What's the most important test? | Online recording - test after EVERY phase |

---

**Document Version:** 1.0
**Last Updated:** December 27, 2025
**Corresponds to Blueprint:** 013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md
