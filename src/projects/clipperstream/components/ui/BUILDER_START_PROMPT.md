# Builder Start Prompt

**Copy everything below the line and send to your builder**

---

You're going to refactor a React component from 1589 lines down to ~300 lines by extracting specialized hooks. First, we need to set up git branches properly, then you'll follow the refactor blueprint.

## CURRENT SITUATION
- We're currently on branch: `attempt/offline-fixes-week1`
- This branch has ALL the work (MD files, experiments, everything)
- Main branch needs to be updated
- Then we'll create backup and refactor branches

## STEP 1: GIT SETUP (Execute these commands)

```bash
# 1. Verify you're on attempt/offline-fixes-week1
git branch
# Should show: * attempt/offline-fixes-week1

# 2. Commit everything on this branch
git add .
git commit -m "Pre-refactor: All work including MD files and experiments"

# 3. Switch to main and merge this work
git checkout main
git merge attempt/offline-fixes-week1

# 4. Push updated main (optional, for backup)
git push origin main

# 5. Create backup snapshot
git branch backup/before-refactor-week1

# 6. Create refactor branch (where you'll work)
git checkout -b refactor/clip-master-phases

# 7. Push refactor branch (for backup)
git push -u origin refactor/clip-master-phases

# 8. Verify setup
git branch
# Should show: * refactor/clip-master-phases

# 9. Verify you have all files
ls src/projects/clipperstream/components/ui/013_*.md
# Should show: 013_BUILDER_INSTRUCTIONS.md, 013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md, etc.
```

**After running these commands, you should have:**
- ✅ Main branch updated with all work
- ✅ Backup branch created (backup/before-refactor-week1)
- ✅ You're on refactor/clip-master-phases branch
- ✅ All MD files and code available

## STEP 2: READ INSTRUCTIONS (30 minutes)

Read these files in order:

1. **`013_BUILDER_INSTRUCTIONS.md`** (20 min read)
   - Location: `src/projects/clipperstream/components/ui/013_BUILDER_INSTRUCTIONS.md`
   - Read the entire document
   - Understand the critical rules
   - See the testing strategy

2. **`013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md`** (10 min skim)
   - Location: `src/projects/clipperstream/components/ui/013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md`
   - Skim the 4 phases
   - Don't memorize - just get familiar

## STEP 3: VERIFY ENVIRONMENT (5 minutes)

```bash
# 1. Install dependencies (if not already)
npm install

# 2. Start dev server
npm run dev

# 3. Test that ONLINE recording works (CRITICAL)
# - Navigate to the ClipperStream page
# - Click "Record" button
# - Speak for 5-10 seconds: "Testing one two three"
# - Click "Done"
# - Expected: Text appears with animation, title changes to AI-generated
# - If this fails: STOP and report the issue

# 4. Stop dev server (Ctrl+C)
```

**If online recording works, proceed to Step 4.**
**If online recording fails, STOP and report the issue.**

## STEP 4: START REFACTOR (8-12 hours over 1-2 days)

Follow the blueprint phase by phase:

### Phase 1: Extract Clip State (2-3 hours)
1. Open `013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md`
2. Go to "Phase 1: Extract Clip State Management"
3. Follow steps 1.1 through 1.4 exactly
4. Run ALL tests in "Testing Criteria for Phase 1"
5. If all tests pass, commit:
   ```bash
   git add .
   git commit -m "Phase 1: Extract clip state management"
   git push
   ```
6. Take a 15-minute break

### Phase 2: Extract Pending Clips Queue (2-3 hours)
1. Go to "Phase 2: Extract Pending Clips Queue" in blueprint
2. Follow steps 2.1 through 2.6 exactly
3. Run ALL tests in "Testing Criteria for Phase 2"
4. If all tests pass, commit:
   ```bash
   git add .
   git commit -m "Phase 2: Extract pending clips queue"
   git push
   ```
5. Take a 15-minute break

### Phase 3: Extract Transcription Orchestrator (3-4 hours)
1. Go to "Phase 3: Extract Transcription Orchestrator" in blueprint
2. Follow steps 3.1 through 3.3 exactly
3. **CRITICAL:** Test online recording FIRST
4. Run ALL tests in "Testing Criteria for Phase 3"
5. If all tests pass, commit:
   ```bash
   git add .
   git commit -m "Phase 3: Extract transcription orchestrator"
   git push
   ```
