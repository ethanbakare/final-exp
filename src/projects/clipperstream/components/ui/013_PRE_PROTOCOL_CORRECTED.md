# 013 Pre-Protocol CORRECTED: Separate Working from Broken

**Purpose:** Commit working parts to main, save broken experiments separately
**Time:** 10-15 minutes
**Risk:** Zero (careful separation ensures safety)

---

## 🎯 The Situation

You have uncommitted work that contains:
- ✅ **Working parts:** MD files, ClipOfflineScreen.tsx, analysis docs
- ❌ **Broken parts:** Some offline recording attempts in ClipMasterScreen.tsx

**Goal:**
1. Commit the working parts to `main` (so builder has instructions)
2. Save the broken experiments separately (for reference)
3. Reset broken files back to clean state
4. Builder starts from `main` (has instructions + clean code)

---

## 📋 Step-by-Step: Selective Commit

### Step 1: Check What You Have

```bash
git status
```

You'll see a list of modified files. We need to separate them into two groups:

**Group A: Working files to commit to main**
- `013_BUILDER_INSTRUCTIONS.md` ✅
- `013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md` ✅
- `013_PRE_PROTOCOL.md` ✅ (or this corrected version)
- `ClipOfflineScreen.tsx` ✅ (showcase file)
- All `recording_*.md` files ✅ (analysis docs)
- Any other MD files ✅

**Group B: Broken experimental files to save separately**
- `ClipMasterScreen.tsx` (modified with broken offline attempts) ❌
- `clipStorage.ts` (if modified with experimental changes) ❌
- Any other .tsx/.ts files with broken experiments ❌

---

### Step 2: Commit Working Parts to Main First

```bash
# Add ONLY the working MD files and showcase
git add 013_BUILDER_INSTRUCTIONS.md
git add 013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md
git add 013_PRE_PROTOCOL_CORRECTED.md
git add recording_*.md
git add ClipOfflineScreen.tsx
# Add any other MD files or working showcase files

# Commit these to main
git commit -m "Add refactor documentation and showcase files

- Added comprehensive refactor blueprint (013_v2)
- Added builder instructions (013_BUILDER_INSTRUCTIONS)
- Added pre-protocol for safe branching (013_PRE_PROTOCOL)
- Added recording analysis MD files
- Added ClipOfflineScreen showcase (working demo)

These are documentation and reference files for upcoming refactor.
No code changes to production functionality."

# Push to main (so it's backed up)
git push origin main
```

**What this does:**
- ✅ Commits the MD files to `main` (builder will have instructions)
- ✅ Commits ClipOfflineScreen showcase (working reference)
- ✅ Commits analysis docs (context for builder)
- ❌ Does NOT commit the broken ClipMasterScreen experiments

---

### Step 3: Save Broken Experiments to Separate Branch

Now we'll save your experimental changes (the broken ones) separately:

```bash
# Create a new branch for your experiments (WITHOUT switching to it yet)
git branch attempt/offline-fixes-week1

# Switch to the attempt branch
git checkout attempt/offline-fixes-week1

# Add the broken experimental files
git add ClipMasterScreen.tsx
git add clipStorage.ts
# Add any other experimental .tsx/.ts files you modified

# Commit the experiments
git commit -m "WIP: Offline recording experiments - BROKEN

Attempted changes:
- Modified ClipMasterScreen.tsx for offline handling
- Added pending clips logic
- Modified clipStorage.ts

Issues:
- Second pending clip replaces first
- Wrong clip numbering
- Background transcription doesn't update UI

This branch is for reference only. Starting fresh refactor from main."

# Push this branch (optional but recommended for backup)
git push -u origin attempt/offline-fixes-week1
```

**What this does:**
- ✅ Saves your broken experimental code to a separate branch
- ✅ You can reference it later if needed
- ❌ Won't affect main or production

---

### Step 4: Go Back to Main (Now Has Instructions)

```bash
# Switch back to main
git checkout main

# Verify what's on main now
git status
```

**What you should see:**
```
On branch main
Changes not staged for commit:
  modified: ClipMasterScreen.tsx
  modified: clipStorage.ts
```

These are the files you DIDN'T commit (the experimental ones). That's expected.

---

### Step 5: Reset Broken Files to Clean State

```bash
# Discard changes to experimental files (back to last committed version)
git checkout -- ClipMasterScreen.tsx
git checkout -- clipStorage.ts
# Add any other experimental files you modified

# Now verify
git status
```

