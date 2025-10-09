import { GameState, PlayerSymbol } from '../types/game';
import { 
  createBoardVisualization, 
  getAvailablePositions, 
  getWinningAlignments,
  coordinateToRowCol,
  rowColToCoordinate
} from '../utils/gameLogic';
import { 
  generateBattleIntroduction,
  generateStrategicGuidance,
  getPersonalityFromPlayer,
  type AIPersonality
} from '../ai/ai-personalities';
import {
  generateTurnContext,
  generateTurnStrategicContext,
  type TurnContext
} from '../ai/turn-context';
import {
  generateTacticalPromptInjection,
  generateStrategicPatternTeaching,
  generateCompetitiveIntelligence
} from '../ai/strategic-patterns';
import {
  generateDecayStrategicTeaching,
  generateTurnDecayAwareness,
  generateDecayIntelligence,
  generateDecayStrategicExamples
} from '../ai/decay-intelligence';

// =============================================
// T-10: AI Strategic Prompts - Complete Board State
// =============================================

// AI Player type for API
export type AIPlayer = 'claude' | 'gpt4';

export interface AIResponse {
  coordinate: string;
  success: boolean;
  error?: string;
}

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// AI Model Configuration
const AI_MODELS = {
  CLAUDE: 'anthropic/claude-3-sonnet-20240229',
  GPT4: 'openai/gpt-4-turbo-preview'
} as const;

/**
 * Validate coordinate format (A1-C3)
 */
function isValidCoordinate(coordinate: string): boolean {
  return /^[ABC][123]$/.test(coordinate);
}

/**
 * Convert coordinate to array index
 */
function coordinateToIndex(coordinate: string): number {
  const { row, col } = coordinateToRowCol(coordinate);
  return row * 3 + col;
}

/**
 * Convert array index to coordinate
 */
function indexToCoordinate(index: number): string {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return rowColToCoordinate(row, col);
}

/**
 * Get move ages with decay information
 */
function getMoveAgesWithDecayInfo(gameState: GameState) {
  return gameState.activeMoves.map(move => ({
    position: move.row * 3 + move.col,
    symbol: move.symbol,
    age: gameState.turnNumber - move.turnNumber,
    opacity: calculateMoveOpacity(gameState.turnNumber - move.turnNumber)
  }));
}

/**
 * Calculate move opacity based on age
 */
function calculateMoveOpacity(age: number): number {
  if (age <= 3) return 1.0;  // Fully visible for turns 0-3
  if (age === 4) return 0.7; // Fade starts at turn 4
  if (age === 5) return 0.3; // More faded at turn 5
  return 0.0; // Disappears at turn 6 (will be removed)
}

/**
 * Get upcoming free spaces
 */
function getUpcomingFreeSpaces(gameState: GameState) {
  return gameState.activeMoves
    .filter(move => (gameState.turnNumber - move.turnNumber) >= 6)
    .map(move => ({
      position: move.row * 3 + move.col,
      freeTurn: move.turnNumber + 7
    }));
}

/**
 * T-19: Claude's Strategic Prompt - Analytical & Defensive AI
 */
export function createClaudeStrategicPrompt(gameState: GameState): string {
  const personality: AIPersonality = 'claude';
  return createPersonalityStrategicPrompt(gameState, personality);
}

/**
 * T-19: GPT-4's Strategic Prompt - Aggressive & Tactical AI  
 */
export function createGPTStrategicPrompt(gameState: GameState): string {
  const personality: AIPersonality = 'gpt4';
  return createPersonalityStrategicPrompt(gameState, personality);
}

/**
 * Core strategic prompt generator with personality and turn context integration
 */
