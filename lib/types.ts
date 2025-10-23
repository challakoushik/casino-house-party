// Core types for the casino app

export interface Player {
  id: string;
  name: string;
  balance: number;
  currentTable?: string;
}

export interface Table {
  id: string;
  name: string;
  game: 'roulette' | 'baccarat' | 'three-card-poker' | 'blackjack';
  players: string[]; // player IDs
  minBet: number;
  maxBet: number;
  state: 'waiting' | 'betting' | 'playing' | 'finished';
}

export interface Bet {
  playerId: string;
  amount: number;
  type: string;
  tableId: string;
}

export interface GameState {
  tableId: string;
  game: string;
  state: 'waiting' | 'betting' | 'playing' | 'finished';
  bets: Bet[];
  result?: any;
}

// Roulette types
export interface RouletteBet extends Bet {
  type: 'number' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen' | 'column';
  value?: number | number[];
}

export interface RouletteState extends GameState {
  spinningNumber?: number;
  winningNumber?: number;
}

// Baccarat types
export interface BaccaratBet extends Bet {
  type: 'player' | 'banker' | 'tie';
}

export interface BaccaratState extends GameState {
  playerCards: string[];
  bankerCards: string[];
  playerScore?: number;
  bankerScore?: number;
  winner?: 'player' | 'banker' | 'tie';
}

// Three Card Poker types
export interface ThreeCardPokerBet extends Bet {
  type: 'ante' | 'pair-plus';
}

export interface ThreeCardPokerState extends GameState {
  dealerCards: string[];
  playerHands: { [playerId: string]: string[] };
  results?: { [playerId: string]: { win: boolean; payout: number } };
}

// Blackjack types
export interface BlackjackBet extends Bet {
  type: 'main';
}

export interface BlackjackState extends GameState {
  dealerCards: string[];
  playerHands: { 
    [playerId: string]: { 
      cards: string[];
      status: 'playing' | 'standing' | 'busted' | 'blackjack';
      bet: number;
    } 
  };
  results?: { [playerId: string]: { win: boolean; payout: number } };
}

export interface CasinoState {
  houseBalance: number;
  totalBets: number;
  totalPayout: number;
}
