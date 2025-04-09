# Reading Practice Tool

## Overview
This tool leverages OpenAI's Realtime API for speech-to-text processing, enabling real-time word tracking and a visual progress bar for users.

## Prerequisites
- Node.js (v16+)
- OpenAI API Key (stored in root `.env.local`)

## Project Structure
```
reading-practice/
├── components/          # UI components
├── hooks/              # Custom hooks
├── types/              # Type definitions
├── package.json        # Project dependencies
└── tsconfig.json      # TypeScript config
```

## Features
- Real-time word tracking
- Visual progress bar
- WebSocket communication
- Speech-to-text processing

## Implementation Details

### Real-Time Word Tracking
The tool uses WebSocket connections to stream audio data and process speech in real-time.

### Progress Visualization
Includes a progress bar showing reading completion and word highlighting.

## API Integration
Uses OpenAI's API for speech-to-text processing, configured via the root `.env.local` file.

## Next Steps & Optimizations
- Enhance word matching accuracy
- Add color variations for word status
- Implement real-time speed & accuracy tracking
- Optimize WebSocket handling for reduced latency 