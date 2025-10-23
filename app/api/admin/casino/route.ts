import { NextResponse } from 'next/server';
import * as redis from '@/lib/redis';

export async function GET() {
  try {
    const casinoState = await redis.getCasinoState();
    return NextResponse.json(casinoState);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch casino state' }, { status: 500 });
  }
}
