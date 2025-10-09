# 🎯 Infinite Tic-Tac-Toe Arena
## Claude 3.5 Sonnet vs GPT-4

An infinite AI-vs-AI Tic-Tac-Toe game where Claude and GPT-4 battle continuously with move decay mechanics.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your OpenRouter API key
# Get one at: https://openrouter.ai/keys
```

### 2. Install Dependencies
```bash
# From the tictactoe directory
npm install

# Or from project root (if using npm workspaces)
npm install --workspace=tictactoe
```

### 3. Development
```bash
npm run dev
```

## 🎮 How It Works

- **Infinite Gameplay**: Games auto-reset when someone wins
- **Move Decay**: Pieces disappear after 7 turns, preventing draws
- **Real-time Commentary**: See each AI's reasoning for their moves
- **500ms Turn Intervals**: Fast-paced AI battles
- **Mobile Responsive**: Works on all devices

## 🏗️ Project Structure - LEAN APPROACH

```
tictactoe/
├── components/          # React components (2 files)
│   ├── GameArena.tsx   # Main container (header + commentary + controls)
│   └── GameBoard.tsx   # Pure 3x3 grid with animations
├── hooks/              # Custom React hooks (1 file)
│   └── useGameState.ts # All game logic consolidated
├── api/                # Next.js API routes (1 file)
│   └── arena.ts        # Single AI orchestration endpoint
├── utils/              # Utility functions (1 file)
│   └── gameLogic.ts    # Pure functions (win detection, validation)
├── types/              # TypeScript definitions
│   └── game.ts         # Complete type system
└── styles/             # Styling (1 file)
    └── arena.module.css # All styles with organized sections
```

**Total: 5 core implementation files** (reduced from 16+ files)

## 🔧 Configuration

Game behavior can be customized via environment variables:

- `NEXT_PUBLIC_TURN_DELAY`: Time between moves (ms)
- `NEXT_PUBLIC_MAX_TURNS`: Safety limit for infinite games
- `NEXT_PUBLIC_MOVE_DECAY_LIMIT`: Turns before pieces decay
- `NEXT_PUBLIC_DEBUG_MODE`: Enable detailed logging

## 🎯 Features

### Core Mechanics
- ✅ 3x3 Tic-Tac-Toe grid
- ✅ AI vs AI gameplay
- ✅ Move decay system (7-turn FIFO)
- ✅ Win detection & auto-reset
- ✅ Infinite game loop

### AI Integration
- ✅ OpenRouter API integration
- ✅ Claude 3.5 Sonnet vs GPT-4
- ✅ Move reasoning display
- ✅ Error recovery & retries

### User Experience
- ✅ Real-time animations
- ✅ Mobile-first responsive design
- ✅ Live game commentary
- ✅ Turn counter & status display

## 🚀 Deployment

The project is designed to deploy seamlessly within the Final-Exp monorepo structure on Vercel with edge function support for the API routes.

## 📝 Development Status

This project follows a **lean development approach** with reduced complexity:

- **Phase 1**: ✅ Project Foundation (Complete)
- **Phase 2**: ⏳ Core Game Engine (Consolidated)
- **Phase 3**: ⏳ API Integration (Single Endpoint)
- **Phase 4**: ⏳ User Interface (2 Components)
- **Phase 5**: ⏳ Integration & Polish

**Complexity Reduction:** 30 tasks → 18 tasks | 16+ files → 5 files

See `implementation-plan-lean.md` for the streamlined development roadmap. 