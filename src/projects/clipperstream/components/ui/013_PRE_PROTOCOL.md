# 013 Pre-Protocol: Save Your Work Before Refactor

**Purpose:** Save your current broken code safely WITHOUT affecting production
**Time:** 5 minutes
**Risk:** Zero (this won't touch your live site)

---

## 🎯 What We're Doing (Simple Explanation)

Think of git branches like **parallel universes** for your code:

```
main branch (Universe A)
└── This is what's live on your website
└── Vercel deploys THIS to production
└── We won't touch this

attempt/offline-fixes-week1 (Universe B)
└── This is where we'll save your broken code
└── Vercel might create a preview link, but NOT production
└── This is just for reference/backup
```

**Key Point:** If it's not the `main` branch, it **does NOT** go to production.

---

## ✅ Why This is Safe

| Branch | Goes to Production? | What Happens |
|--------|-------------------|--------------|
| `main` | ✅ YES | This is your live site (yoursite.com) |
| `attempt/offline-fixes-week1` | ❌ NO | Saved for reference only |
| `refactor/clip-master-screen-phases` | ❌ NO | Builder will work here |

**Vercel Rule:**
- Only `main` branch = production deployment (yoursite.com)
- Any other branch = preview deployment (random-url-12345.vercel.app) OR no deployment
- Preview deployments are separate, temporary, and hidden

**Your production site will NOT be affected at all.**

---

## 📋 Step-by-Step: Save Your Work

### Step 1: See What You Have

```bash
git status
```

**What you'll see:**
```
On branch main
Changes not staged for commit:
  modified: ClipMasterScreen.tsx
  modified: clipStorage.ts
  (and other files...)
```

This shows you have uncommitted changes on the `main` branch.

---

### Step 2: Save Everything to a New Branch

```bash
# 1. Add all your changes
git add .

# 2. Create new branch AND switch to it (one command)
git checkout -b attempt/offline-fixes-week1

# 3. Commit everything
git commit -m "WIP: Week 1 offline fixes - broken code for reference"

# 4. Push to GitHub/remote (optional but recommended for backup)
git push -u origin attempt/offline-fixes-week1
```

**What just happened:**
- ✅ Your broken code is now saved in `attempt/offline-fixes-week1` branch
- ✅ You're currently ON that branch
- ✅ Production is untouched (still on `main` branch)

---

### Step 3: Go Back to Clean Main Branch

```bash
# Switch back to main
git checkout main

# Verify you're clean
git status
```

**What you'll see:**
```
On branch main
nothing to commit, working tree clean
```

**What this means:**
- ✅ You're back on `main` branch (clean, working code)
- ✅ Your attempts are safely saved in the other branch
- ✅ Production is still running the clean code

---

### Step 4: Verify Your Branches

```bash
# See all your branches
git branch
```

**What you'll see:**
```
  attempt/offline-fixes-week1
* main
```

The `*` shows which branch you're currently on (should be `main`).

---

## 🌳 Visual: Your Git Tree Now

```
main (clean code)
├── What's deployed to production ✅
├── Online recording works
└── This is what you're on now

attempt/offline-fixes-week1 (your attempts)
├── Saved for reference
├── Has your broken offline code
└── NOT deployed to production ❌
```

---

## 🚀 What About Vercel?

### What Will Happen:

1. **Production (yoursite.com):**
   - Still running code from `main` branch
   - Completely unaffected
   - ✅ Safe

2. **Preview for attempt branch:**
   - Vercel *might* create: `attempt-offline-fixes-week1-abc123.vercel.app`
   - This is a separate URL (not your production domain)
   - Only accessible if you have the exact link
   - Auto-expires after 30 days
   - ⚠️ Not your production site

**Bottom line:** Your production site (yoursite.com) will NOT change at all.

---

## 🔍 How to Check Production is Safe

After completing the steps above:

1. **Visit your production site:** yoursite.com (or whatever your domain is)
2. **Test online recording** - should still work perfectly
3. **Check Vercel dashboard:**
   - Go to your project
   - Look for "Production Deployment"
   - Should say "Branch: main" with recent deployment time
   - This confirms production is still on `main` branch

---

## 💡 What Happens Next

After you've completed these steps:

1. ✅ Your broken code is saved in `attempt/offline-fixes-week1`
2. ✅ You're back on clean `main` branch
3. ✅ Production is safe and unchanged

**Next step:**
- Builder will create a NEW branch: `refactor/clip-master-screen-phases`
- Builder works on that new branch
- Builder commits each phase
- When done and tested, merge to `main`

---

## 🎯 Quick Reference

### Save Your Work:
```bash
git add .
git checkout -b attempt/offline-fixes-week1
git commit -m "WIP: Week 1 offline fixes - broken code for reference"
git push -u origin attempt/offline-fixes-week1
```

### Go Back to Clean Code:
```bash
git checkout main
git status  # Should show "nothing to commit"
```

### See Your Branches:
```bash
git branch
```

### Switch Between Branches Later:
```bash
# Go to your attempt branch to see what you tried
git checkout attempt/offline-fixes-week1

# Go back to main
git checkout main
```

---

## ❓ Common Questions

**Q: Will this break my production site?**
A: No. Production only deploys from `main` branch. This creates a separate branch.

**Q: Can I delete the attempt branch later?**
A: Yes. When you don't need it anymore:
```bash
git branch -d attempt/offline-fixes-week1  # Delete locally
git push origin --delete attempt/offline-fixes-week1  # Delete from GitHub
```

**Q: What if I don't want to push to remote?**
A: Skip the `git push` command. The branch will only exist on your computer.

**Q: Can I work on the attempt branch later?**
A: Yes. Switch to it with `git checkout attempt/offline-fixes-week1`. But don't merge it to main (it's broken code).

**Q: Will Vercel charge me for preview deployments?**
A: No. Preview deployments are included in Vercel's free tier.

---

## ✅ Checklist Before Proceeding

After running the commands above, verify:

- [ ] `git branch` shows both `main` and `attempt/offline-fixes-week1`
- [ ] `git branch` shows `*` next to `main` (you're on main)
- [ ] `git status` shows "nothing to commit, working tree clean"
- [ ] Your production site still works (visit it in browser)
- [ ] Online recording in production still works

If all checked, you're ready to proceed with the refactor!

---

## 🎓 Summary

**What you did:**
1. Saved your broken code to `attempt/offline-fixes-week1` branch
2. Went back to clean `main` branch
3. Production is completely safe (still running `main`)

**What happens next:**
- Builder creates `refactor/clip-master-screen-phases` branch
- Builder works on clean code from `main`
- Your attempts are saved if you need to reference them

**You're now ready to start the refactor from a clean baseline!**

---

**Document Purpose:** Pre-protocol to safely save work-in-progress before starting refactor
**Next Step:** Proceed to 013_BUILDER_INSTRUCTIONS.md
