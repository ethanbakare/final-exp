// T-20: Turn-Based Context Engine - Opponent move analysis and response generation
// Adds strategic turn awareness and competitive intelligence

import type { GameState, Move } from '../types/game';
import type { AIPersonality } from './ai-personalities';

export interface TurnContext {
  type: 'opening' | 'response' | 'counter' | 'endgame';
  opponentLastMove: string | null;
  opponentMoveHistory: string[];
  myMoveHistory: string[];
  gamePhase: 'early' | 'middle' | 'critical';
  turnsSinceStart: number;
  competitiveAnalysis: string;
}

/**
 * Generate turn context for AI strategic awareness
 */
export function generateTurnContext(
  gameState: GameState, 
  personality: AIPersonality
): TurnContext {
  const { turnNumber, moveHistory, activeMoves } = gameState;
  const isMyTurn = (personality === 'claude' && gameState.currentPlayer === 'X') ||
                   (personality === 'gpt4' && gameState.currentPlayer === 'O');
  
  // Determine turn type
  const turnType = determineTurnType(turnNumber, moveHistory);
  
  // Separate move histories
  const { myMoves, opponentMoves } = separateMoveHistories(moveHistory, personality);
  
  // Get last opponent move
  const opponentLastMove = getLastOpponentMove(moveHistory, personality);
  
  // Determine game phase
  const gamePhase = determineGamePhase(turnNumber, activeMoves);
  
  // Generate competitive analysis
  const competitiveAnalysis = generateCompetitiveAnalysis(
    gameState, 
    personality, 
    opponentLastMove,
    turnType
  );

  return {
    type: turnType,
    opponentLastMove,
    opponentMoveHistory: opponentMoves,
    myMoveHistory: myMoves,
    gamePhase,
    turnsSinceStart: turnNumber,
    competitiveAnalysis
  };
}

/**
 * Determine the type of turn based on game progression
 */
function determineTurnType(
  turnNumber: number, 
  moveHistory: string[]
): 'opening' | 'response' | 'counter' | 'endgame' {
  if (turnNumber <= 1) return 'opening';
  if (turnNumber <= 3) return 'response';
  if (turnNumber >= 7) return 'endgame'; // Decay phase
  return 'counter';
}

/**
 * T-22: Enhanced game phase intelligence with decay awareness
 */
function determineGamePhase(
  turnNumber: number, 
  activeMoves: Move[]
): 'early' | 'middle' | 'critical' {
  // Check if any moves will decay soon (decay_active phase)
  const willDecayNext = activeMoves.some(move => {
    const age = turnNumber - move.turnNumber;
    return age >= 6; // Will decay on turn 7
  });
  
  if (willDecayNext) {
    return 'critical'; // Decay active = critical phase
  }
  
  if (turnNumber <= 2) return 'early';    // Opening phase
  if (turnNumber <= 4) return 'middle';   // Middle phase  
  return 'critical';                      // Critical phase
}

/**
 * Separate move histories by player
 */
function separateMoveHistories(
  moveHistory: string[], 
  personality: AIPersonality
): { myMoves: string[]; opponentMoves: string[] } {
  const myName = personality === 'claude' ? 'Claude' : 'ChatGPT';
  const opponentName = personality === 'claude' ? 'ChatGPT' : 'Claude';
  
  const myMoves = moveHistory.filter(move => move.includes(myName));
  const opponentMoves = moveHistory.filter(move => move.includes(opponentName));
  
  return { myMoves, opponentMoves };
}

/**
 * Get the last opponent move for analysis
 */
function getLastOpponentMove(
  moveHistory: string[], 
  personality: AIPersonality
): string | null {
  const opponentName = personality === 'claude' ? 'ChatGPT' : 'Claude';
  
  // Find the most recent opponent move
  for (let i = moveHistory.length - 1; i >= 0; i--) {
    if (moveHistory[i].includes(opponentName)) {
      return moveHistory[i];
    }
  }
  
  return null;
}

/**
 * Generate competitive analysis based on turn context
 */
function generateCompetitiveAnalysis(
  gameState: GameState,
  personality: AIPersonality,
  opponentLastMove: string | null,
  turnType: 'opening' | 'response' | 'counter' | 'endgame'
): string {
  const opponentName = personality === 'claude' ? 'GPT-4' : 'Claude';
  const myName = personality === 'claude' ? 'Claude' : 'GPT-4';
  
  switch (turnType) {
    case 'opening':
      return generateOpeningAnalysis(personality, gameState.turnNumber);
      
    case 'response':
      return generateResponseAnalysis(personality, opponentLastMove, opponentName);
      
    case 'counter':
      return generateCounterAnalysis(personality, opponentLastMove, opponentName);
      
    case 'endgame':
      return generateEndgameAnalysis(personality, gameState);
      
    default:
      return `COMPETITIVE BATTLE: Analyze ${opponentName}'s strategy and respond decisively.`;
  }
}

/**
 * Generate opening turn analysis
 */
