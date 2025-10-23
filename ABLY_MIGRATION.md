# Migration to Ably (Serverless Real-time Communication)

This document explains the migration from Socket.io to Ably for serverless compatibility.

## What Changed

### Before (Socket.io)
- Custom Node.js server (`server.js`) 
- Socket.io server and client libraries
- Required persistent server connection
- Not compatible with serverless/edge deployments

### After (Ably)
- Standard Next.js serverless API routes
- Ably Realtime client library
- REST API for server-side message publishing
- Fully compatible with Vercel edge functions

## Setup Instructions

### 1. Get Ably API Key
1. Sign up at [ably.com](https://ably.com)
2. Create a new app
3. Copy your API key from the dashboard
4. Add it to your `.env.local` file:
   ```
   NEXT_PUBLIC_ABLY_API_KEY=your-api-key-here
   ```

### 2. Channel Structure
- `table-{tableId}` - Table-specific events (bets, game state, results)
- `global` - Global events (table deletion, etc.)

### 3. Event Types
- `player-joined` - Player joins a table
- `player-left` - Player leaves a table  
- `bet-placed` - New bet placed
- `countdown-update` - Betting countdown timer
- `game-state-changed` - Game state transitions
- `game-result` - Game outcomes
- `baccarat-result` - Baccarat-specific results
- `blackjack-deal` - Blackjack card dealing
- `blackjack-dealer-final` - Dealer's final hand
- `three-card-poker-deal` - Three card poker dealing

## Benefits

1. **Serverless Compatible**: Works with Vercel edge functions
2. **Scalable**: Ably handles millions of concurrent connections
3. **Reliable**: Built-in message delivery guarantees
4. **Global**: Low-latency worldwide infrastructure
5. **Cost Effective**: Pay only for what you use

## Local Development

For local development, you can still run the app with:
```bash
npm run dev
```

The app will work exactly the same as before, but now uses Ably for real-time communication instead of Socket.io.

## Deployment

Deploy to Vercel with one click:
1. Push your code to GitHub
2. Connect to Vercel
3. Add your `NEXT_PUBLIC_ABLY_API_KEY` environment variable
4. Deploy!

The app will automatically scale and handle any number of concurrent users.