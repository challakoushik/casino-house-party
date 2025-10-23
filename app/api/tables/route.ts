import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as redis from '@/lib/redis';
import { Table } from '@/lib/types';

export async function GET() {
  try {
    const tables = await redis.getAllTables();
    return NextResponse.json(tables);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tables' + error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, game, minBet = 10, maxBet = 1000 } = body;

    if (!name || !game) {
      return NextResponse.json({ error: 'Name and game are required' }, { status: 400 });
    }

    if (!['roulette', 'baccarat', 'three-card-poker', 'blackjack'].includes(game)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const table: Table = {
      id: uuidv4(),
      name,
      game,
      players: [],
      minBet,
      maxBet,
      state: 'waiting',
    };

    await redis.setTable(table);
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create table' + error }, { status: 500 });
  }
}
