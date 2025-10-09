// Core game types for Infinite Tic-Tac-Toe Arena
export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;
export type BoardState = CellValue[][];

// Individual move with metadata
export interface Move {
  id: string;
  row: number;
  col: number;
  coordinate: string; // A1-C3 coordinate (e.g., "B2")
  symbol: PlayerSymbol;
  turnNumber: number;
  timestamp: number;
}

// Main game state interface
export interface GameState {
  board: BoardState;
  activeMoves: Move[];
  currentPlayer: PlayerSymbol;
  turnNumber: number;
  gameStatus: 'playing' | 'claude_wins' | 'gpt_wins' | 'draw' | 'paused' | 'error';
  winner?: PlayerSymbol;
  isGameActive: boolean;
  lastMove?: Move;
  moveHistory: string[]; // Simple move history: ["Claude put X on B2", "GPT put O on A1"]
  maxTurns: number;
  moveDecayLimit: number; // Number of turns before a move decays
}

// AI Player configuration
export interface AIPlayer {
  symbol: PlayerSymbol;
  name: 'Claude' | 'GPT-4';
  model: string; // OpenRouter model identifier
  displayName: string;
  color: string;
}

// API request/response types
export interface AIRequest {
  gameState: GameState;
  player: AIPlayer;
  boardVisualization: string;
}

export interface AIResponse {
  coordinate: string; // Simple A1-C3 response (e.g., "B2")
}

// Game configuration
export interface GameConfig {
  autoPlay: boolean;
  turnDelay: number; // milliseconds between moves
  maxTurns: number;
  moveDecayLimit: number;
  enableCommentary: boolean;
  pauseOnWin: number; // milliseconds to pause after win
}

// UI component props
export interface GameBoardProps {
  gameState: GameState;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
}

export interface CommentaryProps {
  lastMove?: Move;
  gameStatus: GameState['gameStatus'];
  currentPlayer: PlayerSymbol;
}

export interface PlayerHeaderProps {
  claudePlayer: AIPlayer;
  gptPlayer: AIPlayer;
  currentPlayer: PlayerSymbol;
  turnNumber: number;
}

// Error types
export interface GameError {
  type: 'api_error' | 'parsing_error' | 'validation_error' | 'timeout_error';
  message: string;
  retryCount?: number;
  timestamp: number;
}

// Constants
export const PLAYERS: Record<PlayerSymbol, AIPlayer> = {
  X: {
    symbol: 'X',
    name: 'Claude',
    model: 'anthropic/claude-3.5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    color: '#FF6B35'
  },
  O: {
    symbol: 'O', 
    name: 'GPT-4',
    model: 'openai/gpt-4',
    displayName: 'GPT-4',
    color: '#4ECDC4'
  }
};

export const DEFAULT_CONFIG: GameConfig = {
  autoPlay: true,
  turnDelay: 500,
  maxTurns: 50,
  moveDecayLimit: 7,
  enableCommentary: true,
  pauseOnWin: 2000
};

export const INITIAL_GAME_STATE: GameState = {
  board: [
    [null, null, null],
    [null, null, null], 
    [null, null, null]
  ],
  activeMoves: [],
  currentPlayer: 'X', // Claude starts
  turnNumber: 0,
  gameStatus: 'playing',
  isGameActive: false,
  moveHistory: [],
  maxTurns: DEFAULT_CONFIG.maxTurns,
  moveDecayLimit: DEFAULT_CONFIG.moveDecayLimit
}; 