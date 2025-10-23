// Game manager - handles game lifecycle and state transitions
import * as redis from './redis';
import { Table, Player, Bet, CasinoState } from './types';
import { spinWheel, calculateRoulettePayout } from './games/roulette';
import { playBaccarat, calculateBaccaratPayout } from './games/baccarat';
import { BlackjackGame, determineBlackjackWinner } from './games/blackjack';
import { ThreeCardPokerGame, calculateThreeCardPokerPayout } from './games/three-card-poker';

// Track active game timers
const gameTimers: Map<string, NodeJS.Timeout> = new Map();
const gameBets: Map<string, Bet[]> = new Map();

/**
 * Start betting countdown for a table
 * This is called when the first bet is placed
 */
export function startBettingCountdown(tableId: string, io: any) {
  // If a timer already exists, don't start a new one
  if (gameTimers.has(tableId)) {
    return;
  }

  console.log(`Starting betting countdown for table ${tableId}`);
  
  // Countdown duration in seconds (60 seconds in production, 10 for testing)
  const countdownSeconds = process.env.NODE_ENV === 'development' ? 10 : 60;
  let remainingSeconds = countdownSeconds;

  // Emit initial countdown
  io.to(`table-${tableId}`).emit('countdown-update', { 
    remainingSeconds,
    totalSeconds: countdownSeconds 
  });

  // Create interval to update countdown every second
  const countdownInterval = setInterval(() => {
    remainingSeconds--;
    
    if (remainingSeconds > 0) {
      io.to(`table-${tableId}`).emit('countdown-update', { 
        remainingSeconds,
        totalSeconds: countdownSeconds 
      });
    } else {
      clearInterval(countdownInterval);
      gameTimers.delete(tableId);
      
      // Execute the game
      executeGame(tableId, io);
    }
  }, 1000);

  gameTimers.set(tableId, countdownInterval);
}

/**
 * Add a bet to the game's bet list
 */
export function addBet(tableId: string, bet: Bet) {
  if (!gameBets.has(tableId)) {
    gameBets.set(tableId, []);
  }
  gameBets.get(tableId)!.push(bet);
}

/**
 * Execute the game based on the table type
 */
async function executeGame(tableId: string, io: any) {
  try {
    console.log(`Executing game for table ${tableId}`);
    
    const table = await redis.getTable(tableId);
    if (!table) {
      console.error(`Table ${tableId} not found`);
      return;
    }

    // Update table state to playing
    table.state = 'playing';
    await redis.setTable(table);
    io.to(`table-${tableId}`).emit('game-state-changed', { state: 'playing' });

    // Get all bets for this table
    const bets = gameBets.get(tableId) || [];
    
    if (bets.length === 0) {
      console.log(`No bets placed for table ${tableId}, returning to waiting`);
      await resetTableToWaiting(tableId, io);
      return;
    }

    // Execute game based on type
    let gameResult: any;
    let payouts: Map<string, number> = new Map();

    switch (table.game) {
      case 'roulette':
        gameResult = await executeRoulette(table, bets, io);
        payouts = gameResult.payouts;
        break;
      
      case 'baccarat':
        gameResult = await executeBaccarat(table, bets, io);
        payouts = gameResult.payouts;
        break;
      
      case 'blackjack':
        gameResult = await executeBlackjack(table, bets, io);
        payouts = gameResult.payouts;
        break;
      
      case 'three-card-poker':
        gameResult = await executeThreeCardPoker(table, bets, io);
        payouts = gameResult.payouts;
        break;
    }

    // Update table state to finished
    table.state = 'finished';
    await redis.setTable(table);
    io.to(`table-${tableId}`).emit('game-state-changed', { state: 'finished' });

    // Distribute payouts
    await distributePayouts(payouts, io, tableId);

    // Update house balance
    await updateHouseBalance(bets, payouts);

    // Clear bets for this table
    gameBets.delete(tableId);

    // Wait 5 seconds before resetting to waiting
    setTimeout(async () => {
      await resetTableToWaiting(tableId, io);
    }, 20000);

  } catch (error) {
    console.error(`Error executing game for table ${tableId}:`, error);
    // Reset table to waiting on error
    await resetTableToWaiting(tableId, io);
  }
}