6. Take a 30-minute break (this was the hardest phase)

### Phase 4: Extract Recording Session State (1-2 hours)
1. Go to "Phase 4: Extract Recording Session State" in blueprint
2. Follow steps 4.1 through 4.3 exactly
3. Run ALL tests in "Testing Criteria for Phase 4"
4. Verify ClipMasterScreen is < 300 lines:
   ```bash
   wc -l src/projects/clipperstream/components/ui/ClipMasterScreen.tsx
   # Should show ~270 lines
   ```
5. If all tests pass, commit:
   ```bash
   git add .
   git commit -m "Phase 4: Extract recording session state"
   git push
   ```

## STEP 5: FINAL VERIFICATION (30 minutes)

Run ALL tests from all phases:

```bash
# 1. Start dev server
npm run dev

# 2. Test online recording (CRITICAL)
# - Record → Done → Text appears

# 3. Test offline recording
# - Open DevTools → Network tab → Check "Offline"
# - Record → Done → Shows "Clip 001"
# - Record again → Shows "Clip 001" AND "Clip 002" (both visible)
# - Uncheck "Offline"
# - Expected: Both clips transcribe automatically

# 4. Test navigation
# - Home screen displays clips
# - Click clip navigates to detail
# - Back button works

# 5. Test CRUD
# - Delete a clip (works)
# - Search clips (works)
```

**If ALL tests pass:**
```bash
git add .
git commit -m "Final verification: All tests passing"
git push
```

## STEP 6: REPORT COMPLETION

Report back with:
1. ✅ All 4 phases completed
2. ✅ All tests passing
3. ✅ ClipMasterScreen line count: ~270 lines (from 1589)
4. ✅ 5 new hook files created
5. ✅ Git commits: 4 phase commits + 1 final verification

**Final git tree:**
```
main (has original work)
backup/before-refactor-week1 (snapshot)
refactor/clip-master-phases (completed refactor) ← YOU ARE HERE
  ├── Phase 1 commit
  ├── Phase 2 commit
  ├── Phase 3 commit
  ├── Phase 4 commit
  └── Final verification commit
```

## CRITICAL RULES

1. **DO NOT SKIP PHASES** - Must do 1→2→3→4 in order
2. **TEST AFTER EVERY PHASE** - If tests fail, use rollback plan
3. **ONLINE RECORDING IS CANARY** - Test after every phase
4. **COMMIT AFTER EACH PHASE** - Don't batch commits
5. **TAKE BREAKS** - 15 min between phases, 30 min after Phase 3

## WHEN TO STOP AND ASK FOR HELP

- Online recording breaks after any phase
- TypeScript errors you can't resolve
- Any test fails and rollback doesn't help
- Confused about instructions

## ESTIMATED TIMELINE

| Phase | Time | Total So Far |
|-------|------|--------------|
| Git setup | 5 min | 5 min |
| Reading | 30 min | 35 min |
| Environment | 5 min | 40 min |
| Phase 1 | 2-3 hours | 3-4 hours |
| Phase 2 | 2-3 hours | 5-7 hours |
| Phase 3 | 3-4 hours | 8-11 hours |
| Phase 4 | 1-2 hours | 9-13 hours |
| Final verification | 30 min | 10-14 hours |

**Recommended:** Spread over 2 days (6-7 hours each day)

## READY TO START?

Before beginning, verify:
- [ ] I've read this entire prompt
- [ ] I understand I must test after EVERY phase
- [ ] I know online recording is the most important test
- [ ] I'll commit after each phase
- [ ] I'll stop and ask if anything breaks
- [ ] I have 2-3 hours for Phase 1 (don't start if less time)

**If all checked, execute Step 1 git commands above!**

---

**Files you'll be working with:**
- `src/projects/clipperstream/components/ui/ClipMasterScreen.tsx` (modifying)
- `src/projects/clipperstream/components/ui/013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md` (following)
- `src/projects/clipperstream/components/ui/013_BUILDER_INSTRUCTIONS.md` (reference)
- `src/projects/clipperstream/hooks/` (creating 4 new hook files here)
- `src/projects/clipperstream/services/clipStorage.ts` (minor modification)

**Good luck! This refactor will make the codebase much cleaner and debuggable.**