function generateOpeningAnalysis(personality: AIPersonality, turnNumber: number): string {
  const opponentName = personality === 'claude' ? 'GPT-4' : 'Claude';
  
  if (turnNumber === 0) {
    // First move of the game
    return `
OPENING BATTLE PHASE:
You are starting a new strategic battle against ${opponentName}. Choose your opening move strategically.
- Center control (B2) often creates multiple winning paths in tic-tac-toe
- Corner positions (A1, A3, C1, C3) provide strong diagonal potential
- Consider your opponent's likely response to your opening strategy`;
  } else {
    // Responding to opponent's opening
    return `
OPENING RESPONSE PHASE:
${opponentName} has made their opening move. Analyze their strategic intent.
- What position did they choose and why?
- How does this affect the strategic landscape?
- What counter-strategy should you employ?`;
  }
}

/**
 * Generate response turn analysis
 */
function generateResponseAnalysis(
  personality: AIPersonality, 
  opponentLastMove: string | null,
  opponentName: string
): string {
  if (!opponentLastMove) {
    return `RESPONSE PHASE: Analyze ${opponentName}'s strategy and respond tactically.`;
  }
  
  // Extract coordinate from opponent's last move (e.g., "Claude has put X on B2" -> "B2")
  const coordMatch = opponentLastMove.match(/([ABC][123])/);
  const coordinate = coordMatch ? coordMatch[1] : 'unknown position';
  
  return `
TACTICAL RESPONSE PHASE:
${opponentName} just played ${coordinate}. 
BATTLE ANALYSIS REQUIRED:
- What is ${opponentName}'s strategic goal with this placement?
- What multiple winning paths has this created?
- How should you respond to counter their strategy?
- Are there immediate threats you need to address?`;
}

/**
 * Generate counter turn analysis
 */
function generateCounterAnalysis(
  personality: AIPersonality,
  opponentLastMove: string | null,
  opponentName: string
): string {
  if (!opponentLastMove) {
    return `COUNTER PHASE: Deploy advanced tactics against ${opponentName}.`;
  }
  
  const coordMatch = opponentLastMove.match(/([ABC][123])/);
  const coordinate = coordMatch ? coordMatch[1] : 'unknown position';
  
  return `
COUNTER-TACTICAL PHASE:
${opponentName}'s latest move to ${coordinate} requires strategic counter-analysis.
ADVANCED BATTLE TACTICS:
- How does this move fit into ${opponentName}'s overall strategy?
- What patterns are emerging in their play style?
- Can you disrupt their strategic momentum?
- What multi-turn counter-strategy should you deploy?`;
}

/**
 * Generate endgame analysis
 */
function generateEndgameAnalysis(personality: AIPersonality, gameState: GameState): string {
  const opponentName = personality === 'claude' ? 'GPT-4' : 'Claude';
  
  return `
CRITICAL ENDGAME PHASE - Every move matters!
Turn ${gameState.turnNumber}: The battle is reaching a decisive moment.
URGENT STRATEGIC ANALYSIS:
- Pieces are beginning to decay - factor timing into all decisions
- ${opponentName} is making their endgame push - identify their winning threats
- What is your optimal path to victory in this critical phase?
- Can you exploit decay timing for strategic advantage?`;
}

/**
 * T-22: Generate turn-specific strategic context with enhanced phase intelligence
 */
export function generateTurnStrategicContext(turnContext: TurnContext): string {
  const { type, competitiveAnalysis, gamePhase, turnsSinceStart } = turnContext;
  
  // T-22: Phase-specific strategic awareness
  const phaseContext = generatePhaseSpecificStrategy(gamePhase, turnsSinceStart);
  
  return `
TURN-BASED STRATEGIC CONTEXT:
${phaseContext}

${competitiveAnalysis}
`.trim();
}

/**
 * T-22: Generate phase-specific strategic guidance
 */
function generatePhaseSpecificStrategy(gamePhase: 'early' | 'middle' | 'critical', turnNumber: number): string {
  switch (gamePhase) {
    case 'early':
      return `
OPENING PHASE (Turns 1-2): Strategic positioning and initiative
- Establish systematic control of key positions
- Center (B2) and corners (A1, A3, C1, C3) are preferred
- Create foundation for multi-turn strategic development
- Consider opponent's likely responses to your positioning`;

    case 'middle': 
      return `
MIDDLE PHASE (Turns 3-4): Threat development and defensive response
- Analyze opponent patterns and defend methodically
- Build threats while maintaining defensive awareness  
- Look for opportunities to create multiple winning paths
- Press advantages and disrupt opponent strategic plans`;

    case 'critical':
      if (turnNumber >= 7) {
        return `
DECAY-ACTIVE CRITICAL PHASE (Turn ${turnNumber}): Timing and piece expiration
- Factor piece decay timing into multi-turn planning
- Every move could determine victory - analyze all possibilities
- Pieces are beginning to disappear - exploit timing advantages
- Coordinate fresh placements with opponent decay timing`;
      } else {
        return `
CRITICAL PHASE (Turn ${turnNumber}): Decisive tactical execution  
- Every move could determine victory - analyze all possibilities
- Focus on immediate threats and winning opportunities
- Execute decisive tactical moves with precision
- No room for positional play - results matter now`;
      }

    default:
      return 'STRATEGIC PHASE: Adapt your approach based on board position';
  }
} 