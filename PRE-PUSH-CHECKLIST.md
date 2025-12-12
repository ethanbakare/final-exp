# Pre-Push Checklist

**Purpose:** Catch linting and type errors BEFORE pushing to prevent deployment failures.

---

## ⚠️ ALWAYS Run Before Pushing

### **Step 1: Check for ESLint/TypeScript Errors in NEW Files**

Run this command to lint ONLY the files you've changed:

```bash
npx next lint --file "src/path/to/your/file.ts" --file "src/path/to/another/file.tsx"
```

Or check all files (slower):

```bash
npm run lint
```

### **Step 2: Test Build (if time allows)**

```bash
npm run build
```

**Note:** Build may fail due to unrelated issues (like Sanity dependencies). If it fails, check if the errors are in YOUR files or external dependencies.

---

## 📋 Common Linting Errors & Fixes

### **1. Unused Variables**

**Error:**
```
'variableName' is defined but never used. @typescript-eslint/no-unused-vars
```

**Fixes:**
- **Option A:** Remove the variable if truly unused
- **Option B:** Comment it out if it's for future use:
  ```typescript
  // onRecordClick, // Reserved for future record button
  ```
- **Option C:** Use blank identifier for useState if only setter is needed:
  ```typescript
  const [, setSomething] = useState(false);
  ```

---

### **2. Unescaped Quotes in JSX**

**Error:**
```
`"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. react/no-unescaped-entities
```

**Fix:** Replace quotes with HTML entities:
```tsx
// ❌ BAD
<p>This is a "quote" example</p>

// ✅ GOOD
<p>This is a &quot;quote&quot; example</p>
```

---

### **3. Explicit `any` Type**

**Error:**
```
Unexpected any. Specify a different type. @typescript-eslint/no-explicit-any
```

**Fix:** Use `unknown` instead (type-safe):
```typescript
// ❌ BAD
function log(message: string, ...args: any[]): void { }

// ✅ GOOD
function log(message: string, ...args: unknown[]): void { }
```

---

### **4. Missing React Hook Dependencies**

**Error:**
```
React Hook useEffect has a missing dependency: 'functionName'. 
Either include it or remove the dependency array. react-hooks/exhaustive-deps
```

**When to Add Dependency:**
- If the function is used inside the effect AND you want the effect to re-run when it changes

**When to Ignore (add eslint-disable):**
- If you intentionally want the effect to run ONLY on specific triggers
- Example: Run only on mount, not when a function reference changes

```typescript
useEffect(() => {
  doSomething();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Only run on mount (intentionally omit doSomething)
```

---

### **5. Ref Value Warning in Cleanup**

**Error:**
```
The ref value 'someRef.current' will likely have changed by the time this effect 
cleanup function runs. react-hooks/exhaustive-deps
```

**Fix:** Capture ref value in a variable:
```typescript
// ❌ BAD
useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
}, []);

// ✅ GOOD
useEffect(() => {
  return () => {
    const timer = timerRef.current; // Capture in cleanup scope
    if (timer) {
      clearTimeout(timer);
    }
  };
}, []);
```

---

### **6. Unused Error Variables in Catch Blocks**

**Error:**
```
'error' is defined but never used. @typescript-eslint/no-unused-vars
```

**Fix:** Remove the variable if not needed:
```typescript
// ❌ BAD
try {
  doSomething();
} catch (error) {
  console.warn('Operation failed');
}

// ✅ GOOD
try {
  doSomething();
} catch {
  console.warn('Operation failed');
}
```

---

### **7. Anonymous Default Export**

**Error:**
```
Assign object to a variable before exporting as module default. import/no-anonymous-default-export
```

**Fix:** Create a named variable first:
```typescript
// ❌ BAD
export default { Component1, Component2 };

// ✅ GOOD
const ExportedComponents = { Component1, Component2 };
export default ExportedComponents;
```

---

## 🔍 Quick Scan Commands

### **Check specific file types:**

```bash
# Check all TypeScript files
npm run lint -- --ext .ts,.tsx

# Check only component files
npm run lint -- --file "src/components/**/*.tsx"

# Check only API routes
npm run lint -- --file "src/pages/api/**/*.ts"
```

### **Count errors by type:**

```bash
npm run lint 2>&1 | grep "Error:" | wc -l
```

---

## 📝 Before Every Push - Quick Checklist

- [ ] Run `npm run lint` on changed files
- [ ] Fix all **Errors** (blocking)
- [ ] Review **Warnings** (may be intentional)
- [ ] Test build locally if major changes (`npm run build`)
- [ ] Commit and push

---

## 🚨 What NOT to Do

❌ **Don't skip linting checks** - You'll fail in production  
❌ **Don't disable ESLint globally** - Fix the issue, don't hide it  
❌ **Don't guess at fixes** - Understand what the error means  
❌ **Don't install random packages** - Ask first if dependencies are needed  

---

## ✅ Best Practices

✅ **Lint early, lint often** - Check as you code  
✅ **Use IDE integration** - VSCode shows errors in real-time  
✅ **Understand the error** - Don't blindly copy fixes  
✅ **Document intentional eslint-disables** - Leave a comment explaining why  

---

## 🔧 IDE Setup (VSCode)

Install these extensions for real-time linting:
1. **ESLint** by Microsoft
2. **TypeScript ESLint** by Visual Studio Code

Configure settings (`.vscode/settings.json`):
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

---

## 📚 Resources

- [Next.js ESLint Config](https://nextjs.org/docs/app/api-reference/config/eslint)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)

---

**Remember:** Catching errors locally is always faster and cheaper than finding out in production! 🎯

