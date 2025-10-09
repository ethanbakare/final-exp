// Pure utility functions for Tic-Tac-Toe game logic
// T-07: Game utilities - Foundation for all game operations

import type { 
  BoardState, 
  CellValue, 
  PlayerSymbol, 
  Move, 
  GameState 
} from '../types/game';

// ===== COORDINATE SYSTEM (A1-C3) =====

/**
 * Convert A1-C3 coordinate to row/col numbers
 */
export function coordinateToRowCol(coordinate: string): { row: number; col: number } {
  if (coordinate.length !== 2) {
    throw new Error(`Invalid coordinate: ${coordinate}`);
  }
  
  const col = coordinate.charCodeAt(0) - 'A'.charCodeAt(0); // A=0, B=1, C=2
  const row = parseInt(coordinate[1]) - 1; // 1=0, 2=1, 3=2
  
  if (!isValidPosition(row, col)) {
    throw new Error(`Invalid coordinate: ${coordinate}`);
  }
  
  return { row, col };
}

/**
 * Convert row/col numbers to A1-C3 coordinate
 */
export function rowColToCoordinate(row: number, col: number): string {
  if (!isValidPosition(row, col)) {
    throw new Error(`Invalid position: (${row}, ${col})`);
  }
  
  const colChar = String.fromCharCode('A'.charCodeAt(0) + col); // 0=A, 1=B, 2=C
  const rowChar = (row + 1).toString(); // 0=1, 1=2, 2=3
  
  return colChar + rowChar;
}

/**
 * Get all possible coordinates in A1-C3 format
 */
export function getAllCoordinates(): string[] {
  const coordinates: string[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      coordinates.push(rowColToCoordinate(row, col));
    }
  }
  return coordinates; // ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"]
}

/**
 * Get all winning alignments in A1-C3 format
 */
export function getWinningAlignments(): string[][] {
  return [
    // Rows
    ["A1", "B1", "C1"],
    ["A2", "B2", "C2"], 
    ["A3", "B3", "C3"],
    // Columns
    ["A1", "A2", "A3"],
    ["B1", "B2", "B3"],
    ["C1", "C2", "C3"],
    // Diagonals
    ["A1", "B2", "C3"],
    ["C1", "B2", "A3"]
  ];
}

// ===== BOARD UTILITIES =====

/**
 * Create an empty 3x3 board
 */
export function createEmptyBoard(): BoardState {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];
}

/**
 * Create a copy of the board state
 */
export function cloneBoard(board: BoardState): BoardState {
  return board.map(row => [...row]);
}

/**
 * Get the value at a specific board position
 */
export function getCellValue(board: BoardState, row: number, col: number): CellValue {
  if (!isValidPosition(row, col)) return null;
  return board[row][col];
}

/**
 * Set a value at a specific board position (returns new board)
 */
export function setCellValue(
  board: BoardState, 
  row: number, 
  col: number, 
  value: CellValue
): BoardState {
  if (!isValidPosition(row, col)) return board;
  
  const newBoard = cloneBoard(board);
  newBoard[row][col] = value;
  return newBoard;
}

// ===== POSITION VALIDATION =====

/**
 * Check if row/col coordinates are valid (0-2)
 */
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row <= 2 && col >= 0 && col <= 2;
}

/**
 * Check if a cell is empty (available for move)
 */
export function isCellEmpty(board: BoardState, row: number, col: number): boolean {
  return isValidPosition(row, col) && board[row][col] === null;
}

/**
 * Validate if a move can be made at the given position
 */
export function isValidMove(board: BoardState, row: number, col: number): boolean {
  return isValidPosition(row, col) && isCellEmpty(board, row, col);
}

// ===== WIN DETECTION =====

/**
 * Check if a player has won the game
 */
