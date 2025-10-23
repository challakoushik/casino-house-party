// Blackjack game logic
import { Card, createDeck, shuffleDeck, calculateBlackjackValue } from '../cards';

export class BlackjackGame {
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

  dealInitialHand(): Card[] {
    return [this.dealCard(), this.dealCard()];
  }

  isBlackjack(cards: Card[]): boolean {
    return cards.length === 2 && calculateBlackjackValue(cards) === 21;
  }

  isBusted(cards: Card[]): boolean {
    return calculateBlackjackValue(cards) > 21;
  }

  shouldDealerHit(dealerCards: Card[]): boolean {
    const value = calculateBlackjackValue(dealerCards);
    return value < 17;
  }
}

export function determineBlackjackWinner(
  playerCards: Card[],
  dealerCards: Card[]
): { win: boolean; payout: number; reason: string } {
  const playerValue = calculateBlackjackValue(playerCards);
  const dealerValue = calculateBlackjackValue(dealerCards);
  const playerBlackjack = playerCards.length === 2 && playerValue === 21;
  const dealerBlackjack = dealerCards.length === 2 && dealerValue === 21;

  if (playerValue > 21) {
    return { win: false, payout: 0, reason: 'Player busted' };
  }

  if (playerBlackjack && !dealerBlackjack) {
    return { win: true, payout: 2.5, reason: 'Blackjack!' };
  }

  if (dealerBlackjack && !playerBlackjack) {
    return { win: false, payout: 0, reason: 'Dealer blackjack' };
  }

  if (playerBlackjack && dealerBlackjack) {
    return { win: false, payout: 1, reason: 'Push (both blackjack)' };
  }

  if (dealerValue > 21) {
    return { win: true, payout: 2, reason: 'Dealer busted' };
  }

  if (playerValue > dealerValue) {
    return { win: true, payout: 2, reason: 'Player wins' };
  }

  if (playerValue < dealerValue) {
    return { win: false, payout: 0, reason: 'Dealer wins' };
  }

  return { win: false, payout: 1, reason: 'Push' };
}