function createPersonalityStrategicPrompt(gameState: GameState, personality: AIPersonality): string {
  const { board, turnNumber, moveHistory } = gameState;
  const symbol = personality === 'claude' ? 'X' : 'O';
  const player = personality === 'claude' ? 'claude' : 'gpt4';
  
  // 1. Personality-specific battle introduction
  const battleIntro = generateBattleIntroduction(personality, gameState);
  
  // 2. T-20: Generate turn context for strategic awareness
  const turnContext = generateTurnContext(gameState, personality);
  const turnStrategicContext = generateTurnStrategicContext(turnContext);
  
  // 3. Current Board State
  const boardVisualization = createBoardVisualization(board);
  
  // 4. Available Positions
  const availablePositions = getAvailablePositions(board);
  const availableCoords = availablePositions.join(', ');
  
  // 5. Move Ages and Decay Timing
  const moveAges = getMoveAgesWithDecayInfo(gameState);
  const decayInfo = moveAges.map(info => {
    const coord = indexToCoordinate(info.position);
    const willDisappear = info.age === 6 ? ' (WILL DISAPPEAR AFTER THIS TURN)' : '';
    return `${coord}(${info.symbol}) - age ${info.age}, opacity ${info.opacity}${willDisappear}`;
  }).join('\n   ');
  
  // 6. Upcoming Free Spaces
  const upcomingFree = getUpcomingFreeSpaces(gameState);
  const upcomingText = upcomingFree.length > 0 
    ? upcomingFree.map(info => `${indexToCoordinate(info.position)} will be free on turn ${info.freeTurn}`).join(', ')
    : 'None';
  
  // 7. Last Move Information
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : 'None';
  
  // 8. Personality-specific strategic guidance
  const strategicGuidance = generateStrategicGuidance(personality);
  
  // 9. T-21: Strategic pattern recognition and teaching
  const patternTeaching = generateStrategicPatternTeaching();
  const competitiveIntelligence = generateCompetitiveIntelligence();
  
  // 10. T-21.5: Tactical prompt injection - CRITICAL decision tree
  const tacticalInjection = generateTacticalPromptInjection();
  
  // 11. T-23: Decay intelligence integration
  const decayTeaching = generateDecayStrategicTeaching();
  const turnDecayAwareness = generateTurnDecayAwareness(gameState);
  const decayIntel = generateDecayIntelligence(gameState);
  const decayExamples = generateDecayStrategicExamples(decayIntel);

  return `
${battleIntro}

${turnStrategicContext}

COORDINATE SYSTEM (A1-C3):
   A B C
1  . . .
2  . . .  
3  . . .

CURRENT BOARD STATE (Turn ${turnNumber}):
${boardVisualization}

AVAILABLE POSITIONS: ${availableCoords}

${tacticalInjection}

WINNING ALIGNMENTS:
Rows:     A1-B1-C1 | A2-B2-C2 | A3-B3-C3
Columns:  A1-A2-A3 | B1-B2-B3 | C1-C2-C3
Diagonals: A1-B2-C3 | C1-B2-A3

MOVE DECAY INFORMATION:
   ${decayInfo || 'No moves on board yet'}

UPCOMING FREE SPACES: ${upcomingText}

LAST MOVE: ${lastMove}

${strategicGuidance}

${patternTeaching}

${competitiveIntelligence}

${decayTeaching}

${turnDecayAwareness}

${decayExamples}

RESPONSE FORMAT:
Reply with ONLY the coordinate (A1, A2, A3, B1, B2, B3, C1, C2, or C3).
Do not include any explanation or reasoning.

Your move:`.trim();
}

/**
 * Legacy function for backward compatibility - routes to personality-specific prompts
 */
export function createStrategicPrompt(gameState: GameState, player: AIPlayer): string {
  if (player === 'claude') {
    return createClaudeStrategicPrompt(gameState);
  } else {
    return createGPTStrategicPrompt(gameState);
  }
}

// =============================================
// T-11: Simple Response Parsing - A1-C3 Coordinates
// =============================================

/**
 * Parses AI response to extract coordinate
 */
export function parseAIResponse(response: string): AIResponse {
  try {
    // Clean the response
    const cleaned = response.trim().toUpperCase();
    
    // Extract coordinate pattern (A1, B2, etc.)
    const coordinateMatch = cleaned.match(/([ABC][123])/);
    
    if (!coordinateMatch) {
      return {
        coordinate: '',
        success: false,
        error: 'No valid coordinate found in response'
      };
    }
    
    const coordinate = coordinateMatch[1];
    
    // Validate coordinate
    if (!isValidCoordinate(coordinate)) {
      return {
        coordinate: '',
        success: false,
        error: `Invalid coordinate: ${coordinate}`
      };
    }
    
    return {
      coordinate,
      success: true
    };
  } catch (error) {
    return {
      coordinate: '',
      success: false,
      error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Makes API call to OpenRouter for AI move
 */
export async function getAIMove(gameState: GameState, player: AIPlayer): Promise<AIResponse> {
  if (!OPENROUTER_API_KEY) {
    return {
      coordinate: '',
      success: false,
      error: 'OpenRouter API key not configured'
    };
  }
  
  try {
    const model = player === 'claude' ? AI_MODELS.CLAUDE : AI_MODELS.GPT4;
    const prompt = createStrategicPrompt(gameState, player);
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tictactoe-arena.vercel.app',
        'X-Title': 'Tic-Tac-Toe Arena'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        coordinate: '',
        success: false,
        error: `OpenRouter API error: ${response.status} - ${errorText}`
      };
    }
    
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    return parseAIResponse(aiResponse);
  } catch (error) {
    return {
      coordinate: '',
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates move against current game state
 */
export function validateMove(gameState: GameState, coordinate: string): { valid: boolean; error?: string } {
  // Check if coordinate is valid format
  if (!isValidCoordinate(coordinate)) {
    return { valid: false, error: 'Invalid coordinate format' };
  }
  
  // Check if position is available
  const { row, col } = coordinateToRowCol(coordinate);
  
  if (gameState.board[row][col] !== null) {
    return { valid: false, error: 'Position already occupied' };
  }
  
  return { valid: true };
} 