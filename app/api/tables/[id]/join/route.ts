import { NextRequest, NextResponse } from 'next/server';
import * as redis from '@/lib/redis';
import { publishToChannel, getTableChannel, AblyEvents } from '@/lib/ably';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params;
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const table = await redis.addPlayerToTable(tableId, playerId);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Publish event via Ably
    await publishToChannel(
      getTableChannel(tableId), 
      AblyEvents.PLAYER_JOINED, 
      { playerId, tableId }
    );

    return NextResponse.json(table);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join table' }, { status: 500 });
  }
}
