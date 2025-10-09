// T-13: GameBoard Component - 3x3 grid with animations and move rendering
import React, { useMemo } from 'react';
import type { GameBoardProps, Move } from '../types/game';
import { calculateMoveOpacity } from '../utils/gameLogic';
import styles from '../styles/arena.module.css';

export const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  onCellClick,
  disabled = false 
}) => {
  // Create a map of moves by position for efficient lookup
  const movesByPosition = useMemo(() => {
    const map = new Map<string, Move>();
    gameState.activeMoves.forEach(move => {
      const key = `${move.row}-${move.col}`;
      map.set(key, move);
    });
    return map;
  }, [gameState.activeMoves]);

  const handleCellClick = (row: number, col: number) => {
    if (disabled || gameState.board[row][col] !== null) return;
    onCellClick?.(row, col);
  };

  const getCellContent = (row: number, col: number) => {
    const cellValue = gameState.board[row][col];
    if (!cellValue) return null;

    // Find the move for this position to get opacity
    const moveKey = `${row}-${col}`;
    const move = movesByPosition.get(moveKey);
    
    if (!move) return cellValue; // Fallback

    // Calculate opacity based on move age
    const moveAge = gameState.turnNumber - move.turnNumber;
    const opacity = calculateMoveOpacity(moveAge, gameState.moveDecayLimit);
    
    // Determine animation class
    let animationClass = '';
    if (moveAge === 0) {
      animationClass = styles.fadeIn; // New move animation
    } else if (opacity <= 0.3) {
      animationClass = styles.fadeOut; // Decaying move animation
    }

    return (
      <span 
        className={`${styles.symbol} ${styles[cellValue.toLowerCase()]} ${animationClass}`}
        style={{ opacity }}
        data-age={moveAge}
      >
        {cellValue}
      </span>
    );
  };

  const getCellClasses = (row: number, col: number) => {
    const baseClass = styles.cell;
    const classes = [baseClass];
    
    // Add position-specific classes for borders
    if (row === 0) classes.push(styles.topRow);
    if (row === 2) classes.push(styles.bottomRow);
    if (col === 0) classes.push(styles.leftCol);
    if (col === 2) classes.push(styles.rightCol);
    
    // Add state classes
    const cellValue = gameState.board[row][col];
    if (cellValue) {
      classes.push(styles.occupied);
      classes.push(styles[`occupied${cellValue}`]);
    } else {
      classes.push(styles.empty);
    }
    
    if (disabled) classes.push(styles.disabled);
    
    return classes.join(' ');
  };

  return (
    <div className={styles.board}>
      {/* Row coordinates (1, 2, 3) */}
      <div className={styles.rowLabels}>
        <div className={styles.rowLabel}>1</div>
        <div className={styles.rowLabel}>2</div>
        <div className={styles.rowLabel}>3</div>
      </div>

      {/* Column coordinates (A, B, C) */}
      <div className={styles.colLabels}>
        <div className={styles.colLabel}>A</div>
        <div className={styles.colLabel}>B</div>
        <div className={styles.colLabel}>C</div>
      </div>

      {/* 3x3 Grid */}
      <div className={styles.grid}>
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => {
            const coordinate = String.fromCharCode(65 + col) + (row + 1); // A1, B2, etc.
            
            return (
              <button
                key={`${row}-${col}`}
                className={getCellClasses(row, col)}
                onClick={() => handleCellClick(row, col)}
                disabled={disabled || gameState.board[row][col] !== null}
                aria-label={`Cell ${coordinate}`}
                data-coordinate={coordinate}
                data-row={row}
                data-col={col}
              >
                {getCellContent(row, col)}
              </button>
            );
          })
        )}
      </div>

      {/* Current turn indicator */}
      {!disabled && (
        <div className={styles.turnIndicator}>
          <span className={`${styles.currentPlayer} ${styles[gameState.currentPlayer.toLowerCase()]}`}>
            {gameState.currentPlayer}
          </span>
        </div>
      )}
    </div>
  );
}; 