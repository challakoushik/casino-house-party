# EdgeDB Migration Guide

This project has been successfully migrated from in-memory storage to EdgeDB for better scalability on Vercel edge functions.

## What Changed

1. **Database**: Replaced in-memory store with EdgeDB cloud database
2. **Storage**: All data (players, tables, game states, casino state) now persists in EdgeDB
3. **Edge Compatibility**: EdgeDB works perfectly with Vercel edge functions across multiple regions

## Environment Setup

The following environment variables are configured in `.env`:

```
EDGEDB_INSTANCE="vercel-DCN0RMe0fGS2TThnRVALm32e/casion-house-party-db"
EDGEDB_SECRET_KEY="nbwt1_..."
```

## Database Schema

The EdgeDB schema is defined in `dbschema/default.esdl` with the following types:
- `Player`: User accounts with balance and current table
- `Table`: Game tables with player associations
- `GameState`: Current state of games at tables
- `Bet`: Individual bets with relationships to players and tables
- `CasinoState`: Global casino statistics

## API Changes

All existing functions in `lib/redis.ts` maintain the same interface:

### Player Operations
- `getPlayer(id)` - Get player by ID
- `getAllPlayers()` - Get all players
- `setPlayer(player)` - Create/update player
- `deletePlayer(id)` - Delete player
- `updatePlayerBalance(id, amount)` - Update player balance

### Table Operations  
- `getTable(id)` - Get table by ID
- `getAllTables()` - Get all tables
- `setTable(table)` - Create/update table
- `deleteTable(id)` - Delete table
- `addPlayerToTable(tableId, playerId)` - Add player to table
- `removePlayerFromTable(tableId, playerId)` - Remove player from table

### Game State Operations
- `getGameState(tableId)` - Get game state for table
- `setGameState(state)` - Set game state
- `deleteGameState(tableId)` - Delete game state

### Casino Operations
- `getCasinoState()` - Get casino statistics
- `updateCasinoState(update)` - Update casino state
- `addToCasinoBalance(amount)` - Add to casino balance

## Benefits

1. **Scalability**: Database persists across Vercel edge function restarts
2. **Multi-region**: Data is consistent across all edge deployment regions
3. **Performance**: EdgeDB provides fast queries optimized for your data model
4. **Reliability**: No more data loss when edge functions restart
5. **Real-time**: Multiple users can now interact with shared game state

## Next Steps

1. Deploy to Vercel with the EdgeDB environment variables
2. The EdgeDB schema will be automatically applied on first connection
3. All existing functionality will work seamlessly with persistent storage

## Troubleshooting

- If you see connection errors, verify the `EDGEDB_INSTANCE` and `EDGEDB_SECRET_KEY` values
- EdgeDB queries are automatically retried on connection issues
- Error logging is included for debugging database operations