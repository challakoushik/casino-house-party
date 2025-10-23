import { NextRequest, NextResponse } from 'next/server';
import * as redis from '@/lib/redis';
import { Bet } from '@/lib/types';
import { startBettingCountdown, addBet } from '@/lib/game-manager';
import { publishToChannel, getTableChannel, AblyEvents } from '@/lib/ably';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params;
    const body = await request.json();
    const { playerId, amount, type, value } = body;

    if (!playerId || !amount || !type) {
      return NextResponse.json(
        { error: 'playerId, amount, and type are required' },
        { status: 400 }
      );
    }

    // Get table and player
    const [table, player] = await Promise.all([
      redis.getTable(tableId),
      redis.getPlayer(playerId),
    ]);

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Validate player is at table
    if (!table.players.includes(playerId)) {
      return NextResponse.json(
        { error: 'Player not at this table' },
        { status: 400 }
      );
    }

    // Validate bet amount
    if (amount < table.minBet || amount > table.maxBet) {
      return NextResponse.json(
        { error: `Bet must be between ₹${table.minBet} and ₹${table.maxBet}` },
        { status: 400 }
      );
    }

    // Validate player has enough balance
    if (player.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Validate table is accepting bets
    if (table.state !== 'betting' && table.state !== 'waiting') {
      return NextResponse.json(
        { error: 'Table is not accepting bets right now' },
        { status: 400 }
      );
    }

    // Deduct bet from player balance
    player.balance -= amount;
    await redis.setPlayer(player);

    // Create bet object
    const bet: Bet = {
      playerId,
      amount,
      type,
      tableId,
    };

    // Add value for bets that need it (e.g., roulette numbers)
    if (value !== undefined) {
      (bet as Bet & { value?: number | number[] }).value = value;
    }

    // Update table state to betting if it was waiting
    const wasWaiting = table.state === 'waiting';
    if (wasWaiting) {
      table.state = 'betting';
      await redis.setTable(table);
    }

    // Add bet to game manager
    addBet(tableId, bet);

    // Publish bet placed event via Ably
    await publishToChannel(
      getTableChannel(tableId), 
      AblyEvents.BET_PLACED, 
      {
        playerId,
        playerName: player.name,
        bet,
      }
    );

    // Start betting countdown if this is the first bet
    if (wasWaiting) {
      startBettingCountdown(tableId, null); // We'll update game-manager.ts next
    }

    return NextResponse.json({
      success: true,
      bet,
      remainingBalance: player.balance,
    });
  } catch (error) {
    console.error('Bet placement error:', error);
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}
