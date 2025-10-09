// T-08: Error handling - React Error Boundary for game components
// Provides graceful error handling and recovery options

import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { GameError } from '../types/game';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: GameError) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class GameErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('GameErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report to parent component if callback provided
    if (this.props.onError) {
      const gameError: GameError = {
        type: 'validation_error', // Default type, could be refined
        message: error.message,
        timestamp: Date.now()
      };
      this.props.onError(gameError);
    }

    // Auto-retry for certain error types
    if (this.shouldAutoRetry(error)) {
      this.scheduleRetry();
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network or temporary errors
    const retryableErrors = [
      'Network request failed',
      'Failed to fetch',
      'API request failed',
      'timeout'
    ];
    
    return this.retryCount < this.maxRetries && 
           retryableErrors.some(msg => error.message.includes(msg));
  }

  private scheduleRetry = () => {
    setTimeout(() => {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }, 2000 * this.retryCount); // Exponential backoff
  };

  private handleManualRetry = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleResetGame = () => {
    // Reset everything and reload the page as last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or use provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="game-error-boundary">
          <div className="error-container">
            <h2>🎮 Game Error</h2>
            <p className="error-message">
              Something went wrong with the Tic-Tac-Toe Arena.
            </p>
            
            {this.state.error && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre className="error-stack">
                  <strong>Error:</strong> {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleManualRetry}
                className="retry-button"
              >
                🔄 Try Again
              </button>
              
              <button 
                onClick={this.handleResetGame}
                className="reset-button"
              >
                🎯 Reset Game
              </button>
            </div>

            {this.retryCount > 0 && (
              <p className="retry-info">
                Retry attempt {this.retryCount} of {this.maxRetries}
              </p>
            )}
          </div>

          <style jsx>{`
            .game-error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 2rem;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 12px;
              border: 2px solid #ff6b35;
            }

            .error-container {
              text-align: center;
              max-width: 500px;
              color: #ffffff;
            }

            .error-container h2 {
              color: #ff6b35;
              margin-bottom: 1rem;
              font-size: 1.5rem;
            }

            .error-message {
              margin-bottom: 1.5rem;
              color: #cccccc;
              line-height: 1.6;
            }

            .error-details {
              margin: 1.5rem 0;
              text-align: left;
            }

            .error-details summary {
              cursor: pointer;
              color: #4ecdc4;
              margin-bottom: 0.5rem;
            }

            .error-stack {
              background: #000000;
              padding: 1rem;
              border-radius: 4px;
              font-size: 0.8rem;
              color: #ff6b6b;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              margin-top: 1.5rem;
            }

            .retry-button, .reset-button {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .retry-button {
              background: #4ecdc4;
              color: #000000;
            }

            .retry-button:hover {
              background: #45b7aa;
              transform: translateY(-1px);
            }

            .reset-button {
              background: #ff6b35;
              color: #ffffff;
            }

            .reset-button:hover {
              background: #e55a2d;
              transform: translateY(-1px);
            }

            .retry-info {
              margin-top: 1rem;
              font-size: 0.9rem;
              color: #999999;
            }

            @media (max-width: 480px) {
              .error-actions {
                flex-direction: column;
              }
              
              .retry-button, .reset-button {
                width: 100%;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withGameErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <GameErrorBoundary fallback={fallback}>
        <Component {...props} />
      </GameErrorBoundary>
    );
  };
}

// Hook for error reporting from functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: string) => {
    // Log error
    console.error('[Game Error]', error, errorInfo);
    
    // You could send to error reporting service here
    // e.g., Sentry, LogRocket, etc.
    
    // For now, just throw to trigger error boundary
    throw error;
  };

  return { handleError };
} 