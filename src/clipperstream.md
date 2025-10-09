Clipstream Project Context & Implementation Brief
Project Overview
Clipstream is an offline-first voice transcription app being built as a React Native/Expo application. The developer has extensive experience with web development (specifically a project called "AI Confidence Tracker") and wants to leverage those patterns while building their first mobile app.
Key Product Requirements

Offline-first: Records audio even without internet, queues for transcription when online
Minimal friction: "Like taking a screenshot" - one tap to record, automatic transcription
Trust-centered: Never loses data, always recoverable
iOS primary target: Using Expo to enable cross-platform development

Technical Context
Current Environment
The developer works within a monorepo structure called final-exp:
final-exp/                          # Existing monorepo
├── src/
│   ├── projects/
│   │   └── ai-confidence-tracker/  # Existing web project (reference)
│   └── pages/                      # Next.js pages
└── apps/                           # Where Clipstream will live
    └── clipstream/                 # To be created
Technology Decisions Made

React Native with Expo - Chosen for rapid development and iOS deployment
TypeScript - Maintaining consistency with existing projects
Expo Router - File-based routing similar to Next.js
UI-First Development - Build all screens first, then add functionality

Implementation Approach
Why UI-First?

The developer is strong in UI/design (proven with AI Confidence Tracker)
Backend is straightforward (recording → storage → transcription)
Allows immediate visual validation
Similar to their successful web development workflow

Component Architecture (Referencing AI Confidence Tracker)
The developer wants to reuse patterns from their AI Confidence Tracker project:
AI Confidence Tracker Pattern     →  Clipstream Equivalent
──────────────────────────────────────────────────────────
IntegratedDeepCard.tsx           →  RecordingInterface.tsx
deepMorphingButtons.tsx          →  MorphingButtons.tsx (direct port)
useDeepgramProcessing hook       →  useOfflineQueue hook
TranscriptTextStates.tsx         →  ClipsList.tsx
deepButtons.tsx (all in one)     →  Buttons.tsx (all in one)
Styling Strategy
The developer prefers:

Single files for related components (e.g., all buttons in Buttons.tsx)
CSS-first prototyping then converting to React Native StyleSheet
Morphing animations between button states (not separate components)

Example translation they'll use:
css/* CSS (their comfort zone) */
.button {
  padding: 20px 15px;
  background-color: #1E293B;
  border-radius: 16px;
}
tsx// React Native equivalent
button: {
  paddingVertical: 20,
  paddingHorizontal: 15,
  backgroundColor: '#1E293B',
  borderRadius: 16,
}
Current Status & Next Steps
Immediate Tasks

Initialize Expo project in the monorepo:

bash   cd apps
   npx create-expo-app clipstream --template blank-typescript

Create UI components (Phase 1):

Recording screen with morphing button
Clips list screen
Offline banner
Search interface



File Structure to Create
apps/clipstream/
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Recording screen
│   │   └── clips.tsx      # Clips list
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Buttons.tsx         # All buttons
│   │       ├── MorphingButtons.tsx # Morphing animations
│   │       ├── ClipRow.tsx
│   │       └── OfflineBanner.tsx
│   ├── styles/
│   │   └── theme.ts       # Colors, spacing constants
│   └── types/
│       └── index.ts
└── package.json
UI Screens to Build (Reference Images)

A1-A3: Main clips list with search
B1-B2: Search interface
D1-D3: Recording interface with offline state

Important Technical Considerations
React Native Differences

No HTML elements: Use View, Text, TouchableOpacity
No CSS files: Styles are JavaScript objects
No hover states: Design for touch only
Animations: Use Animated API instead of CSS transitions

Reusable Elements from AI Confidence Tracker

State management patterns (custom hooks)
Error handling approach
Component composition style
Morphing button animations (adapted for React Native)

Development Philosophy
The developer wants to:

Move fast - UI first, functionality second
Reuse patterns - Leverage AI Confidence Tracker architecture
Keep it simple - No over-engineering
Style in CSS first - Then translate to React Native

Key Success Factors

Maintain monorepo structure - Don't break existing projects
Port UI patterns - Make it feel like AI Confidence Tracker
Focus on iOS first - Android is secondary
Offline-first architecture - Core feature, not an afterthought


Starting Point: The developer should begin by creating the Expo project and building the recording interface screen (D1-D3 from mockups) as a static UI, using their CSS-first approach and then converting to React Native styles.
Project Name: ClipstreamRetryClaude can make mistakes. Please double-check responses.