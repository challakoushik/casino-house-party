import { NextRequest, NextResponse } from 'next/server';
import * as redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, amount } = body;

    if (!playerId || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Player ID and amount are required' }, { status: 400 });
    }

    const player = await redis.updatePlayerBalance(playerId, amount);
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add chips' }, { status: 500 });
  }
}
