import { NextRequest, NextResponse } from 'next/server';
import * as redis from '@/lib/redis';
import { Player } from '@/lib/types';

export async function GET() {
  try {
    const players = await redis.getAllPlayers();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, balance = 0 } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const playerData = {
      name,
      balance,
    };

    const createdPlayer = await redis.setPlayer(playerData);
    return NextResponse.json(createdPlayer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' + error }, { status: 500 });
  }
}
