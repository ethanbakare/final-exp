# Voice Interface Documentation

This folder contains all documentation for the Voice Interface project.

## Naming Convention

### Category Prefixes
| Prefix | Category | Description |
|--------|----------|-------------|
| `A` | Architecture | Core setup and architecture docs |
| `V` | Variations | Voice interface variation implementations |
| `VLV` | Velvet | Velvet orb 3D visualization |
| `RTC` | Realtime | OpenAI Realtime API / WebRTC |

### Type Suffixes
| Suffix | Type | Description |
|--------|------|-------------|
| `_IMPL` | Implementation | How to build/implement something |
| `_DESIGN` | Design | Visual or architectural design plans |
| `_BUG` | Bug/Issue | Something broken that needs fixing |
| `_REF` | Reference | Documentation for how something works |
| `_SPEC` | Specification | Requirements or detailed specs |

### Format
- **Category-specific:** `[PREFIX][##]_TYPE_DESCRIPTIVE_NAME.md`
- **General:** `TYPE_DESCRIPTIVE_NAME.md`

---

## Document Index

### Architecture (A)
| File | Created | Status | Summary |
|------|---------|--------|---------|
| A01_VOICE_INTERFACE_SETUP.md | - | Reference | Initial voice interface setup |
| A02_BUTTON_SPECIFICATIONS.md | - | Reference | Button component specifications |
| A03_IMPLEMENTATION_NOTES.md | - | Reference | Implementation notes and decisions |

### Variations (V)
| File | Created | Status | Summary |
|------|---------|--------|---------|
| V01_VOICE_INTERFACE_IMPLEMENTATION_COMPLETE.md | - | Implemented | Complete voice interface implementation |
| V02_VOICE_INTERFACE_THREE_VARIATIONS_IMPLEMENTATION_PLAN.md | - | Implemented | Three variations implementation plan |
| V03_MORPHING_BUTTONS_IMPLEMENTATION_PLAN.md | - | Implemented | Morphing button components |
| V04_BATCH_VS_STREAMING_REFACTOR_PLAN.md | - | Implemented | Batch vs streaming transcription |

### Velvet Orb (VLV)
| File | Created | Status | Summary |
|------|---------|--------|---------|
| VELVET_REDESIGN_PLAN.md | - | Implemented | Velvet orb redesign plan |
| VELVET_IMPLEMENTATION_ISSUES.md | - | Reference | Issues found during Velvet implementation |

### Realtime / WebRTC (RTC)
| File | Created | Status | Summary |
|------|---------|--------|---------|
| REALTIME_EVENT_SYSTEM_FIX.md | 2026-02-04 | Implemented | WebRTC event system fix for state detection |
| CONNECTION_RACE_CONDITION_ISSUE.md | 2026-02-05 | Documented | Quick start/stop race condition bug |

### General
| File | Created | Status | Summary |
|------|---------|--------|---------|
| REACT_DOWNGRADE_PLAN.md | - | Implemented | React 19 → 18 downgrade for Three.js |
| VOICE_ARCHITECTURE.md | - | Reference | Overall voice interface architecture |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `Documented` | Issue/plan documented, not yet implemented |
| `In Progress` | Currently being worked on |
| `Implemented` | Completed and working |
| `Deprecated` | No longer relevant |

---

## Adding New Documents

1. Determine the category (VLV, RTC, A, V, or General)
2. Find the next number in that category
3. Choose the type suffix (_IMPL, _DESIGN, _BUG, _REF, _SPEC)
4. Add frontmatter header to the document:

```markdown
---
title: Your Document Title
created: YYYY-MM-DD
status: documented | in-progress | implemented | deprecated
related: [OTHER_DOC.md]
summary: One-line summary of what this document is about
---
```

5. Update this README index with the new entry
