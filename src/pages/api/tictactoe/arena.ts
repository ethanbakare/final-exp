import { NextApiRequest, NextApiResponse } from 'next';
import { GameState } from '../../../projects/tictactoe/types/game';
import { getAIMove, validateMove, AIPlayer } from '../../../projects/tictactoe/api/ArenaApi';

// =============================================
// T-09: Arena API Endpoint - AI Orchestration
// =============================================

interface AIRequestPayload {
  gameState: GameState;
  currentPlayer: AIPlayer;
  requestId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    // Health check endpoint
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.OPENROUTER_API_KEY
    });
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { gameState, currentPlayer, requestId }: AIRequestPayload = req.body;
    
    // Validate request
    if (!gameState || !currentPlayer || !requestId) {
      res.status(400).json({ 
        error: 'Missing required fields: gameState, currentPlayer, requestId' 
      });
      return;
    }
    
    // Validate player
    if (currentPlayer !== 'claude' && currentPlayer !== 'gpt4') {
      res.status(400).json({ 
        error: 'Invalid player. Must be "claude" or "gpt4"' 
      });
      return;
    }
    
    // Get AI move
    const aiResponse = await getAIMove(gameState, currentPlayer);
    
    if (!aiResponse.success) {
      res.status(500).json({
        error: aiResponse.error,
        player: currentPlayer,
        requestId
      });
      return;
    }
    
    console.log(`🔍 DEBUG: ${currentPlayer} responded with: ${aiResponse.coordinate}`);
    console.log(`🔍 DEBUG: Board state received from frontend:`, JSON.stringify(gameState.board));
    console.log(`🔍 DEBUG: Active moves count: ${gameState.activeMoves.length}`);
    console.log(`🔍 DEBUG: Turn number: ${gameState.turnNumber}`);
    
    // Log active moves details
    if (gameState.activeMoves.length > 0) {
      console.log(`🔍 DEBUG: Active moves:`, gameState.activeMoves.map(move => 
        `${move.coordinate}(${move.symbol})-turn${move.turnNumber}-age${gameState.turnNumber - move.turnNumber}`
      ).join(', '));
    }
    
    // Validate move against game state
    const validation = validateMove(gameState, aiResponse.coordinate);
    
    if (!validation.valid) {
      console.error(`❌ VALIDATION FAILED: ${currentPlayer} attempted ${aiResponse.coordinate}`);
      console.error(`❌ Board state at validation:`, JSON.stringify(gameState.board));
      console.error(`❌ Error: ${validation.error}`);
      console.error(`❌ Available positions should be:`, gameState.board.map((row, r) => 
        row.map((cell, c) => cell === null ? String.fromCharCode(65 + c) + (r + 1) : null).filter(Boolean)
      ).flat().join(', '));
      
      res.status(400).json({
        error: `Invalid move: ${validation.error}`,
        coordinate: aiResponse.coordinate,
        player: currentPlayer,
        requestId
      });
      return;
    }
    
    // Success response
    res.status(200).json({
      coordinate: aiResponse.coordinate,
      player: currentPlayer,
      requestId,
      turn: gameState.turnNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Arena API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}