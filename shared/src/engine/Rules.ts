// ─── NOVA CARDS – Rules Engine ────────────────────────────────────────────────
import type { Card, CardColor, GameState } from '../types/index';

/** Can this card be played on the current discard + active color? */
export function isPlayable(card: Card, state: GameState): boolean {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) return true;

  // Stacking rule handling
  if (state.pendingDraw > 0) {
    if (state.activeStackType === 'wild4') {
      return card.value === 'wild4'; // Only +4 can be played on +4
    }
    if (state.activeStackType === 'draw2') {
      return card.value === 'draw2' || card.value === 'wild4'; // Both +2 and +4 can stack on +2
    }
    return false; // If there's a pending draw, no other card is playable
  }

  // Normal rule: Wilds always playable
  if (card.color === 'wild') return true;

  // Match active color, exactly for 'discard_all' or any match
  if (card.value === 'discard_all') return card.color === state.currentColor;

  return card.color === state.currentColor || card.value === top.value;
}

/** Does the player have ANY playable card? */
export function hasPlayableCard(hand: Card[], state: GameState): boolean {
  return hand.some((c) => isPlayable(c, state));
}

/** Result of playing a card */
export interface PlayResult {
  draw: number;       // cards next player must draw (from stacking)
  skipNext: boolean;  // next player skips (standard skip)
  reversal: boolean;  // direction reverses
  newColor: CardColor;// active color after play
  activeStackType: 'draw2' | 'wild4' | null;
}

export function resolvePlay(card: Card, chosenColor: CardColor | undefined, state: GameState, numPlayers: number): PlayResult {
  let draw = 0;
  let skipNext = false;
  let reversal = false;
  let newColor: CardColor = card.color !== 'wild' ? card.color : (chosenColor ?? 'red');
  let activeStackType: 'draw2' | 'wild4' | null = state.activeStackType;

  switch (card.value) {
    case 'draw2':
      draw = state.pendingDraw + 2;
      skipNext = false; // We do not skip! The next player gets a chance to stack!
      activeStackType = 'draw2';
      break;
    case 'wild4':
      draw = state.pendingDraw + 4;
      skipNext = false; // Next player can stack +4
      activeStackType = 'wild4';
      break;
    case 'skip':
      skipNext = true;
      break;
    case 'reverse':
      reversal = true;
      if (numPlayers === 2) {
         skipNext = true; // Reverse behaves like Skip for 2 players
      }
      break;
    case 'discard_all':
      // Handled outside for discarding logic
      break;
    case 'wild':
      break;
  }

  return { draw, skipNext, reversal, newColor, activeStackType };
}

/** Given current index and direction, find next player index */
export function nextIndex(current: number, total: number, dir: 'cw' | 'ccw', skip = false): number {
  const step = dir === 'cw' ? 1 : -1;
  let next = (current + step + total) % total;
  if (skip) next = (next + step + total) % total;
  return next;
}

/** Check if someone wins */
export function checkWin(hand: Card[]): boolean {
  return hand.length === 0;
}
