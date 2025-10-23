import { NextRequest, NextResponse } from 'next/server';
import * as redis from '@/lib/redis';
import { publishToChannel, getGlobalChannel, AblyEvents } from '@/lib/ably';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const table = await redis.getTable(id);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    return NextResponse.json(table);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // First check if table exists
    const table = await redis.getTable(id);
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Remove all players from the table before deleting
    for (const playerId of table.players) {
      await redis.removePlayerFromTable(id, playerId);
    }
    
    // Delete any associated game state
    await redis.deleteGameState(id);
    
    // Delete the table
    await redis.deleteTable(id);
    
    // Publish event via Ably
    await publishToChannel(
      getGlobalChannel(), 
      AblyEvents.TABLE_DELETED, 
      { tableId: id }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, minBet, maxBet, state } = body;

    const table = await redis.getTable(id);
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Update table properties
    const updatedTable = {
      ...table,
      ...(name && { name }),
      ...(minBet !== undefined && { minBet }),
      ...(maxBet !== undefined && { maxBet }),
      ...(state && { state })
    };

    await redis.setTable(updatedTable);

    return NextResponse.json(updatedTable);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}