export function checkWinner(board: BoardState): PlayerSymbol | null {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (board[row][0] && 
        board[row][0] === board[row][1] && 
        board[row][1] === board[row][2]) {
      return board[row][0];
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (board[0][col] && 
        board[0][col] === board[1][col] && 
        board[1][col] === board[2][col]) {
      return board[0][col];
    }
  }

  // Check diagonal (top-left to bottom-right)
  if (board[0][0] && 
      board[0][0] === board[1][1] && 
      board[1][1] === board[2][2]) {
    return board[0][0];
  }

  // Check diagonal (top-right to bottom-left)
  if (board[0][2] && 
      board[0][2] === board[1][1] && 
      board[1][1] === board[2][0]) {
    return board[0][2];
  }

  return null;
}

/**
 * Check if the board is full (all cells occupied)
 */
export function isBoardFull(board: BoardState): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if the game should end (someone won or board full)
 */
export function isGameComplete(board: BoardState): boolean {
  return checkWinner(board) !== null || isBoardFull(board);
}

// ===== MOVE UTILITIES =====

/**
 * Apply a move to the board (returns new board state)
 */
export function applyMove(
  board: BoardState, 
  row: number, 
  col: number, 
  symbol: PlayerSymbol
): BoardState {
  if (!isValidMove(board, row, col)) {
    throw new Error(`Invalid move: position (${row}, ${col}) is not available`);
  }
  
  return setCellValue(board, row, col, symbol);
}

/**
 * Generate a unique ID for a move
 */
export function generateMoveId(row: number, col: number, turnNumber: number): string {
  return `move_${row}_${col}_${turnNumber}_${Date.now()}`;
}

/**
 * Create a new move object
 */
export function createMove(
  row: number,
  col: number,
  symbol: PlayerSymbol,
  turnNumber: number
): Move {
  return {
    id: generateMoveId(row, col, turnNumber),
    row,
    col,
    coordinate: rowColToCoordinate(row, col),
    symbol,
    turnNumber,
    timestamp: Date.now()
  };
}

// ===== MOVE DECAY UTILITIES =====

/**
 * Calculate opacity for a move based on its age
 * CORRECTED: Turn 1→1.0, Turn 5→0.7, Turn 6→0.3, Turn 7→DISAPPEAR
 */
export function calculateMoveOpacity(
  moveAge: number, 
  maxAge: number = 7
): number {
  if (moveAge <= 0) return 1.0; // Brand new move
  if (moveAge >= maxAge - 1) return 0.0; // Disappears on turn 7 (moveAge 6)
  
  // CORRECTED fade timing:
  // moveAge 4 (turn 5) → 0.7
  // moveAge 5 (turn 6) → 0.3  
  if (moveAge === 4) return 0.7;
  if (moveAge === 5) return 0.3;
  
  // Smooth interpolation for other ages
  if (moveAge < 4) {
    // Ages 1-3: fade from 1.0 to 0.7
    return 1.0 - (moveAge / 4) * 0.3;
  }
  
  return 1.0; // Fallback
}

/**
 * Filter moves that should be removed due to decay
 */
export function getDecayedMoves(
  activeMoves: Move[], 
  currentTurnNumber: number, 
  decayLimit: number = 7
): Move[] {
  return activeMoves.filter(move => 
    currentTurnNumber - move.turnNumber >= decayLimit
  );
}

/**
 * Remove decayed moves from active moves list
 */
export function removeDecayedMoves(
  activeMoves: Move[], 
  currentTurnNumber: number, 
  decayLimit: number = 7
): Move[] {
  return activeMoves.filter(move => 
    currentTurnNumber - move.turnNumber < decayLimit
  );
}

// ===== BOARD RECONSTRUCTION =====

/**
 * Reconstruct board state from active moves
 * This is crucial for the move decay system
 */
export function reconstructBoardFromMoves(activeMoves: Move[]): BoardState {
  const board = createEmptyBoard();
  
  // Apply all active moves to the board
  for (const move of activeMoves) {
    if (isValidPosition(move.row, move.col)) {
      board[move.row][move.col] = move.symbol;
    }
  }
  
  return board;
}