**What you should see:**
```
On branch main
nothing to commit, working tree clean
```

**What this means:**
- ✅ Main branch has: MD files + ClipOfflineScreen + clean code
- ✅ Your experiments are saved in `attempt/offline-fixes-week1` branch
- ✅ Production code is clean and working

---

## 🌳 Your Git Tree After These Steps

```
main (updated, clean)
├── Has all MD files (builder instructions) ✅
├── Has ClipOfflineScreen.tsx showcase ✅
├── Has recording_*.md analysis ✅
├── ClipMasterScreen is CLEAN (working online recording) ✅
└── This is what builder will start from

attempt/offline-fixes-week1 (your experiments)
├── Has broken ClipMasterScreen changes ❌
├── Has experimental clipStorage changes ❌
└── Saved for reference, not for building on
```

---

## 🚀 Vercel & Production

**After these steps:**
- Production will deploy from `main`
- `main` now has: MD files + showcase + clean working code
- Your broken experiments are safely in another branch
- Production site will show the clean working code (online recording works)

---

## ✅ Verify Before Proceeding

After completing all steps, check:

```bash
# 1. You're on main
git branch
# Should show: * main

# 2. Main is clean
git status
# Should show: "nothing to commit, working tree clean"

# 3. MD files exist
ls -la 013_*.md
# Should show: 013_BUILDER_INSTRUCTIONS.md, 013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md, etc.

# 4. Showcase exists
ls -la ClipOfflineScreen.tsx
# Should show the file

# 5. Your experiments are saved
git branch
# Should show: attempt/offline-fixes-week1

# 6. Test online recording works
npm run dev
# Test: Record → Done → Text appears
```

**If all checks pass, you're ready!**

---

## 🎯 What Builder Will Have

When builder starts, they'll work on `main` which now has:

1. ✅ `013_BUILDER_INSTRUCTIONS.md` - What to do
2. ✅ `013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md` - How to do it
3. ✅ `ClipOfflineScreen.tsx` - Expected behavior showcase
4. ✅ `recording_*.md` files - Analysis and context
5. ✅ Clean ClipMasterScreen.tsx - Online recording works
6. ✅ Clean clipStorage.ts - No broken experiments

**They have everything they need to start the refactor!**

---

## 🔄 If You Need to Reference Your Experiments

```bash
# Switch to your experiment branch to see what you tried
git checkout attempt/offline-fixes-week1

# Look at the changes
git diff main..attempt/offline-fixes-week1

# Go back to main
git checkout main
```

---

## 📝 Summary of Commands (Quick Reference)

```bash
# 1. Commit working parts to main
git add 013_*.md recording_*.md ClipOfflineScreen.tsx
git commit -m "Add refactor documentation and showcase files"
git push origin main

# 2. Save experiments to separate branch
git branch attempt/offline-fixes-week1
git checkout attempt/offline-fixes-week1
git add ClipMasterScreen.tsx clipStorage.ts
git commit -m "WIP: Offline experiments - BROKEN"
git push -u origin attempt/offline-fixes-week1

# 3. Back to main and reset experimental files
git checkout main
git checkout -- ClipMasterScreen.tsx
git checkout -- clipStorage.ts

# 4. Verify
git status  # Should show "nothing to commit"
ls -la 013_*.md  # Should show MD files
npm run dev  # Test online recording works
```

---

## ❓ FAQ

**Q: Why commit MD files to main?**
A: So the builder has instructions when they start. Without these files on `main`, they have nothing to follow.

**Q: Why not commit the broken code to main?**
A: We want `main` to always have working code. Broken experiments go in separate branches.

**Q: What if I want to keep working on my experiments?**
A: Switch to `attempt/offline-fixes-week1` branch. But the refactor should start fresh from clean `main`.

**Q: Will production deploy the MD files?**
A: Yes, but MD files are just documentation. They don't affect the app functionality. Production will still work perfectly.

**Q: Can I delete the attempt branch later?**
A: Yes, after the refactor is done and you don't need to reference your experiments anymore.

---

## 🎓 Key Difference from Original Pre-Protocol

**Original (WRONG):**
- Save everything → Go back to old main (missing MD files)
- Builder has no instructions ❌

**Corrected (RIGHT):**
- Commit MD files to main first → Save experiments separately → Reset to updated main
- Builder has instructions on main ✅

---

**This corrected approach ensures the builder has everything they need while keeping your experiments safely saved!**
