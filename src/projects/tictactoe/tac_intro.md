🕹️ PRD: Infinite Tic-Tac-Toe Arena – Claude vs GPT



🔧 Type: Technical Game Design Spec  
🧠 Purpose: Enable fast AI development of the MVP  
📍 Deployment Context: Next.js monorepo (Final-Exp), Vercel-hosted  
🪝 API Layer: OpenRouter (MVP), AISDK (Future)  
🎯 Target: Claude 3.5 vs GPT-4 (continuous duel)
🎯 Game Summary

Concept:
An infinite turn-based game of Tic-Tac-Toe, where two LLMs (Claude and GPT) take alternating turns. Each move is rendered on a shared board. After 7 total moves, the oldest move begins fading out. On the 8th, it disappears — creating a decaying field of play.

Player roles:

Claude 3.5 Sonnet — plays as ⨯ (X)
GPT-4 (gpt-4-1106-preview) — plays as ⭘ (O)
Rules:

3×3 board (Tic-Tac-Toe)
Agents alternate turns indefinitely
Win condition: three in a row (row, column, or diagonal)
Moves decay: each piece lasts 7 turns max
On win, game resets after a pause
🧱 Visual Structure (UI Layout)

🔹 Mobile View (Default)
[Claude ⨯     vs    GPT ⭘]         <- Player headers (top bar)

+---+---+---+                    <- 3x3 Game board
|   | ⭘ | ⨯ |     
+---+---+---+                    <- Pieces fade over time
|   | ⭘ |   |
+---+---+---+
| ⨯ |   | ⭘ |
+---+---+---+

[Claude played B2]              <- Commentary toast (bottom overlay)
Top Bar: Avatar + name + symbol
Board: Grid with cells, fading animation on aged moves
Commentary: Most recent move shown in 1-line toast
Optional: Tap icon to view full history (modal)
🔹 Desktop View (≥768px)
[Claude ⨯     vs    GPT ⭘]     ← Header (top center)

+---+---+---+    [ Claude played B2 ]    ← Commentary panel (right side)
|   | ⭘ | ⨯ |    
+---+---+---+    [ GPT preparing move... ]
|   | ⭘ |   |    
+---+---+---+    
| ⨯ |   | ⭘ |    
+---+---+---+    

[Turn: 106]                     ← Small counter (top-right corner)
Commentary panel sits to the right of the board (not bottom)
Optional scrollback (full history) toggle opens in modal
Top-right shows total moves played in tiny font
🔁 Turn Mechanics

🧩 Game Loop
Agent A (e.g. Claude) is active
Agent receives current game state:
{
  "board": [["", "O", "X"], ["", "O", ""], ["X", "", "O"]],
  "activeMoves": [
    { "row": 0, "col": 1, "symbol": "O" },
    { "row": 0, "col": 2, "symbol": "X" },
    ...
  ],
  "turnNumber": 106,
  "lastMoveBy": "GPT"
}
Agent returns a move + reason:
{
  "row": 1,
  "col": 0,
  "reason": "Blocking a potential diagonal threat."
}
Frontend applies the move:
Updates board
Starts new fade-out cycle (for oldest piece)
Triggers win check
Shows commentary: Claude played A2
Waits 500ms before next turn
Agent B (GPT) now receives updated state and repeats
🗑️ Move Decay System
The board stores activeMoves as a FIFO array
→ Oldest move is removed after 7 total plays
On each render:
Oldest move (5th turn): fade to 50% opacity
6th move: fade to 30%
7th move: fade out, then removed
If an agent replays a cell that is currently fading, it overwrites it (standard Tic-Tac-Toe overwrite)
🧠 Agent Prompt Format (for OpenRouter)
Each agent gets:

SYSTEM:
You are a Tic-Tac-Toe player. You always return a legal move and a short explanation.

USER:
The board is currently:

A1 | A2 | A3
---+----+---
B1 | B2 | B3
---+----+---
C1 | C2 | C3

⨯ = Claude
⭘ = GPT

Active pieces:
1. A3 - Claude
2. B2 - GPT
3. C3 - GPT
...

It's your turn. You're playing as ⭘.
What is your next move? Return JSON:
{ "row": X, "col": Y, "reason": "..." }
Expected output:

{ "row": 0, "col": 0, "reason": "Occupying a corner to prevent a trap." }
⚙️ Infrastructure Notes

✅ MVP Platform: OpenRouter
Why? Lets us call both Claude and GPT from one API surface
Models used:
Claude 3.5: anthropic/claude-3.5-sonnet
GPT-4.1: openai/gpt-4-1106-preview
Streaming not required for MVP (but supported)
.env


📚 OpenRouter Usage

In v1, we use OpenRouter to call multiple models (GPT-4, Claude 3.5, etc.) via a unified API.

🔧 API Access Setup
Sign up at https://openrouter.ai
Get your API key from dashboard
Models are called via:
POST https://openrouter.ai/api/v1/chat/completions
Use model field to target:

openai/gpt-4-1106-preview
anthropic/claude-3-opus-20240229
📦 Example Request
{
  "model": "openai/gpt-4-1106-preview",
  "messages": [
    { "role": "system", "content": "You are an AI playing tic-tac-toe." },
    { "role": "user", "content": "It's your turn. Current board: ..." }
  ]
}
🔄 Switching Models
You can alternate API calls by targeting different models with the same payload format.

🔄 Turn Controller Expectations

Turn manager must:

Pass updated game state
Track turns and winner
Block illegal moves
Store all commentary






OPENROUTER_API_KEY=sk-...
🔜 Future Option: Vercel AISDK
Would integrate natively with Vercel AI SDK edge functions
Benefits: stream control, simplified front-end state via useChat()
MVP skips this for speed of integration
🗂️ Internal Data Model (Frontend)

type PlayerSymbol = 'X' | 'O';

interface Move {
  row: number;
  col: number;
  symbol: PlayerSymbol;
  turn: number;
}

interface GameState {
  board: string[][]; // 3x3 matrix
  activeMoves: Move[];
  turnNumber: number;
  winner: 'Claude' | 'GPT' | null;
  lastMove: Move | null;
}
🔒 Edge Considerations

Match can run for thousands of turns (infinite loop)
Auto-reset match after MAX_TURNS = 50 if no win
Vercel edge function will stream JSON chunks to front-end
UI must gracefully recover on timeout or 429 error
📝 Summary Instructions for AI Builder

Render a mobile-first UI with:
Top bar (Claude vs GPT)
3x3 grid board
Commentary at bottom
Accept JSON updates from a /api/arena/stream endpoint
Board should update each turn and animate decaying pieces
Commentary is a text line summarizing the latest move
No human interaction for now – AI vs AI only
Use OpenRouter for API calls to each LLM
Build this inside your final-exp monorepo under a new project arena