// ===== GAME STATE UTILITIES =====

/**
 * Get the next player symbol
 */
export function getNextPlayer(currentPlayer: PlayerSymbol): PlayerSymbol {
  return currentPlayer === 'X' ? 'O' : 'X';
}

/**
 * Count total moves on the board
 */
export function countMoves(board: BoardState): number {
  let count = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] !== null) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Get all empty positions on the board
 */
export function getEmptyPositions(board: BoardState): Array<{row: number, col: number}> {
  const positions: Array<{row: number, col: number}> = [];
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        positions.push({ row, col });
      }
    }
  }
  
  return positions;
}

// ===== BOARD VISUALIZATION =====

/**
 * Convert board to string for AI prompts
 */
export function boardToString(board: BoardState): string {
  const symbols = {
    'X': 'X',
    'O': 'O',
    null: '.'
  };
  
  let result = '';
  for (let row = 0; row < 3; row++) {
    const rowStr = board[row].map(cell => symbols[cell as keyof typeof symbols]).join(' ');
    result += rowStr;
    if (row < 2) result += '\n';
  }
  
  return result;
}

/**
 * Create detailed board visualization with A1-C3 coordinates  
 */
export function createBoardVisualization(board: BoardState): string {
  const symbols = {
    'X': 'X',
    'O': 'O', 
    null: '.'
  };
  
  let visualization = '   A B C\n';
  for (let row = 0; row < 3; row++) {
    const rowStr = board[row].map(cell => symbols[cell as keyof typeof symbols]).join(' ');
    visualization += `${row + 1}  ${rowStr}\n`;
  }
  
  return visualization.trim();
}

// ===== STRATEGIC AWARENESS FOR AI =====

/**
 * Get current occupied positions in A1-C3 format
 */
export function getOccupiedPositions(board: BoardState): Array<{coordinate: string, symbol: PlayerSymbol}> {
  const occupied: Array<{coordinate: string, symbol: PlayerSymbol}> = [];
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const symbol = board[row][col];
      if (symbol) {
        occupied.push({
          coordinate: rowColToCoordinate(row, col),
          symbol
        });
      }
    }
  }
  
  return occupied;
}

/**
 * Get available positions in A1-C3 format
 */
export function getAvailablePositions(board: BoardState): string[] {
  const available: string[] = [];
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === null) {
        available.push(rowColToCoordinate(row, col));
      }
    }
  }
  
  return available;
}

/**
 * Get decay predictions for current active moves
 */
export function getDecayPredictions(
  activeMoves: Move[], 
  currentTurnNumber: number, 
  decayLimit: number = 7
): Array<{coordinate: string, symbol: PlayerSymbol, turnsUntilDecay: number}> {
  return activeMoves.map(move => {
    const age = currentTurnNumber - move.turnNumber;
    const turnsUntilDecay = decayLimit - age;
    
    return {
      coordinate: move.coordinate,
      symbol: move.symbol,
      turnsUntilDecay: Math.max(0, turnsUntilDecay)
    };
  }).filter(prediction => prediction.turnsUntilDecay > 0);
}

/**
 * Get positions that will become free soon
 */
export function getUpcomingFreePositions(
  activeMoves: Move[], 
  currentTurnNumber: number, 
  decayLimit: number = 7
): Array<{coordinate: string, freesOnTurn: number}> {
  return activeMoves
    .filter(move => {
      const age = currentTurnNumber - move.turnNumber;
      return age >= decayLimit - 1; // Will decay soon
    })
    .map(move => ({
      coordinate: move.coordinate,
      freesOnTurn: move.turnNumber + decayLimit
    }));
}

/**
 * Create simple commentary text for a move
 */
export function createMoveCommentary(playerName: string, symbol: PlayerSymbol, coordinate: string): string {
  return `${playerName} has put ${symbol} on ${coordinate}`;
} 