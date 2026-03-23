// ─── NOVA CARDS – Bot AI Player ───────────────────────────────────────────────
import type { Card, CardColor, GameState } from '../../../shared/src/types/index';
import { isPlayable } from '../../../shared/src/engine/Rules';

export type BotDecision =
  | { type: 'play'; cardId: string; chosenColor?: CardColor }
  | { type: 'draw' };

/** Count each color in hand – returns dominant color */
function dominantColor(hand: Card[]): CardColor {
  const counts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const card of hand) {
    if (card.color !== 'wild') counts[card.color]++;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as CardColor);
}

/** Smart bot decision: returns card to play or 'draw' */
export function botDecide(myId: string, hand: Card[], state: GameState): BotDecision {
  const playable = hand.filter(c => isPlayable(c, state));
  if (!playable.length) return { type: 'draw' };

  // Priority 1: exact color + value match (burn lowest-value card first)
  const top = state.discardPile[state.discardPile.length - 1];

  // Priority 2: stack draw2/wild4 if pendingDraw > 0
  if (state.pendingDraw > 0) {
    const stacker = playable.find(c => c.value === 'draw2' || c.value === 'wild4');
    if (stacker) return { type: 'play', cardId: stacker.id, chosenColor: stacker.color !== 'wild' ? stacker.color : dominantColor(hand) };
    // Cannot stack – must take pending draw (handled server side by returning draw)
    return { type: 'draw' };
  }

  // Priority 3: save wild4 – use only when no other option
  const nonWild4 = playable.filter(c => c.value !== 'wild4');

  // Priority 4: play +2 if another player is winning
  const plus2 = (nonWild4.length ? nonWild4 : playable).find(c => c.value === 'draw2');
  if (plus2 && state.players.some(p => p.id !== myId && p.handCount <= 2)) {
    return { type: 'play', cardId: plus2.id, chosenColor: plus2.color };
  }

  // Priority 5: play skip/reverse
  const special = (nonWild4.length ? nonWild4 : playable).find(c =>
    c.value === 'skip' || c.value === 'reverse'
  );
  if (special) return { type: 'play', cardId: special.id, chosenColor: special.color };

  // Priority 6: match color OR value (prefer non-wild)
  const preferred = (nonWild4.length ? nonWild4 : playable).find(c => c.color === state.currentColor);
  if (preferred) return { type: 'play', cardId: preferred.id, chosenColor: preferred.color };

  // Priority 7: any playable non-wild4
  const any = nonWild4.length ? nonWild4[0] : playable[0];
  const chosenColor: CardColor = any.color !== 'wild' ? any.color : dominantColor(hand);
  return { type: 'play', cardId: any.id, chosenColor };
}

/** Random humanlike delay 300–900ms */
export function botDelay(): Promise<void> {
  const ms = 300 + Math.floor(Math.random() * 600);
  return new Promise(resolve => setTimeout(resolve, ms));
}
