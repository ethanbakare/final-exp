# ClipperStream

> Offline-First Voice Transcription PWA

## Overview

ClipperStream is a Progressive Web App (PWA) that records voice snippets and auto-transcribes them when online. Built with a mobile-first design, it works seamlessly offline and maintains a queue of recordings for automatic processing.

## Features

- **One-tap recording** - Instant voice capture
- **Offline-first** - Records work without internet
- **Auto-transcription** - Processes clips when back online
- **Manual retry** - Retry failed transcriptions
- **Text actions** - Copy and cleanup transcribed text
- **Search** - Find clips quickly
- **PWA** - Installable on iOS/Android home screen

## Tech Stack

- **Next.js** - React framework
- **TypeScript** - Type safety
- **Web Audio API** - Browser recording
- **IndexedDB** - Local storage
- **Service Workers** - Offline functionality

## Development

This project follows the AI Confidence Tracker patterns:
- UI-first development
- Morphing button states
- Consolidated component files
- Single CSS module

## Structure

```
clipperstream/
├── components/ui/     # UI components
├── hooks/             # Custom hooks
├── services/          # API and storage
├── styles/            # CSS modules
└── types/             # TypeScript definitions
```

## Getting Started

View at: `http://localhost:3000/clipperstream`

## Status

🚧 **In Development** - Phase 1: Foundation Setup

