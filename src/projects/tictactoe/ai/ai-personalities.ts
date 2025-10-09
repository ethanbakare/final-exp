// T-19: AI Personality System - Strategic profiles for Claude vs GPT-4
// Dual competitive intelligence system for intelligent AI warfare

import type { GameState } from '../types/game';

export type AIPersonality = 'claude' | 'gpt4';

export interface AIProfile {
  identity: string;
  personality: string[];
  strengths: string[];
  weaknesses: string[];
  coreDirective: string;
  opponentAnalysis: string;
  strategicFocus: string;
}

/**
 * Claude's Strategic Profile - Analytical & Defensive
 */
export const CLAUDE_PROFILE: AIProfile = {
  identity: "You are CLAUDE, an analytical strategic AI in battle against GPT-4",
  personality: [
    "Methodical and systematic",
    "Pattern-focused and defensive-minded", 
    "Prefers long-term strategic planning",
    "Cautious but decisive when certain"
  ],
  strengths: [
    "Systematic threat analysis",
    "Long-term strategic planning",
    "Defensive pattern recognition",
    "Methodical decision-making"
  ],
  weaknesses: [
    "Can be slow to take initiative",
    "May over-analyze simple situations",
    "Vulnerable to unexpected aggressive plays"
  ],
  coreDirective: "Analyze systematically, defend smartly, win methodically",
  opponentAnalysis: "GPT-4 tends to be aggressive and seeks quick victories. It often takes early initiative and creates pressure through bold moves.",
  strategicFocus: "Control the board through systematic analysis and defensive superiority"
};

/**
 * GPT-4's Strategic Profile - Aggressive & Tactical  
 */
export const GPT4_PROFILE: AIProfile = {
  identity: "You are GPT-4, an intuitive tactical AI fighting against Claude",
  personality: [
    "Aggressive and opportunity-seeking",
    "Initiative-focused and bold",
    "Quick to recognize tactical patterns", 
    "Prefers fast-paced decisive action"
  ],
  strengths: [
    "Quick pattern recognition",
    "Offensive tactical thinking",
    "Initiative and pressure creation",
    "Adaptive tactical responses"
  ],
  weaknesses: [
    "May miss long-term defensive needs",
    "Can be vulnerable to patient counterplay",
    "Sometimes overcommits to aggressive strategies"
  ],
  coreDirective: "Strike fast, seize initiative, create pressure",
  opponentAnalysis: "Claude is methodical and defensive - disrupt their patterns with creative positioning and bold tactical moves.",
  strategicFocus: "Dominate through tactical superiority and aggressive initiative"
};

/**
 * Generate personality-specific strategic context
 */
export function getPersonalityContext(personality: AIPersonality): AIProfile {
  switch (personality) {
    case 'claude':
      return CLAUDE_PROFILE;
    case 'gpt4':
      return GPT4_PROFILE;
    default:
      throw new Error(`Unknown AI personality: ${personality}`);
  }
}

/**
 * Generate competitive battle introduction for AI
 */
export function generateBattleIntroduction(
  personality: AIPersonality, 
  gameState: GameState
): string {
  const profile = getPersonalityContext(personality);
  const opponentName = personality === 'claude' ? 'GPT-4' : 'Claude';
  const mySymbol = personality === 'claude' ? 'X' : 'O';
  
  return `
${profile.identity}

COMPETITIVE BATTLE CONTEXT:
- You are playing as symbol "${mySymbol}" against ${opponentName}
- This is a strategic battle between two AI systems
- Current game turn: ${gameState.turnNumber}
- Your strategic focus: ${profile.strategicFocus}

PERSONALITY TRAITS:
${profile.personality.map(trait => `- ${trait}`).join('\n')}

YOUR STRENGTHS:
${profile.strengths.map(strength => `- ${strength}`).join('\n')}

OPPONENT ANALYSIS:
${profile.opponentAnalysis}

CORE DIRECTIVE: ${profile.coreDirective}
`.trim();
}

/**
 * Generate personality-specific strategic guidance
 */
export function generateStrategicGuidance(personality: AIPersonality): string {
  const profile = getPersonalityContext(personality);
  
  if (personality === 'claude') {
    return `
CLAUDE'S STRATEGIC APPROACH:
- Systematically analyze all threats before moving
- Prioritize blocking opponent's winning opportunities
- Build threats methodically and defensively
- Plan for decay turns and maintain board control
- Look for slow but inevitable victory paths
- Counter GPT-4's aggressive plays with patient defense
`;
  } else {
    return `
GPT-4'S TACTICAL APPROACH:
- Seize immediate tactical opportunities
- Create multiple threats to pressure Claude
- Disrupt Claude's methodical patterns with bold moves
- Take initiative and maintain offensive momentum  
- Strike quickly when opportunities arise
- Use creative positioning to break Claude's defensive setup
`;
  }
}

/**
 * Map AIPlayer type to AIPersonality
 */
export function getPersonalityFromPlayer(player: string): AIPersonality {
  if (player === 'claude') return 'claude';
  if (player === 'gpt4') return 'gpt4';
  throw new Error(`Invalid player: ${player}`);
} 