// ─── NOVA CARDS – Card & Deck ─────────────────────────────────────────────────
import type { Card, CardColor, CardValue } from '../types/index';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const NUMBERS: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SPECIALS: CardValue[] = ['skip', 'reverse', 'draw2'];
const WILDS: CardValue[] = ['wild', 'wild4'];

let _id = 0;
function uid(): string {
  return `c_${++_id}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildClassicDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    // One 0 per color
    deck.push({ id: uid(), color, value: '0' });
    // Two of each 1–9 and specials
    for (const value of [...NUMBERS.slice(1), ...SPECIALS]) {
      deck.push({ id: uid(), color, value });
      deck.push({ id: uid(), color, value });
    }
  }

  // 4 of each wild
  for (const value of WILDS) {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: uid(), color: 'wild', value });
    }
  }

  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardScore(card: Card): number {
  if (card.value === 'wild4') return 50;
  if (card.value === 'wild') return 40;
  if (['skip', 'reverse', 'draw2'].includes(card.value)) return 20;
  return parseInt(card.value, 10);
}
