import React from 'react';
import { GameArena } from '@/projects/tictactoe/components/GameArena';
import { GameErrorBoundary } from '@/projects/tictactoe/components/GameErrorBoundary';

/**
 * Main Tic-Tac-Toe Arena page
 * Infinite AI vs AI battles: Claude 3.5 Sonnet vs GPT-4
 * Features move decay system and real-time strategic gameplay
 */
const TicTacToeArenaPage: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .tictactoe-container {
          background: #1a1a1a;
          min-height: 100vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1000px;
        }

        .title-section {
          text-align: center;
          margin-bottom: 2rem;
          color: #ffffff;
        }

        .title-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #FF6B35 0%, #4ECDC4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .title-section p {
          font-size: 1.2rem;
          color: #cccccc;
          margin: 0;
          font-weight: 400;
        }

        .subtitle {
          font-size: 1rem;
          color: #999999;
          margin-top: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .tictactoe-container {
            padding: 15px;
          }

          .title-section h1 {
            font-size: 2rem;
          }

          .title-section p {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 480px) {
          .title-section h1 {
            font-size: 1.8rem;
          }

          .title-section p {
            font-size: 1rem;
          }
        }
      `}</style>
      
      <div className="tictactoe-container">
        <div className="content-wrapper">
          <div className="title-section">
            <h1>🎯 Infinite Tic-Tac-Toe Arena</h1>
            <p>Claude 3.5 Sonnet vs GPT-4 Turbo</p>
            <div className="subtitle">
              Featuring move decay system • Real-time AI battles • Strategic gameplay
            </div>
          </div>
          
          <GameErrorBoundary>
            <GameArena autoPlay={true} showDebugInfo={false} />
          </GameErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default TicTacToeArenaPage; 