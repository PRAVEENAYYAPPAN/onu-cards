// ─── NOVA CARDS – Zustand Game Store ─────────────────────────────────────────
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Room } from 'colyseus.js';
import type { Card, CardColor, GameState, Player, RoomOptions } from '@/lib/types';
import { createRoom, joinRoom } from '@/lib/colyseusClient';

interface AnimationEvent {
  type: 'CARD_PLAYED' | 'CARD_DRAWN' | 'TURN_CHANGED' | 'GAME_OVER';
  playerId?: string;
  card?: Card;
  chosenColor?: CardColor;
  count?: number;
  winnerId?: string;
  scores?: { playerId: string; name: string; score: number }[];
}

interface GameStore {
  // Room
  room: Room | null;
  myId: string;

  // Game state (synced from server)
  gameState: GameState | null;

  // My hand (private)
  myHand: Card[];

  // Animation events queue
  animQueue: AnimationEvent[];

  // Lobby
  playerName: string;
  isConnecting: boolean;
  error: string | null;

  // Actions
  setPlayerName: (name: string) => void;
  createGame: (options: RoomOptions) => Promise<string>;
  joinGame: (roomCode: string) => Promise<void>;
  startGame: () => void;
  playCard: (cardId: string, chosenColor?: CardColor) => void;
  drawCard: () => void;
  sayNova: () => void;
  playAgain: () => void;
  leaveGame: () => void;
  popAnimEvent: () => AnimationEvent | undefined;
}

function bindRoomEvents(room: Room, set: (fn: (s: GameStore) => Partial<GameStore>) => void) {
  room.onMessage('STATE_SYNC', (state: GameState) => {
    set(s => ({
      gameState: state,
      myHand: state.players.find(p => p.id === s.myId)?.hand ?? s.myHand,
    }));
  });

  room.onMessage('CARD_PLAYED', (msg: { playerId: string; card: Card; chosenColor?: CardColor }) => {
    set(s => ({ animQueue: [...s.animQueue, { type: 'CARD_PLAYED', ...msg }] }));
  });

  room.onMessage('CARD_DRAWN', (msg: { playerId: string; count: number }) => {
    set(s => ({ animQueue: [...s.animQueue, { type: 'CARD_DRAWN', ...msg }] }));
  });

  room.onMessage('GAME_OVER', (msg: { winnerId: string; scores?: { playerId: string; name: string; score: number }[] }) => {
    set(s => ({ animQueue: [...s.animQueue, { type: 'GAME_OVER', ...msg }] }));
  });

  room.onLeave((code) => {
    // code 1000 = intentional leave; only clear state for intentional leaves
    // For unexpected disconnects (server crash, msgpack error), keep gameState
    // so the user sees their last known game state rather than a black screen
    if (code === 1000 || code === 4000) {
      set(() => ({ room: null, gameState: null }));
    } else {
      // Unexpected disconnect — keep gameState, just clear room ref
      set(() => ({ room: null }));
    }
  });
}

/** Colyseus throws ProgressEvent (WebSocket failure) or Error — extract human message */
function extractError(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  // ProgressEvent from failed WebSocket connection
  if (typeof e === 'object' && 'type' in (e as object)) {
    const type = (e as { type?: string }).type;
    if (type === 'error') return 'Cannot connect to server. Make sure the backend is running.';
  }
  return 'Connection failed. Is the backend running?';
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    room: null,
    myId: '',
    gameState: null,
    myHand: [],
    animQueue: [],
    playerName: 'Player',
    isConnecting: false,
    error: null,

    setPlayerName: (name) => set({ playerName: name }),

    createGame: async (options) => {
      set({ isConnecting: true, error: null });
      try {
        const room = await createRoom('nova_classic', {
          ...options,
          name: get().playerName,
        });
        set({ room, myId: room.sessionId, isConnecting: false });
        bindRoomEvents(room, set as any);
        return room.roomId;
      } catch (e: unknown) {
        const msg = extractError(e);
        set({ error: msg, isConnecting: false });
        throw new Error(msg);
      }
    },

    joinGame: async (roomCode) => {
      set({ isConnecting: true, error: null });
      try {
        const room = await joinRoom(roomCode, { name: get().playerName });
        set({ room, myId: room.sessionId, isConnecting: false });
        bindRoomEvents(room, set as any);
      } catch (e: unknown) {
        const msg = extractError(e);
        set({ error: msg, isConnecting: false });
        throw new Error(msg);
      }
    },

    startGame: () => get().room?.send('START_GAME'),
    playCard: (cardId, chosenColor) => {
      const payload: { cardId: string; chosenColor?: string } = { cardId };
      if (chosenColor !== undefined) payload.chosenColor = chosenColor;
      get().room?.send('PLAY_CARD', payload);
    },

    drawCard: () => get().room?.send('DRAW_CARD'),
    sayNova: () => get().room?.send('SAY_NOVA'),
    playAgain: () => get().room?.send('PLAY_AGAIN'),

    leaveGame: async () => {
      await get().room?.leave();
      set({ room: null, gameState: null, myHand: [], animQueue: [] });
    },

    popAnimEvent: () => {
      const q = get().animQueue;
      if (q.length === 0) return undefined;
      const [first, ...rest] = q;
      set({ animQueue: rest });
      return first;
    },
  }))
);
