// Baccarat game logic
import { Card, createDeck, shuffleDeck, calculateBaccaratValue } from '../cards';

export function playBaccarat(): {
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  winner: 'player' | 'banker' | 'tie';
} {
  const deck = shuffleDeck(createDeck());
  let deckIndex = 0;

  // Initial deal: 2 cards each, alternating
  const playerCards: Card[] = [deck[deckIndex++], deck[deckIndex++]];
  const bankerCards: Card[] = [deck[deckIndex++], deck[deckIndex++]];

  let playerScore = calculateBaccaratValue(playerCards);
  let bankerScore = calculateBaccaratValue(bankerCards);

  // Check for natural (8 or 9)
  if (playerScore >= 8 || bankerScore >= 8) {
    return determineWinner(playerCards, bankerCards, playerScore, bankerScore);
  }

  // Player's third card rule
  let playerThirdCard: Card | undefined;
  if (playerScore <= 5) {
    playerThirdCard = deck[deckIndex++];
    playerCards.push(playerThirdCard);
    playerScore = calculateBaccaratValue(playerCards);
  }

  // Banker's third card rule
  const playerThirdValue = playerThirdCard ? calculateBaccaratValue([playerThirdCard]) : undefined;
  
  if (playerThirdCard === undefined) {
    // Player stood, banker draws on 0-5, stands on 6-7
    if (bankerScore <= 5) {
      bankerCards.push(deck[deckIndex++]);
      bankerScore = calculateBaccaratValue(bankerCards);
    }
  } else {
    // Complex banker rules based on player's third card
    const shouldBankerDraw = 
      (bankerScore <= 2) ||
      (bankerScore === 3 && playerThirdValue !== 8) ||
      (bankerScore === 4 && playerThirdValue! >= 2 && playerThirdValue! <= 7) ||
      (bankerScore === 5 && playerThirdValue! >= 4 && playerThirdValue! <= 7) ||
      (bankerScore === 6 && (playerThirdValue === 6 || playerThirdValue === 7));
    
    if (shouldBankerDraw) {
      bankerCards.push(deck[deckIndex++]);
      bankerScore = calculateBaccaratValue(bankerCards);
    }
  }

  return determineWinner(playerCards, bankerCards, playerScore, bankerScore);
}

function determineWinner(
  playerCards: Card[],
  bankerCards: Card[],
  playerScore: number,
  bankerScore: number
): {
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  winner: 'player' | 'banker' | 'tie';
} {
  let winner: 'player' | 'banker' | 'tie';
  if (playerScore > bankerScore) {
    winner = 'player';
  } else if (bankerScore > playerScore) {
    winner = 'banker';
  } else {
    winner = 'tie';
  }

  return { playerCards, bankerCards, playerScore, bankerScore, winner };
}

export function calculateBaccaratPayout(
  betType: 'player' | 'banker' | 'tie',
  winner: 'player' | 'banker' | 'tie',
  betAmount: number
): number {
  if (betType === winner) {
    if (betType === 'player') {
      return betAmount; // 1:1
    } else if (betType === 'banker') {
      return betAmount * 0.95; // 1:1 minus 5% commission
    } else if (betType === 'tie') {
      return betAmount * 8; // 8:1
    }
  }
  return 0;
}
