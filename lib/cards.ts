// Card utilities for card games

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type Card = `${Rank}${Suit}`;

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}` as Card);
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardValue(card: Card, aceAs11: boolean = true): number {
  const rank = card.slice(0, -1) as Rank;
  if (rank === 'A') return aceAs11 ? 11 : 1;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank);
}

// Blackjack hand value calculation
export function calculateBlackjackValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of cards) {
    const rank = card.slice(0, -1) as Rank;
    if (rank === 'A') {
      aces++;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(rank)) {
      value += 10;
    } else {
      value += parseInt(rank);
    }
  }
  
  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

// Baccarat hand value calculation
export function calculateBaccaratValue(cards: Card[]): number {
  let value = 0;
  for (const card of cards) {
    const rank = card.slice(0, -1) as Rank;
    if (['J', 'Q', 'K'].includes(rank)) {
      value += 0;
    } else if (rank === 'A') {
      value += 1;
    } else {
      value += parseInt(rank);
    }
  }
  return value % 10; // Only last digit counts in baccarat
}

// Three Card Poker hand evaluation
export type PokerHandRank = 
  | 'high-card'
  | 'pair' 
  | 'flush' 
  | 'straight' 
  | 'three-of-a-kind' 
  | 'straight-flush';

export function evaluatePokerHand(cards: Card[]): { rank: PokerHandRank; value: number } {
  if (cards.length !== 3) throw new Error('Must have exactly 3 cards');
  
  const suits = cards.map(c => c.slice(-1));
  const ranks = cards.map(c => c.slice(0, -1) as Rank);
  const values = ranks.map(r => {
    if (r === 'A') return 14;
    if (r === 'K') return 13;
    if (r === 'Q') return 12;
    if (r === 'J') return 11;
    return parseInt(r);
  }).sort((a, b) => b - a);
  
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = (values[0] - values[1] === 1 && values[1] - values[2] === 1) ||
                     (values[0] === 14 && values[1] === 3 && values[2] === 2); // A-2-3
  
  const rankCounts = new Map<number, number>();
  values.forEach(v => rankCounts.set(v, (rankCounts.get(v) || 0) + 1));
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  
  if (isFlush && isStraight) {
    return { rank: 'straight-flush', value: values[0] };
  }
  if (counts[0] === 3) {
    return { rank: 'three-of-a-kind', value: values[0] };
  }
  if (isStraight) {
    return { rank: 'straight', value: values[0] };
  }
  if (isFlush) {
    return { rank: 'flush', value: values[0] };
  }
  if (counts[0] === 2) {
    return { rank: 'pair', value: values[0] };
  }
  return { rank: 'high-card', value: values[0] };
}

export function getPokerPayout(handRank: PokerHandRank): number {
  switch (handRank) {
    case 'straight-flush': return 40;
    case 'three-of-a-kind': return 30;
    case 'straight': return 6;
    case 'flush': return 3;
    case 'pair': return 1;
    default: return 0;
  }
}
