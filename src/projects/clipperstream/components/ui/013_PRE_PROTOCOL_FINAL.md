# 013 Pre-Protocol FINAL: Simple Backup & Branch Setup

**Purpose:** Save current state, create backup, start refactor
**Time:** 3 minutes
**Risk:** Zero

---

## 🎯 What We're Doing (Simple)

```
Current situation:
├── You have uncommitted work (MD files + experiments + everything)
├── You have a branch with some of this work
└── Main doesn't have your new work yet

What we need:
├── Main = updated with ALL your current work
├── Backup branch = snapshot (before refactor)
├── Refactor branch = where builder works
└── Main stays as-is (not deployed until you're ready)
```

---

## 📋 3-Step Setup

### Step 1: Update Main with Your Current Work

```bash
# Make sure you're on your current branch (wherever your work is)
git status

# Add everything you have
git add .

# Commit everything to your current branch
git commit -m "Pre-refactor: All work including MD files and experiments"

# Merge to main (or push to main)
# If you're already on main:
# (nothing to do, you're already here)

# If you're on a different branch:
git checkout main
git merge <your-branch-name>
# OR
# git cherry-pick <commit-hash>
```

**Result:** Main now has ALL your work (MD files + experiments)

---

### Step 2: Create Backup Snapshot

```bash
# Make sure you're on main
git branch

# Create backup branch (just a snapshot, don't switch to it)
git branch backup/before-refactor-week1

# Verify it exists
git branch
# Should show: backup/before-refactor-week1
```

**Result:** You have a snapshot of everything before refactor starts

---

### Step 3: Create Refactor Branch (Where Builder Works)

```bash
# Create and switch to refactor branch
git checkout -b refactor/clip-master-phases

# Verify you're on it
git branch
# Should show: * refactor/clip-master-phases

# Push it (optional, for backup)
git push -u origin refactor/clip-master-phases
```

**Result:** Builder works on this branch (has all files)

---

## 🌳 Your Git Tree After Setup

```
main
├── Has: ALL your work (MD files + experiments)
├── Not deployed to production (you control when)
└── Updated, safe

backup/before-refactor-week1
├── Snapshot of main (before refactor)
├── Reference if you need to see original state
└── Don't modify this

refactor/clip-master-phases (YOU ARE HERE)
├── Where builder does all 4 phases
├── Has: ALL your work (same as main)
└── Builder commits Phase 1, 2, 3, 4 here
```

---

## 🚀 Vercel & Production

**Important:** Just because it's on `main` doesn't mean it auto-deploys.

**Vercel settings:**
- You can set which branch deploys to production
- Usually it's `main`, but you can change it
- OR you can manually trigger deployments

**After refactor is done:**
- Merge `refactor/clip-master-phases` → `main`
- Then deploy to production (manually or auto)

---

## ✅ Verify Setup Complete

```bash
# 1. Check you're on refactor branch
git branch
# Should show: * refactor/clip-master-phases

# 2. Verify backup exists
git branch | grep backup
# Should show: backup/before-refactor-week1

# 3. Verify you have all files
ls -la 013_*.md
# Should show: 013_BUILDER_INSTRUCTIONS.md, 013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md, etc.

# 4. Verify main is updated
git checkout main
ls -la 013_*.md
# Should show same files
git checkout refactor/clip-master-phases
# Back to refactor branch
```

---

## 🎯 Builder Starts Here

Builder will:
1. Work on `refactor/clip-master-phases` branch
2. Follow `013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md`
3. Commit after each phase
4. When done, merge to `main`

---

## 📋 Quick Commands Summary

```bash
# 1. Commit everything to main
git add .
git commit -m "Pre-refactor: All work including MD files and experiments"

# 2. Create backup
git branch backup/before-refactor-week1

# 3. Create refactor branch
git checkout -b refactor/clip-master-phases

# 4. Verify
git branch  # Should show * refactor/clip-master-phases
ls -la 013_*.md  # Should show MD files
```

---

## 🔄 If You Need to Reference Backup

```bash
# See what was in backup
git checkout backup/before-refactor-week1
# Look around
git log
git diff refactor/clip-master-phases

# Go back to refactor
git checkout refactor/clip-master-phases
```

---

## ❓ FAQ

**Q: Will this deploy to production?**
A: No, not automatically. You control when to deploy.

**Q: What if I made a branch already (like attempt/offline-fixes-week1)?**
A: That's fine. Just merge it to main first, then create backup and refactor branches.

**Q: Where does the builder work?**
A: On `refactor/clip-master-phases` branch. They commit each phase there.

**Q: What about the branch I already made?**
A: If it has your work, merge it to main first. Then follow steps 2 and 3.

---

## 🎓 Summary

**What you did:**
1. ✅ Updated main with ALL your work
2. ✅ Created backup/before-refactor-week1 (snapshot)
3. ✅ Created refactor/clip-master-phases (where builder works)

**What happens next:**
- Builder works on refactor/clip-master-phases
- Commits Phase 1, 2, 3, 4
- Main is safe (has your work but not refactored yet)
- Backup exists if needed

**You're ready to start the refactor!**

---

**Document Purpose:** Simple 3-step setup for refactor
**Next Step:** Builder follows 013_v2_COMPREHENSIVE_REFACTOR_BLUEPRINT.md on refactor/clip-master-phases branch
