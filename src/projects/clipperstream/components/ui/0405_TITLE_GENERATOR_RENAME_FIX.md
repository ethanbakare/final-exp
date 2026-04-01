# 045 - Title Generator & Rename Architecture Fix

**Status**: 🔴 SCOPE CREEP - Not part of current retry logic implementation  
**Priority**: Low (post-v1.50)  
**Type**: Architectural improvement

---

## 📋 PROBLEM STATEMENT

### Current Architecture Flaw

The system uses **text pattern matching** to decide whether to run the AI title generator:

```typescript
// ClipMasterScreen.tsx (Line 1136)
if (currentParent && currentParent.title.startsWith('Recording ')) {
  generateTitleInBackground(parentId, result.formattedText);
}
```

**This is fundamentally flawed** because it conflates:
- **Content** (what the title says)
- **Source** (who/what set the title)

---

## 🚨 EDGE CASES THAT BREAK CURRENT LOGIC

### 1. User Names Clip "Recording 01"

| Step | Title | `startsWith('Recording ')` | TitleGenerator Runs? | Expected? |
|------|-------|---------------------------|---------------------|-----------|
| User renames clip | `"Recording 01"` | ✅ TRUE | ✅ YES | ❌ NO (user's choice!) |
| First clip transcribes | `"Recording 01"` | ✅ TRUE | ✅ YES | ❌ NO |
| **Result** | AI overwrites user's title | — | — | 🐛 **BUG** |

---

### 2. AI Generates Title Starting with "Recording"

| Step | Title | `startsWith('Recording ')` | TitleGenerator Runs? | Expected? |
|------|-------|---------------------------|---------------------|-----------|
| System creates clip | `"Recording 01"` | ✅ TRUE | ✅ YES | ✅ YES |
| First clip → AI title | `"Recording Session Notes"` | ✅ TRUE | ✅ YES | ❌ NO (already AI!) |
| Second clip transcribes | `"Recording Session Notes"` | ✅ TRUE | ✅ YES | ❌ NO |
| **Result** | AI overwrites its own title | — | — | 🐛 **BUG** |

**Real Examples from GPT-4**:
- "Recording Session with Team Lead"
- "Recording of Client Meeting"
- "Recording Notes from Workshop"

All of these would incorrectly trigger title regeneration!

---

### 3. User Clicks "Save" Without Changing Anything

**Current Behavior**: Save button is always enabled

```typescript
// clipModal.tsx (Line 210-215)
<ButtonFull 
  onClick={onSave}
  fullWidth
>
  Save
</ButtonFull>
```

**No validation** → Unnecessary state updates when user doesn't actually change the title.

---

## ✅ PROPOSED SOLUTION: Metadata Flag

### Architecture Change

Replace text pattern matching with **explicit metadata tracking**:

```typescript
export interface Clip {
  id: string;
  title: string;
  // ✅ NEW: Track WHO set the title, not WHAT it says
  titleIsUserSet?: boolean;  // false = system/AI, true = user edited
  // ... other fields
}
```

---

## 📐 IMPLEMENTATION PLAN

### Step 1: Add `titleIsUserSet` to Clip Interface

```typescript
// clipStore.ts
export interface Clip {
  id: string;
  createdAt: number;
  title: string;
  titleIsUserSet?: boolean;  // ← NEW FIELD
  date: string;
  rawText: string;
  formattedText: string;
  // ... rest of fields
}
```

**Default Value**: `undefined` or `false` = system/AI-generated (replaceable)

---

### Step 2: Update Clip Creation (System-Generated)

```typescript
// clipStore.ts - createParentWithChildPending
const parent: Clip = {
  id: parentId,
  createdAt: Date.now(),
  title: recordingTitle,      // "Recording 01"
  titleIsUserSet: false,       // ← System default
  date: today(),
  rawText: '',
  formattedText: '',
  content: '',
  status: null,
  currentView: 'formatted'
};
```

---

### Step 3: Update Rename Handler (User-Set)

```typescript
// ClipHomeScreen.tsx - handleConfirmRename
const handleConfirmRename = useCallback(() => {
  if (!selectedClip || !renameValue.trim()) return;
  
  // ✅ Only update if value actually changed
  if (renameValue !== selectedClip.title) {
    updateClip(selectedClip.id, { 
      title: renameValue,
      titleIsUserSet: true  // ← Mark as user-edited
    });
  }
  // If unchanged, silently close modal (no DB write)
  
  setActiveModal(null);
  setSelectedClip(null);
}, [selectedClip, renameValue, updateClip]);
```

**Benefits**:
- Prevents unnecessary updates when user doesn't change anything
- Marks title as "user-owned" so AI won't overwrite it

---

### Step 4: Update AI Title Generation (Replaceable)

```typescript
// ClipMasterScreen.tsx - generateTitleInBackground
const generateTitleInBackground = useCallback(async (clipId: string, transcriptionText: string) => {
  const startTime = performance.now();
  log.debug('Starting background title generation', { clipId });
  
  try {
    const title = await generateClipTitle(transcriptionText, apiKey);
    
    if (title && title !== 'New Recording') {
      updateClip(clipId, { 
        title: title,
        titleIsUserSet: false  // ← AI-generated (still replaceable)
      });
      
      log.debug('Title generated', { clipId, title });
    }
  } catch (error) {
    log.error('Title generation failed', { clipId, error });
  }
}, [updateClip, apiKey]);
```

**Key**: AI-generated titles keep `titleIsUserSet: false`, so they can be replaced by better AI titles later.

---

### Step 5: Fix Decision Logic (Check Flag, Not Text!)

```typescript
// ClipMasterScreen.tsx - processParentChildren (Line ~1136)
const currentParent = getClipById(parentId);

// ❌ OLD (FLAWED): Text pattern matching
// if (currentParent && currentParent.title.startsWith('Recording ')) {

// ✅ NEW (ROBUST): Check metadata flag
if (currentParent && !currentParent.titleIsUserSet) {
  console.log('[ProcessChildren] Generating title (not user-set)');
  generateTitleInBackground(parentId, result.formattedText).catch(err => {
    console.error('[ProcessChildren] Title generation failed:', err);
  });
} else if (currentParent?.titleIsUserSet) {
  console.log('[ProcessChildren] Skipping title generation (user-set)');
}
```

**Logic**: Only generate title if flag is `false` or `undefined` (system/AI-owned).

---

## 📊 ALL SCENARIOS WITH SOLUTION

| Scenario | Title Value | `titleIsUserSet` | TitleGenerator Runs? | Correct? |
|----------|-------------|------------------|---------------------|----------|
| **System default** | `"Recording 01"` | `false` | ✅ YES | ✅ YES |
| **AI: "Meeting Notes"** | `"Meeting Notes"` | `false` | ✅ YES (replaceable) | ✅ YES |
| **AI: "Recording of Meeting"** | `"Recording of Meeting"` | `false` | ✅ YES (replaceable) | ✅ **YES (FIXED!)** |
| **User: "My Notes"** | `"My Notes"` | `true` | ❌ NO | ✅ YES |
| **User: "Recording 01"** | `"Recording 01"` | `true` | ❌ NO | ✅ **YES (FIXED!)** |
| **User: unchanged save** | `"Recording 01"` | `false` | ✅ YES | ✅ YES (no update) |

---

## 🎯 WHY METADATA FLAG IS SUPERIOR

### Text Pattern Matching (Current)
```typescript
if (title.startsWith('Recording ')) { ... }
```

**Problems**:
- ❌ Fails if AI generates "Recording Session Notes"
- ❌ Fails if user deliberately names "Recording 01"
- ❌ Fragile - breaks if we change default format
- ❌ No way to distinguish source vs content
- ❌ Language-dependent (breaks with i18n)

### Metadata Flag (Proposed)
```typescript
if (!titleIsUserSet) { ... }
```

**Benefits**:
- ✅ Works regardless of title content
- ✅ Tracks WHO set it (system/AI/user)
- ✅ AI can generate any title without breaking logic
- ✅ User can name anything without breaking logic
- ✅ Explicit, maintainable, future-proof
- ✅ Language-agnostic (ready for i18n)

---

## 🔧 OPTIONAL UX ENHANCEMENT

### Disable Save Button When Unchanged

```typescript
// clipModal.tsx - ClipRenameModalFull
export const ClipRenameModalFull: React.FC<ClipRenameModalFullProps> = ({ 
  onCancel,
  onSave,
  value,
  onChange,
  originalValue,  // ← NEW PROP (pass current title)
  isVisible = true,
  className = '' 
}) => {
  // Check if value actually changed
  const hasChanged = value !== originalValue;
  
  return (
    <>
      <div className={`rename-card-full ${className} ${styles.container}`}>
        {/* ... header and input ... */}
        
        <div className="rename-buttons-full">
          <ButtonOutline onClick={onCancel} fullWidth>
            Cancel
          </ButtonOutline>
          
          <ButtonFull 
            onClick={onSave}
            disabled={!hasChanged}  // ← Disable if unchanged
            fullWidth
          >
            Save
          </ButtonFull>
        </div>
      </div>
    </>
  );
};
```

**Note**: This is **optional**. The handler's `if (renameValue !== selectedClip.title)` check already prevents unnecessary updates.

---

## 📝 MIGRATION NOTES

### Backwards Compatibility

Existing clips without `titleIsUserSet`:
- `undefined` → Treat as `false` (system/AI-generated)
- Safe to replace with AI titles

### Storage Impact

- **Web demo**: `sessionStorage` → No migration needed (ephemeral)
- **Expo app**: `AsyncStorage` → Existing clips get `titleIsUserSet: undefined` → defaults to `false`

**No data loss or breaking changes.**

---

## 🚦 IMPLEMENTATION STATUS

- [ ] Add `titleIsUserSet` to Clip interface
- [ ] Update `createParentWithChildPending` (system default)
- [ ] Update `handleConfirmRename` (user-set + validation)
- [ ] Update `generateTitleInBackground` (AI-generated)
- [ ] Update `processParentChildren` decision logic
- [ ] Test all scenarios
- [ ] Optional: Disable Save button when unchanged

---

## 🎯 CONCLUSION

**The Problem**: Text pattern matching conflates "what the title says" with "who set the title"

**The Solution**: `titleIsUserSet` is metadata that separates:
- **Content** (the actual title string)
- **Source** (who/what set it)

This is **production-ready, future-proof architecture** that handles all edge cases.

---

**Status**: Documented for future implementation (post-retry logic)  
**Priority**: Low (no user reports, rare edge cases)  
**Scope**: Outside current v1.50 retry logic implementation

