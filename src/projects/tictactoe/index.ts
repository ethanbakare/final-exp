// Main entry point for Infinite Tic-Tac-Toe Arena
// Claude 3.5 Sonnet vs GPT-4

// =============================================
// Tic-Tac-Toe Arena - Project Exports  
// =============================================

// Core game types
export type {
  PlayerSymbol,
  CellValue,
  BoardState,
  Move,
  GameState,
  AIPlayer,
  AIRequest,
  AIResponse,
  GameConfig,
  GameBoardProps,
  CommentaryProps,
  PlayerHeaderProps,
  GameError
} from './types/game';

// Game constants and defaults
export {
  PLAYERS,
  DEFAULT_CONFIG,
  INITIAL_GAME_STATE
} from './types/game';

// Error handling components
export { GameErrorBoundary, withGameErrorBoundary, useErrorHandler } from './components/GameErrorBoundary';

// Game logic utilities (25+ functions)
export {
  // Coordinate system functions
  coordinateToRowCol,
  rowColToCoordinate,
  getAllCoordinates,
  
  // Core game logic
  getWinningAlignments,
  createEmptyBoard,
  cloneBoard,
  getCellValue,
  setCellValue,
  isValidPosition,
  isCellEmpty,
  isValidMove,
  checkWinner,
  isBoardFull,
  isGameComplete,
  applyMove,
  
  // Move management
  generateMoveId,
  createMove,
  calculateMoveOpacity,
  getDecayedMoves,
  removeDecayedMoves,
  reconstructBoardFromMoves,
  
  // Game state utilities
  getNextPlayer,
  countMoves,
  getEmptyPositions,
  boardToString,
  createBoardVisualization,
  getOccupiedPositions,
  getAvailablePositions,
  getDecayPredictions,
  getUpcomingFreePositions,
  createMoveCommentary
} from './utils/gameLogic';

// Game state management hook
export { useGameState } from './hooks/useGameState';

// API functions - AI orchestration
export {
  createStrategicPrompt,
  parseAIResponse,
  getAIMove,
  validateMove
} from './api/ArenaApi';

export type { AIPlayer as APIPlayerType } from './api/ArenaApi';

// =============================================
// Phase 2 Corrections Applied ✅
// =============================================
// - Move decay timing: Turn 7 disappearance (not turn 8)
// - A1-C3 coordinate system with winning alignments  
// - Simple commentary: "Claude put X on B2" format
// - AI strategic awareness: board state + decay predictions
// - Complete useGameState hook consolidation

// =============================================
// Phase 3 Implementation ✅ 
// =============================================
// - Arena API endpoint: /pages/api/tictactoe/arena.ts
// - AI strategic prompts with complete board state
// - Simple response parsing for A1-C3 coordinates
// - OpenRouter integration with Claude & GPT-4

// Project metadata
export const PROJECT_INFO = {
  name: 'Infinite Tic-Tac-Toe Arena',
  version: '1.0.0',
  description: 'AI vs AI Tic-Tac-Toe with move decay: Claude 3.5 Sonnet vs GPT-4',
  phase: 'Phase 4 COMPLETE - User Interface',
  status: '🎉 READY FOR PRODUCTION - All Phases Complete!',
  completedPhases: [
    '✅ Phase 1: Foundation (T-01 to T-04)',
    '✅ Phase 2: Core Game Engine (T-05 to T-08)',
    '✅ Phase 3: API Layer (T-09 to T-11)',
    '✅ Phase 4: User Interface (T-12 to T-15)',
    '✅ Phase 5: Integration (T-16 to T-17)'
  ],
  features: [
    'Real-time Claude 3.5 Sonnet vs GPT-4 battles',
    'Move decay system with 7-turn lifetime',
    'A1-C3 coordinate system with strategic AI awareness',
    'Responsive design with mobile optimization',
    'Auto-reset infinite gameplay',
    'Live commentary and move history',
    'Error handling and recovery'
  ]
} as const;