// Consolidated game state hook - T-05 + T-06
// All game logic: board state, AI controller, move decay, animations

import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  GameState, 
  Move, 
  PlayerSymbol, 
  AIPlayer, 
  GameConfig,
  AIResponse,
  GameError
} from '../types/game';
import { 
  INITIAL_GAME_STATE, 
  DEFAULT_CONFIG, 
  PLAYERS 
} from '../types/game';
import {
  createEmptyBoard,
  reconstructBoardFromMoves,
  removeDecayedMoves,
  getDecayedMoves,
  calculateMoveOpacity,
  checkWinner,
  isValidMove,
  createMove,
  getNextPlayer,
  createBoardVisualization,
  isGameComplete,
  coordinateToRowCol,
  rowColToCoordinate,
  createMoveCommentary,
  getOccupiedPositions,
  getAvailablePositions,
  getDecayPredictions,
  getWinningAlignments
} from '../utils/gameLogic';

interface UseGameStateReturn {
  // Game state
  gameState: GameState;
  
  // Move decay calculations
  getMoveOpacity: (move: Move) => number;
  getDecayingMoves: () => Move[];
  
  // Game actions
  makeMove: (row: number, col: number) => boolean;
  makeMoveByCoordinate: (coordinate: string) => boolean;
  resetGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  
  // AI controller
  requestAIMove: () => Promise<void>;
  isAIThinking: boolean;
  
  // Error handling
  lastError: GameError | null;
  clearError: () => void;
}

