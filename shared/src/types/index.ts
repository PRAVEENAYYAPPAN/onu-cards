// ─── NOVA CARDS – Shared Types ───────────────────────────────────────────────

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'discard_all'
  | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export type GameMode = 'classic' | 'flip' | 'skipbo';
export type Direction = 'cw' | 'ccw';
export type PlayerType = 'human' | 'bot';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  hand: Card[];
  handCount: number; // used on client (no peeking)
  connected: boolean;
  saidNova: boolean; // "Nova!" equivalent of "UNO!"
}

export interface GameState {
  roomCode: string;
  mode: GameMode;
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  discardPile: Card[];           // top card visible
  drawPileCount: number;
  currentColor: CardColor;       // active color (from wild)
  pendingDraw: number;           // accumulated +2/+4
  activeStackType: 'draw2' | 'wild4' | null; // Tracks stacking rules restriction
  phase: 'lobby' | 'dealing' | 'playing' | 'ended';
  winnerId: string | null;
  turnStartedAt: number;         // unix ms for turn timer
  matchDurationInMinutes: number; // 3, 5, or 0 (unlimited)
  matchStartedAt: number;        // unix ms for overall match clock
  hostId: string;
}

export interface RoomOptions {
  mode: GameMode;
  maxPlayers: number;           // 2–7
  botCount: number;
  isPublic: boolean;
  roomCode?: string;
  matchDuration?: number;       // In minutes (3, 5, 0 = unlimited)
}

// ─── Messages Client → Server ─────────────────────────────────────────────────
export type ClientMessage =
  | { type: 'PLAY_CARD';   cardId: string; chosenColor?: CardColor }
  | { type: 'DRAW_CARD' }
  | { type: 'SAY_NOVA' }
  | { type: 'START_GAME' }
  | { type: 'PLAY_AGAIN' };

// ─── Messages Server → Client ─────────────────────────────────────────────────
export type ServerMessage =
  | { type: 'STATE_SYNC';   state: GameState }
  | { type: 'CARD_DEALT';   playerId: string; cardCount: number }
  | { type: 'CARD_PLAYED';  playerId: string; card: Card; chosenColor?: CardColor }
  | { type: 'CARD_DRAWN';   playerId: string; count: number }
  | { type: 'TURN_CHANGED'; playerId: string }
  | { type: 'GAME_OVER';    winnerId: string }
  | { type: 'ERROR';        message: string };