/**
 * Execute roulette game
 */
async function executeRoulette(table: Table, bets: Bet[], io: any) {
  const winningNumber = spinWheel();
  console.log(`Roulette: winning number is ${winningNumber}`);

  const payouts = new Map<string, number>();

  // Calculate payouts for each bet
  for (const bet of bets) {
    const rouletteBet = bet as any;
    const payout = calculateRoulettePayout(
      rouletteBet.type,
      rouletteBet.value,
      winningNumber,
      bet.amount
    );

    if (payout > 0) {
      const currentPayout = payouts.get(bet.playerId) || 0;
      payouts.set(bet.playerId, currentPayout + payout + bet.amount); // Return bet + winnings
    }
  }

  // Emit game result
  io.to(`table-${table.id}`).emit('game-result', {
    game: 'roulette',
    result: { winningNumber },
    payouts: Array.from(payouts.entries()).map(([playerId, amount]) => ({
      playerId,
      amount
    }))
  });

  return { payouts };
}

/**
 * Execute baccarat game
 */
async function executeBaccarat(table: Table, bets: Bet[], io: any) {
  const gameResult = playBaccarat();
  console.log(`Baccarat: winner is ${gameResult.winner}`);

  // Emit game result
  io.to(`table-${table.id}`).emit('baccarat-result', {
    playerCards: gameResult.playerCards,
    bankerCards: gameResult.bankerCards,
    playerScore: gameResult.playerScore,
    bankerScore: gameResult.bankerScore,
    winner: gameResult.winner
  });

  const payouts = new Map<string, number>();

  // Calculate payouts for each bet
  for (const bet of bets) {
    const baccaratBet = bet as any;
    const payout = calculateBaccaratPayout(
      baccaratBet.type,
      gameResult.winner,
      bet.amount
    );

    if (payout > 0) {
      const currentPayout = payouts.get(bet.playerId) || 0;
      payouts.set(bet.playerId, currentPayout + payout + bet.amount); // Return bet + winnings
    }
  }

  // Emit game result
  io.to(`table-${table.id}`).emit('game-result', {
    game: 'baccarat',
    result: gameResult,
    payouts: Array.from(payouts.entries()).map(([playerId, amount]) => ({
      playerId,
      amount
    }))
  });

  return { payouts };
}

/**
 * Execute blackjack game
 */
async function executeBlackjack(table: Table, bets: Bet[], io: any) {
  const game = new BlackjackGame();
  
  // Deal initial hands
  const dealerCards = game.dealInitialHand();
  const playerHands = new Map<string, any>();

  // Group bets by player
  const playerBets = new Map<string, number>();
  for (const bet of bets) {
    const currentBet = playerBets.get(bet.playerId) || 0;
    playerBets.set(bet.playerId, currentBet + bet.amount);
    
    if (!playerHands.has(bet.playerId)) {
      playerHands.set(bet.playerId, game.dealInitialHand());
    }
  }

  // Emit initial deal
  io.to(`table-${table.id}`).emit('blackjack-deal', {
    dealerCards: [dealerCards[0]], // Show only one dealer card
    playerHands: Array.from(playerHands.entries()).map(([playerId, cards]) => ({
      playerId,
      cards: cards
    }))
  });

  // Dealer plays (simplified - all players stand)
  while (game.shouldDealerHit(dealerCards)) {
    dealerCards.push(game.dealCard());
  }

  // Emit dealer's final hand
  io.to(`table-${table.id}`).emit('blackjack-dealer-final', {
    dealerCards: dealerCards
  });

  const payouts = new Map<string, number>();

  // Calculate payouts for each player
  for (const [playerId, cards] of playerHands.entries()) {
    const result = determineBlackjackWinner(cards, dealerCards);
    const betAmount = playerBets.get(playerId) || 0;
    const payout = betAmount * result.payout;

    if (payout > 0) {
      payouts.set(playerId, payout);
    }
  }

  // Emit game result
  io.to(`table-${table.id}`).emit('game-result', {
    game: 'blackjack',
    result: {
      dealerCards: dealerCards,
      playerHands: Array.from(playerHands.entries()).map(([playerId, cards]) => ({
        playerId,
        cards: cards
      }))
    },
    payouts: Array.from(payouts.entries()).map(([playerId, amount]) => ({
      playerId,
      amount
    }))
  });

  return { payouts };
}