export function useGameState(config: Partial<GameConfig> = {}): UseGameStateReturn {
  // Merge config with defaults
  const gameConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Core game state
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastError, setLastError] = useState<GameError | null>(null);
  
  // Refs for managing intervals and timeouts
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ===== MOVE DECAY SYSTEM (T-06) =====
  
  /**
   * Calculate opacity for a move based on its age
   */
  const getMoveOpacity = useCallback((move: Move): number => {
    const moveAge = gameState.turnNumber - move.turnNumber;
    return calculateMoveOpacity(moveAge, gameState.moveDecayLimit);
  }, [gameState.turnNumber, gameState.moveDecayLimit]);
  
  /**
   * Get moves that are about to decay (for animation)
   */
  const getDecayingMoves = useCallback((): Move[] => {
    return getDecayedMoves(
      gameState.activeMoves, 
      gameState.turnNumber, 
      gameState.moveDecayLimit
    );
  }, [gameState.activeMoves, gameState.turnNumber, gameState.moveDecayLimit]);
  
  /**
   * Process move decay and update board state
   */
  const processDecay = useCallback(() => {
    setGameState(prevState => {
      console.log(`🌊 DECAY: Processing on turn ${prevState.turnNumber}, decay limit: ${prevState.moveDecayLimit}`);
      console.log(`🌊 DECAY: Active moves before (${prevState.activeMoves.length}):`, prevState.activeMoves.map(move => 
        `${move.coordinate}(${move.symbol})-turn${move.turnNumber}-age${prevState.turnNumber - move.turnNumber}`
      ).join(', '));
      
      // Remove decayed moves
      const newActiveMoves = removeDecayedMoves(
        prevState.activeMoves,
        prevState.turnNumber,
        prevState.moveDecayLimit
      );
      
      console.log(`🌊 DECAY: Active moves after (${newActiveMoves.length}):`, newActiveMoves.map(move => 
        `${move.coordinate}(${move.symbol})-turn${move.turnNumber}-age${prevState.turnNumber - move.turnNumber}`
      ).join(', '));
      
      // Reconstruct board from remaining moves
      const newBoard = reconstructBoardFromMoves(newActiveMoves);
      
      console.log(`🌊 DECAY: Board before:`, JSON.stringify(prevState.board));
      console.log(`🌊 DECAY: Board after:`, JSON.stringify(newBoard));
      
      return {
        ...prevState,
        activeMoves: newActiveMoves,
        board: newBoard
      };
    });
  }, []);
  
  // ===== CORE GAME LOGIC (T-05) =====
  
  /**
   * Make a move on the board using row/col
   */
  const makeMove = useCallback((
    row: number, 
    col: number
  ): boolean => {
    console.log(`🎯 MAKE_MOVE: ${gameState.currentPlayer} attempting (${row},${col}) on turn ${gameState.turnNumber}`);
    console.log(`🎯 MAKE_MOVE: Current board:`, JSON.stringify(gameState.board));
    console.log(`🎯 MAKE_MOVE: Current active moves (${gameState.activeMoves.length}):`, gameState.activeMoves.map(move => 
      `${move.coordinate}(${move.symbol})-turn${move.turnNumber}`
    ).join(', '));
    
    // Validate move
    if (!isValidMove(gameState.board, row, col)) {
      console.log(`❌ MAKE_MOVE: Invalid - position (${row},${col}) value: ${gameState.board[row][col]}`);
      setLastError({
        type: 'validation_error',
        message: `Invalid move at position (${row}, ${col})`,
        timestamp: Date.now()
      });
      return false;
    }
    
    console.log(`✅ MAKE_MOVE: Valid move, creating move object`);
    
    // Create new move
    const newMove = createMove(
      row, 
      col, 
      gameState.currentPlayer, 
      gameState.turnNumber + 1
    );
    
    console.log(`🎯 MAKE_MOVE: Created move:`, newMove);
    
    // Get player name for commentary
    const playerName = gameState.currentPlayer === 'X' ? 'Claude' : 'ChatGPT';
    const commentary = createMoveCommentary(playerName, gameState.currentPlayer, newMove.coordinate);
    
    setGameState(prevState => {
      // Add new move to active moves
      const newActiveMoves = [...prevState.activeMoves, newMove];
      
      // Reconstruct board with new move
      const newBoard = reconstructBoardFromMoves(newActiveMoves);
      
      console.log(`🎯 MAKE_MOVE: New board after move:`, JSON.stringify(newBoard));
      
      // Check for winner
      const winner = checkWinner(newBoard);
      const isComplete = isGameComplete(newBoard);
      
      // Determine game status
      let gameStatus: GameState['gameStatus'] = 'playing';
      if (winner === 'X') gameStatus = 'claude_wins';
      else if (winner === 'O') gameStatus = 'gpt_wins';
      else if (isComplete) gameStatus = 'draw';
      
      // Add to move history  
      const newMoveHistory = [...prevState.moveHistory, commentary];
      
      return {
        ...prevState,
        board: newBoard,
        activeMoves: newActiveMoves,
        currentPlayer: getNextPlayer(prevState.currentPlayer),
        turnNumber: prevState.turnNumber + 1,
        gameStatus,
        winner: winner || undefined,
        lastMove: newMove,
        moveHistory: newMoveHistory
      };
    });
    
    return true;
  }, [gameState.board, gameState.currentPlayer, gameState.turnNumber]);

  /**
   * Make a move using A1-C3 coordinate
   */
  const makeMoveByCoordinate = useCallback((coordinate: string): boolean => {
    try {
      const { row, col } = coordinateToRowCol(coordinate);
      return makeMove(row, col);
    } catch (error) {
      setLastError({
        type: 'validation_error',
        message: `Invalid coordinate: ${coordinate}`,
        timestamp: Date.now()
      });
      return false;
    }
  }, [makeMove]);
  
  /**
   * Reset the game to initial state
   */
  const resetGame = useCallback(() => {
    // Clear any running timers
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
    
    setGameState({
      ...INITIAL_GAME_STATE,
      maxTurns: gameConfig.maxTurns,
      moveDecayLimit: gameConfig.moveDecayLimit,
      moveHistory: []
    });
    setIsAIThinking(false);
    setLastError(null);
  }, [gameConfig.maxTurns, gameConfig.moveDecayLimit]);
  
  /**
   * Start the game (enable AI auto-play)
   */
  const startGame = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isGameActive: true,
      gameStatus: 'playing'
    }));
  }, []);
  
  /**
   * Pause the game
   */
  const pauseGame = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isGameActive: false,
      gameStatus: 'paused'
    }));
    
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);
  
  // ===== AI CONTROLLER =====
  
  /**
   * Request an AI move from the current player
   */
  const requestAIMove = useCallback(async (): Promise<void> => {
    if (isAIThinking || gameState.gameStatus !== 'playing') {
      return;
    }
    
    setIsAIThinking(true);
    setLastError(null);
    
    try {
      // Map PlayerSymbol to AIPlayer string
      const currentAIPlayer = gameState.currentPlayer === 'X' ? 'claude' : 'gpt4';
      const requestId = crypto.randomUUID();
      
      // RACE CONDITION FIX: Ensure we use the most current board state
      // Reconstruct board from active moves to guarantee consistency
      const currentBoard = reconstructBoardFromMoves(gameState.activeMoves);
      const consistentGameState = {
        ...gameState,
        board: currentBoard
      };
      
      console.log(`🎮 FRONTEND: ${currentAIPlayer} (${gameState.currentPlayer}) requesting move on turn ${gameState.turnNumber}`);
      console.log(`🎮 FRONTEND: Original board:`, JSON.stringify(gameState.board));
      console.log(`🎮 FRONTEND: Reconstructed board:`, JSON.stringify(currentBoard));
      console.log(`🎮 FRONTEND: Active moves (${gameState.activeMoves.length}):`, gameState.activeMoves.map(move => 
        `${move.coordinate}(${move.symbol})-turn${move.turnNumber}-age${gameState.turnNumber - move.turnNumber}`
      ).join(', '));
      
      // Check if boards are different
      const boardsMatch = JSON.stringify(gameState.board) === JSON.stringify(currentBoard);
      console.log(`🎮 FRONTEND: Boards match: ${boardsMatch}`);
      
      // Make API request with guaranteed up-to-date board state
      const response = await fetch('/api/tictactoe/arena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameState: consistentGameState,
          currentPlayer: currentAIPlayer,
          requestId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const aiResponse = await response.json();
      
      // Validate AI response coordinate
      if (!aiResponse.coordinate || !aiResponse.coordinate.match(/^[A-C][1-3]$/)) {
        throw new Error(`Invalid AI coordinate response: ${aiResponse.coordinate}`);
      }
      
      console.log(`🎮 FRONTEND: Received ${aiResponse.coordinate} from ${currentAIPlayer}`);
      console.log(`🎮 FRONTEND: About to apply to board:`, JSON.stringify(gameState.board));
      
      // Apply the AI move using our coordinate system
      const success = makeMoveByCoordinate(aiResponse.coordinate);
      
      if (!success) {
        console.log(`❌ FRONTEND: Failed to apply ${aiResponse.coordinate} - checking why...`);
        const { row, col } = coordinateToRowCol(aiResponse.coordinate);
        console.log(`❌ FRONTEND: Position (${row},${col}) current value:`, gameState.board[row][col]);
        throw new Error(`Failed to apply AI move: ${aiResponse.coordinate}`);
      }
      
      // Log successful move for debugging
      console.log(`✅ ${currentAIPlayer.toUpperCase()} (${gameState.currentPlayer}) played ${aiResponse.coordinate}`);
      
    } catch (error) {
      console.error('AI Move Error:', error);
      setLastError({
        type: error instanceof Error && error.message.includes('API') ? 'api_error' : 'parsing_error',
        message: error instanceof Error ? error.message : 'Unknown AI error',
        timestamp: Date.now()
      });
    } finally {
      setIsAIThinking(false);
    }
  }, [isAIThinking, gameState, makeMoveByCoordinate]);
  
  // ===== GAME LOOP & AUTO-PLAY =====
  
  /**
   * Main game loop for auto-play
   */
  useEffect(() => {
    if (!gameConfig.autoPlay || !gameState.isGameActive || gameState.gameStatus !== 'playing') {
      return;
    }
    
    // Clear existing timeout
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
    }
    
    // Schedule next AI move
    turnTimeoutRef.current = setTimeout(() => {
      requestAIMove();
    }, gameConfig.turnDelay);
    
    return () => {
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
        turnTimeoutRef.current = null;
      }
    };
  }, [
    gameConfig.autoPlay,
    gameConfig.turnDelay, 
    gameState.isGameActive,
    gameState.gameStatus,
    gameState.currentPlayer,
    requestAIMove
  ]);
  
  /**
   * Process move decay on turn changes
   */
  useEffect(() => {
    if (gameState.turnNumber > 0) {
      processDecay();
    }
  }, [gameState.turnNumber, processDecay]);
  
  /**
   * Handle game completion and auto-reset
   */
  useEffect(() => {
    if (gameState.gameStatus === 'claude_wins' || 
        gameState.gameStatus === 'gpt_wins' || 
        gameState.gameStatus === 'draw') {
      
      // Pause briefly to show the win state
      setTimeout(() => {
        if (gameConfig.autoPlay) {
          resetGame();
          setTimeout(() => startGame(), 100);
        }
      }, gameConfig.pauseOnWin);
    }
  }, [gameState.gameStatus, gameConfig.autoPlay, gameConfig.pauseOnWin, resetGame, startGame]);
  
  /**
   * Safety limit: prevent infinite games
   */
  useEffect(() => {
    if (gameState.turnNumber >= gameState.maxTurns) {
      setGameState(prevState => ({
        ...prevState,
        gameStatus: 'draw',
        isGameActive: false
      }));
      
      setLastError({
        type: 'timeout_error',
        message: `Game ended: Maximum turns (${gameState.maxTurns}) reached`,
        timestamp: Date.now()
      });
    }
  }, [gameState.turnNumber, gameState.maxTurns]);
  
  // ===== ERROR HANDLING =====
  
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);
  
  // ===== CLEANUP =====
  
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    gameState,
    getMoveOpacity,
    getDecayingMoves,
    makeMove,
    makeMoveByCoordinate,
    resetGame,
    startGame,
    pauseGame,
    requestAIMove,
    isAIThinking,
    lastError,
    clearError
  };
} 