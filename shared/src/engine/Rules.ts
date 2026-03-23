// ─── NOVA CARDS – Rules Engine ────────────────────────────────────────────────
import type { Card, CardColor, GameState } from '../types/index';

/** Can this card be played on the current discard + active color? */
export function isPlayable(card: Card, state: GameState): boolean {
  const top = state.discardPile[state.discardPile.length - 1];
  if (!top) return true;

  // Wilds are always playable (unless stacking +2 rule applies)
  if (card.color === 'wild') return true;

  // Stacking rule: if pendingDraw > 0, can only play draw2 on draw2
  if (state.pendingDraw > 0) {
    return card.value === 'draw2' || card.value === 'wild4';
  }

  // Match active color or card value
  return card.color === state.currentColor || card.value === top.value;
}

/** Does the player have ANY playable card? */
export function hasPlayableCard(hand: Card[], state: GameState): boolean {
  return hand.some((c) => isPlayable(c, state));
}

/** Result of playing a card */
export interface PlayResult {
  draw: number;       // cards next player must draw (from stacking)
  skipNext: boolean;  // next player skips
  reversal: boolean;  // direction reverses
  newColor: CardColor;// active color after play
}

export function resolvePlay(card: Card, chosenColor: CardColor | undefined, state: GameState): PlayResult {
  let draw = 0;
  let skipNext = false;
  let reversal = false;
  let newColor: CardColor = card.color !== 'wild' ? card.color : (chosenColor ?? 'red');

  switch (card.value) {
    case 'draw2':
      draw = state.pendingDraw + 2;
      skipNext = true;
      break;
    case 'wild4':
      draw = state.pendingDraw + 4;
      skipNext = true;
      break;
    case 'skip':
      skipNext = true;
      break;
    case 'reverse':
      reversal = true;
      break;
    case 'wild':
      // color already resolved above
      break;
  }

  return { draw, skipNext, reversal, newColor };
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