/**
 * Execute three card poker game
 */
async function executeThreeCardPoker(table: Table, bets: Bet[], io: any) {
  const game = new ThreeCardPokerGame();
  
  const dealerCards = game.dealHand();
  const playerHands = new Map<string, any>();

  // Group bets by player and type
  const playerAnteBets = new Map<string, number>();
  const playerPairPlusBets = new Map<string, number>();
  
  for (const bet of bets) {
    const pokerBet = bet as any;
    if (pokerBet.type === 'ante') {
      const currentBet = playerAnteBets.get(bet.playerId) || 0;
      playerAnteBets.set(bet.playerId, currentBet + bet.amount);
      
      if (!playerHands.has(bet.playerId)) {
        playerHands.set(bet.playerId, game.dealHand());
      }
    } else if (pokerBet.type === 'pair-plus') {
      const currentBet = playerPairPlusBets.get(bet.playerId) || 0;
      playerPairPlusBets.set(bet.playerId, currentBet + bet.amount);
    }
  }

  // Emit deal
  io.to(`table-${table.id}`).emit('three-card-poker-deal', {
    dealerCards: dealerCards,
    playerHands: Array.from(playerHands.entries()).map(([playerId, cards]) => ({
      playerId,
      cards: cards
    }))
  });

  const payouts = new Map<string, number>();

  // Calculate payouts for each player
  for (const [playerId, cards] of playerHands.entries()) {
    const anteBet = playerAnteBets.get(playerId) || 0;
    const pairPlusBet = playerPairPlusBets.get(playerId) || 0;
    
    const result = calculateThreeCardPokerPayout(
      cards,
      dealerCards,
      anteBet,
      pairPlusBet
    );

    if (result.totalPayout > 0) {
      payouts.set(playerId, result.totalPayout);
    }
  }

  // Emit game result
  io.to(`table-${table.id}`).emit('game-result', {
    game: 'three-card-poker',
    result: {
      dealerCards: dealerCards,
      playerHands: Array.from(playerHands.entries()).map(([playerId, cards]) => ({
        playerId,
        cards: cards
      }))
    },
    payouts: Array.from(payouts.entries()).map(([playerId, amount]) => ({
      playerId,
      amount
    }))
  });

  return { payouts };
}

/**
 * Distribute payouts to players
 */
async function distributePayouts(payouts: Map<string, number>, io: any, tableId: string) {
  for (const [playerId, amount] of payouts.entries()) {
    const player = await redis.getPlayer(playerId);
    if (player) {
      player.balance += amount;
      await redis.setPlayer(player);
      
      // Emit balance update
      io.to(`table-${tableId}`).emit('player-balance-updated', {
        playerId,
        balance: player.balance,
        payout: amount
      });
    }
  }
}

/**
 * Update house balance based on bets and payouts
 */
async function updateHouseBalance(bets: Bet[], payouts: Map<string, number>) {
  const totalBets = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalPayouts = Array.from(payouts.values()).reduce((sum, payout) => sum + payout, 0);
  const houseProfit = totalBets - totalPayouts;

  const casino = await redis.getCasinoState();
  await redis.updateCasinoState({
    houseBalance: casino.houseBalance + houseProfit,
    totalBets: casino.totalBets + totalBets,
    totalPayout: casino.totalPayout + totalPayouts
  });

  console.log(`House balance updated: +${houseProfit} (Total bets: ${totalBets}, Total payouts: ${totalPayouts})`);
}

/**
 * Reset table to waiting state
 */
async function resetTableToWaiting(tableId: string, io: any) {
  const table = await redis.getTable(tableId);
  if (table) {
    table.state = 'waiting';
    await redis.setTable(table);
    io.to(`table-${tableId}`).emit('game-state-changed', { state: 'waiting' });
    console.log(`Table ${tableId} reset to waiting state`);
  }
}

/**
 * Cancel a game timer (e.g., if table is deleted)
 */
export function cancelGameTimer(tableId: string) {
  const timer = gameTimers.get(tableId);
  if (timer) {
    clearInterval(timer);
    gameTimers.delete(tableId);
  }
  gameBets.delete(tableId);
}
