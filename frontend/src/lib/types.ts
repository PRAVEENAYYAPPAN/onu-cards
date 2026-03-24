// ─── NOVA CARDS – Shared Types (frontend copy) ───────────────────────────────
// Keeping a local copy avoids complex monorepo linking for Next.js

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
  handCount: number;
  connected: boolean;
  saidNova: boolean;
}

export interface GameState {
  roomCode: string;
  mode: GameMode;
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  discardPile: Card[];
  drawPileCount: number;
  currentColor: CardColor;
  pendingDraw: number;
  activeStackType: 'draw2' | 'wild4' | null;
  phase: 'lobby' | 'dealing' | 'playing' | 'ended';
  winnerId: string | null;
  hostId: string;
  matchDurationInMinutes: number;
  matchStartedAt: number;
  turnStartedAt: number;
  lastMatchScores?: { playerId: string; name: string; score: number }[];
}

export interface RoomOptions {
  mode: GameMode;
  maxPlayers: number;
  botCount: number;
  isPublic: boolean;
  name?: string;
  matchDuration?: number;
}
