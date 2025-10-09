// T-21: Strategic Pattern Recognition - Threat detection and opportunity analysis  
// T-21.5: Tactical Prompt Injection - Critical 5-step decision tree

import type { GameState, BoardState } from '../types/game';
import { 
  getWinningAlignments, 
  coordinateToRowCol,
  getAvailablePositions,
  getAllCoordinates
} from '../utils/gameLogic';

/**
 * T-21.5: TACTICAL PROMPT INJECTION - The core 5-step decision tree
 * T-25: ENHANCED for consistent intelligent play  
 */
export function generateTacticalPromptInjection(): string {
  return `
🚨 CRITICAL TACTICAL DECISION SEQUENCE 🚨
FOLLOW THIS EXACT ORDER EVERY SINGLE TURN:

🏆 STEP 1: **IMMEDIATE WIN CHECK**
   - Scan ALL available positions: ${getAllCoordinates().join(', ')}
   - If ANY position completes a line (row/column/diagonal) → CHOOSE IT NOW
   - WINNING is the HIGHEST PRIORITY

🛡️ STEP 2: **BLOCK OPPONENT WIN** 
   - Scan for opponent with 2 symbols in ANY line
   - If opponent can win next turn → BLOCK THEM IMMEDIATELY  
   - BLOCKING opponent wins is SECOND HIGHEST PRIORITY

⚔️ STEP 3: **CREATE YOUR THREAT**
   - Find lines where you have 1 symbol and 2 empty spaces
   - Add a 2nd symbol to threaten victory next turn
   - Building threats is THIRD PRIORITY

⏰ STEP 4: **AVOID DECAY POSITIONS**
   - Don't place on cells decaying next turn (unless win/block)
   - Check move ages in the decay information above

🎯 STEP 5: **STRATEGIC POSITIONING**
   - Center (B2) = MAXIMUM VALUE (creates 4 possible winning lines)
   - Corners (A1, A3, C1, C3) = HIGH VALUE (diagonal potential)  
   - Edges (A2, B1, B3, C2) = LOWEST VALUE (limited options)

⚡ EXECUTE: Choose the HIGHEST PRIORITY move available.
Return ONLY the coordinate (e.g., B2). NO explanation needed.
`.trim();
}



/**
 * Generate strategic pattern teaching for AI prompts
 */
export function generateStrategicPatternTeaching(): string {
  return `
BATTLE PATTERN RECOGNITION:
- When any player has 2 symbols in a line (row/column/diagonal), the third space becomes CRITICAL
- Center position (B2) creates multiple winning paths simultaneously  
- Corner positions (A1, A3, C1, C3) can form powerful diagonal threats
- Edge positions (A2, B1, B3, C2) often support defensive strategies
- Always scan for 2-in-a-line patterns before making any move
- Blocking opponent wins takes priority over creating your own threats
`.trim();
}

/**
 * Generate competitive intelligence examples for prompts
 */
export function generateCompetitiveIntelligence(): string {
  return `
OPPONENT PATTERN ANALYSIS:
- Two symbols in any line → Opponent may win next turn if not blocked
- Center occupation → Multiple diagonal and line possibilities emerging
- Corner patterns → Watch for diagonal threats developing
- Edge clustering → Defensive positioning that may hide threats
- Recent moves suggest tactical focus - adapt your strategy accordingly
`.trim();
}
