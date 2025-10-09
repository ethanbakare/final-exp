// T-23: Move Decay Strategic Planning - Integrate decay timing into strategic decisions
// Adds intelligent decay awareness without cheating

import type { GameState, Move } from '../types/game';
import { rowColToCoordinate } from '../utils/gameLogic';

export interface DecayIntelligence {
  movesDecayingNext: DecayInfo[];
  movesDecayingSoon: DecayInfo[];
  futureOpportunities: DecayInfo[];
  decayTiming: DecayTimingAnalysis;
}

export interface DecayInfo {
  position: string; // A1-C3 coordinate
  symbol: 'X' | 'O';
  currentAge: number;
  turnsUntilDecay: number;
  decaysOnTurn: number;
}

export interface DecayTimingAnalysis {
  totalMovesOnBoard: number;
  oldestMoveAge: number;
  newestMoveAge: number;
  averageAge: number;
  decayPressure: 'low' | 'medium' | 'high';
}

/**
 * Generate comprehensive decay intelligence for strategic planning
 */
export function generateDecayIntelligence(gameState: GameState): DecayIntelligence {
  const { activeMoves, turnNumber, moveDecayLimit } = gameState;
  
  // Analyze all active moves for decay timing
  const decayInfos = activeMoves.map(move => analyzeDecayTiming(move, turnNumber, moveDecayLimit));
  
  // Categorize moves by decay urgency
  const movesDecayingNext = decayInfos.filter(info => info.turnsUntilDecay <= 0);
  const movesDecayingSoon = decayInfos.filter(info => info.turnsUntilDecay > 0 && info.turnsUntilDecay <= 2);
  const futureOpportunities = decayInfos.filter(info => info.turnsUntilDecay > 2);
  
  // Generate timing analysis
  const decayTiming = generateDecayTimingAnalysis(decayInfos);
  
  return {
    movesDecayingNext,
    movesDecayingSoon,
    futureOpportunities,
    decayTiming
  };
}

/**
 * Analyze decay timing for a single move
 */
function analyzeDecayTiming(move: Move, currentTurn: number, decayLimit: number): DecayInfo {
  const currentAge = currentTurn - move.turnNumber;
  const turnsUntilDecay = decayLimit - currentAge;
  const decaysOnTurn = move.turnNumber + decayLimit;
  
  return {
    position: rowColToCoordinate(move.row, move.col),
    symbol: move.symbol,
    currentAge,
    turnsUntilDecay,
    decaysOnTurn
  };
}

/**
 * Generate overall decay timing analysis
 */
function generateDecayTimingAnalysis(decayInfos: DecayInfo[]): DecayTimingAnalysis {
  if (decayInfos.length === 0) {
    return {
      totalMovesOnBoard: 0,
      oldestMoveAge: 0,
      newestMoveAge: 0,
      averageAge: 0,
      decayPressure: 'low'
    };
  }
  
  const ages = decayInfos.map(info => info.currentAge);
  const oldestMoveAge = Math.max(...ages);
  const newestMoveAge = Math.min(...ages);
  const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
  
  // Determine decay pressure based on how many moves are near expiration
  const nearExpiration = decayInfos.filter(info => info.turnsUntilDecay <= 2).length;
  let decayPressure: 'low' | 'medium' | 'high' = 'low';
  
  if (nearExpiration >= 3) decayPressure = 'high';
  else if (nearExpiration >= 1) decayPressure = 'medium';
  
  return {
    totalMovesOnBoard: decayInfos.length,
    oldestMoveAge,
    newestMoveAge,
    averageAge: Math.round(averageAge * 10) / 10,
    decayPressure
  };
}

/**
 * Generate strategic decay teaching for AI prompts
 */
export function generateDecayStrategicTeaching(): string {
  return `
MOVE DECAY BATTLE DYNAMICS:
- All pieces disappear after exactly 7 turns (age 6 = disappears)
- Plan for spaces that will become available through decay
- Consider whether your move will be useful before it expires
- Opponent's old pieces will disappear - creating new strategic opportunities
- Time your placements to maximize strategic value before decay
- Don't place on positions that will decay before they can serve your strategy
`.trim();
}

/**
 * Generate decay-aware strategic examples for prompts
 */
export function generateDecayStrategicExamples(decayIntel: DecayIntelligence): string {
  const { movesDecayingNext, movesDecayingSoon, decayTiming } = decayIntel;
  
  let examples = `
DECAY STRATEGY INTELLIGENCE:
- Board has ${decayTiming.totalMovesOnBoard} active pieces (decay pressure: ${decayTiming.decayPressure})`;
  
  if (movesDecayingNext.length > 0) {
    const nextDecay = movesDecayingNext.map(info => `${info.position}(${info.symbol})`).join(', ');
    examples += `\n- IMMEDIATE OPPORTUNITIES: ${nextDecay} will disappear after this turn`;
  }
  
  if (movesDecayingSoon.length > 0) {
    const soonDecay = movesDecayingSoon.map(info => 
      `${info.position}(${info.symbol}) in ${info.turnsUntilDecay} turns`
    ).join(', ');
    examples += `\n- UPCOMING OPPORTUNITIES: ${soonDecay}`;
  }
  
  examples += `\n- STRATEGIC TIMING: Factor decay into multi-turn planning`;
  examples += `\n- COORDINATION: Coordinate fresh placements with opponent decay timing`;
  
  return examples.trim();
}

/**
 * Generate turn-specific decay awareness for prompts
 */
export function generateTurnDecayAwareness(gameState: GameState): string {
  const decayIntel = generateDecayIntelligence(gameState);
  const { movesDecayingNext, movesDecayingSoon, decayTiming } = decayIntel;
  
  if (decayTiming.totalMovesOnBoard === 0) {
    return `
DECAY AWARENESS: Board is empty - no decay concerns yet.
Focus on strategic positioning for the upcoming battle.`;
  }
  
  let awareness = `
DECAY AWARENESS (Turn ${gameState.turnNumber}):`;
  
  if (movesDecayingNext.length > 0) {
    const disappearing = movesDecayingNext.map(info => `${info.position}(${info.symbol})`).join(', ');
    awareness += `\n🔥 URGENT: ${disappearing} will disappear after this turn - positions become available!`;
  }
  
  if (movesDecayingSoon.length > 0) {
    const upcoming = movesDecayingSoon.map(info => 
      `${info.position}(${info.symbol}) in ${info.turnsUntilDecay} turns`
    ).join(', ');
    awareness += `\n⏰ SOON: ${upcoming}`;
  }
  
  // Add strategic advice based on decay pressure
  switch (decayTiming.decayPressure) {
    case 'high':
      awareness += `\n⚡ HIGH DECAY PRESSURE: Multiple pieces expiring soon - exploit timing advantages!`;
      break;
    case 'medium':
      awareness += `\n🎯 MODERATE DECAY: Some pieces expiring - plan accordingly`;
      break;
    case 'low':
      awareness += `\n✅ LOW DECAY PRESSURE: Focus on immediate tactical opportunities`;
      break;
  }
  
  return awareness;
} 