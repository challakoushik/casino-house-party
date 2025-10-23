// Three Card Poker game logic
import { Card, createDeck, shuffleDeck, evaluatePokerHand, getPokerPayout, PokerHandRank } from '../cards';

export class ThreeCardPokerGame {
  private deck: Card[];
  private deckIndex: number = 0;

  constructor() {
    this.deck = shuffleDeck(createDeck());
  }

  dealCard(): Card {
    if (this.deckIndex >= this.deck.length) {
      this.deck = shuffleDeck(createDeck());
      this.deckIndex = 0;
    }
    return this.deck[this.deckIndex++];
  }

  dealHand(): Card[] {
    return [this.dealCard(), this.dealCard(), this.dealCard()];
  }
}

export function dealerQualifies(dealerCards: Card[]): boolean {
  const hand = evaluatePokerHand(dealerCards);
  // Dealer qualifies with Queen high or better
  if (hand.rank !== 'high-card') return true;
  return hand.value >= 12; // Q=12, K=13, A=14
}

export function comparePokerHands(
  playerCards: Card[],
  dealerCards: Card[]
): { playerWins: boolean; reason: string } {
  const playerHand = evaluatePokerHand(playerCards);
  const dealerHand = evaluatePokerHand(dealerCards);

  const rankOrder: PokerHandRank[] = [
    'high-card',
    'pair',
    'flush',
    'straight',
    'three-of-a-kind',
    'straight-flush'
  ];

  const playerRankIndex = rankOrder.indexOf(playerHand.rank);
  const dealerRankIndex = rankOrder.indexOf(dealerHand.rank);

  if (playerRankIndex > dealerRankIndex) {
    return { playerWins: true, reason: `Player has ${playerHand.rank}` };
  } else if (playerRankIndex < dealerRankIndex) {
    return { playerWins: false, reason: `Dealer has ${dealerHand.rank}` };
  } else {
    // Same rank, compare values
    if (playerHand.value > dealerHand.value) {
      return { playerWins: true, reason: `Player has higher ${playerHand.rank}` };
    } else if (playerHand.value < dealerHand.value) {
      return { playerWins: false, reason: `Dealer has higher ${dealerHand.rank}` };
    } else {
      return { playerWins: false, reason: 'Push' };
    }
  }
}

export function calculateThreeCardPokerPayout(
  playerCards: Card[],
  dealerCards: Card[],
  anteBet: number,
  pairPlusBet: number = 0
): { totalPayout: number; anteWin: number; pairPlusWin: number; reason: string } {
  const playerHand = evaluatePokerHand(playerCards);
  const dealerQual = dealerQualifies(dealerCards);
  
  let anteWin = 0;
  let pairPlusWin = 0;
  let reason = '';

  // Pair Plus always pays regardless of dealer
  if (pairPlusBet > 0 && playerHand.rank !== 'high-card') {
    const multiplier = getPokerPayout(playerHand.rank);
    pairPlusWin = pairPlusBet * multiplier;
  }

  // Ante/Play bet
  if (!dealerQual) {
    // Dealer doesn't qualify, ante bet pushes, play bet wins
    anteWin = anteBet * 2; // Return ante + play bet
    reason = "Dealer doesn't qualify";
  } else {
    const result = comparePokerHands(playerCards, dealerCards);
    if (result.playerWins) {
      anteWin = anteBet * 2; // 1:1 on both ante and play
      reason = result.reason;
      
      // Ante bonus for premium hands
      if (playerHand.rank === 'straight') anteWin += anteBet;
      if (playerHand.rank === 'three-of-a-kind') anteWin += anteBet * 4;
      if (playerHand.rank === 'straight-flush') anteWin += anteBet * 5;
    } else {
      reason = result.reason;
    }
  }

  return {
    totalPayout: anteWin + pairPlusWin,
    anteWin,
    pairPlusWin,
    reason
  };
}
