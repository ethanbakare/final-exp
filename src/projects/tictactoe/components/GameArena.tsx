// T-12: GameArena Component - Main container with header + commentary
import React, { useState } from 'react';
import { GameBoard } from './GameBoard';
import { useGameState } from '../hooks/useGameState';
import { GameErrorBoundary } from './GameErrorBoundary';
import { PLAYERS } from '../types/game';
import styles from '../styles/arena.module.css';

interface GameArenaProps {
  autoPlay?: boolean;
  showDebugInfo?: boolean;
}

export const GameArena: React.FC<GameArenaProps> = ({ 
  autoPlay = true, 
  showDebugInfo = false 
}) => {
  const [showMoveHistory, setShowMoveHistory] = useState(false);
  
  const {
    gameState,
    startGame,
    pauseGame,
    resetGame,
    isAIThinking,
    lastError,
    clearError
  } = useGameState({ autoPlay });

  const claudePlayer = PLAYERS['X'];
  const gptPlayer = PLAYERS['O'];
  const currentAI = gameState.currentPlayer === 'X' ? claudePlayer : gptPlayer;
  
  // Get last move for commentary
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  const recentMoves = gameState.moveHistory.slice(-10); // Last 10 moves

  const handleGameControl = () => {
    if (gameState.isGameActive) {
      pauseGame();
    } else {
      startGame();
    }
  };

  const getGameStatusText = () => {
    switch (gameState.gameStatus) {
      case 'claude_wins':
        return '🎉 Claude Wins!';
      case 'gpt_wins':
        return '🎉 GPT-4 Wins!';
      case 'draw':
        return '🤝 Draw Game!';
      case 'paused':
        return '⏸️ Game Paused';
      case 'error':
        return '❌ Game Error';
      default:
        return isAIThinking ? `🤖 ${currentAI.name} is thinking...` : `🎯 ${currentAI.name}'s Turn`;
    }
  };

  return (
    <GameErrorBoundary>
      <div className={`${styles.container} ${styles.arena}`}>
        {/* Player Header */}
        <div className={styles.header}>
          <div className={styles.playerInfo}>
            <div className={`${styles.player} ${styles.claude} ${gameState.currentPlayer === 'X' ? styles.active : ''}`}>
              <div className={styles.playerIcon}>🤖</div>
              <div className={styles.playerDetails}>
                <h3>{claudePlayer.displayName}</h3>
                <span className={styles.playerSymbol}>X</span>
              </div>
            </div>
            
            <div className={styles.vs}>VS</div>
            
            <div className={`${styles.player} ${styles.gpt} ${gameState.currentPlayer === 'O' ? styles.active : ''}`}>
              <div className={styles.playerIcon}>🧠</div>
              <div className={styles.playerDetails}>
                <h3>{gptPlayer.displayName}</h3>
                <span className={styles.playerSymbol}>O</span>
              </div>
            </div>
          </div>

          <div className={styles.gameInfo}>
            <div className={styles.turnInfo}>
              Turn {gameState.turnNumber} | Max {gameState.maxTurns}
            </div>
            <div className={styles.decayInfo}>
              Move Decay: {gameState.moveDecayLimit} turns
            </div>
          </div>
        </div>

        {/* Game Status & Commentary */}
        <div className={styles.commentary}>
          <div className={styles.gameStatus}>
            {getGameStatusText()}
          </div>
          
          {lastMove && (
            <div className={styles.lastMove}>
              📢 {lastMove}
            </div>
          )}

          {lastError && (
            <div className={styles.errorMessage}>
              ⚠️ {lastError.message}
              <button onClick={clearError} className={styles.clearError}>✕</button>
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className={styles.boardContainer}>
          <GameBoard 
            gameState={gameState}
            disabled={!gameState.isGameActive || isAIThinking}
          />
        </div>

        {/* Move History Toggle */}
        <div className={styles.controls}>
          <button 
            onClick={() => setShowMoveHistory(!showMoveHistory)}
            className={styles.historyToggle}
            disabled={recentMoves.length === 0}
          >
            📝 Move History ({gameState.moveHistory.length})
          </button>
          
          <button 
            onClick={handleGameControl}
            className={`${styles.controlButton} ${gameState.isGameActive ? styles.pause : styles.play}`}
          >
            {gameState.isGameActive ? '⏸️ Pause' : '▶️ Start'}
          </button>
          
          <button 
            onClick={resetGame}
            className={styles.resetButton}
          >
            🔄 Reset
          </button>
        </div>

        {/* Move History Panel */}
        {showMoveHistory && recentMoves.length > 0 && (
          <div className={styles.moveHistory}>
            <h4>Recent Moves</h4>
            <div className={styles.moveList}>
              {recentMoves.map((move, index) => (
                <div key={index} className={styles.moveItem}>
                  <span className={styles.moveNumber}>{gameState.moveHistory.length - recentMoves.length + index + 1}.</span>
                  <span className={styles.moveText}>{move}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Info */}
        {showDebugInfo && (
          <div className={styles.debugInfo}>
            <details>
              <summary>Debug Information</summary>
              <pre>{JSON.stringify(gameState, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </GameErrorBoundary>
  );
}; 