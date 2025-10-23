# 🎰 Casino Party App

A full-stack home casino party application with real-time multiplayer gaming. Built with Next.js, Ably, and EdgeDB for scalable serverless deployment.

## Features

- **Three User Interfaces:**
  - 👑 **Admin Dashboard**: Manage players, tables, and add chips to wallets
  - 🎮 **Player Interface**: Join tables, place bets, track balance
  - 📺 **Table Screen**: Beautiful display for game state with animations

- **Four Casino Games:**
  - 🎡 Roulette
  - 🃏 Baccarat
  - 🎴 Three Card Poker
  - 🂡 Blackjack

- **Real-time Updates**: Using Ably for live game updates (serverless compatible)
- **Simple Wallet System**: Admin can add chips to player accounts
- **EdgeDB Storage**: Persistent data storage with modern database features
- **Serverless Ready**: Optimized for Vercel edge deployment

## Getting Started

### Prerequisites

1. **Ably Account**: Sign up at [ably.com](https://ably.com) and get your API key
2. **EdgeDB Instance**: Set up a database instance (local or cloud)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Ably API key:
```env
NEXT_PUBLIC_ABLY_API_KEY=your-ably-api-key-here
```

### Running the App

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The app will be available at `http://localhost:3000`

## Usage

### For the Host/Admin:

1. Go to `/admin`
2. Add players by name
3. Create tables for different games
4. Add chips to player wallets when they pay you
5. Monitor the house balance and game statistics

### For Players:

1. Go to `/player`
2. Select your player profile
3. Browse available tables
4. Join a table to start playing
5. Place bets from your phone

### For Table Displays:

1. Go to `/table?id=TABLE_ID` (you can get the table ID from the admin dashboard)
2. Display this on a screen/TV for everyone to see
3. The table will show live game state and player information

## Deployment

### Option 1: Local Network (Recommended for Party)

The easiest way to run this for a house party:

1. Run the app on your laptop: `npm run dev`
2. Find your local IP address (e.g., `192.168.1.100`)
3. Share the URL with your friends: `http://192.168.1.100:3000`
4. Everyone on the same WiFi can access it!

### Option 2: Cloud Deployment

For deployment on platforms like Vercel (recommended for serverless):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy automatically!

**Note**: The app now uses Ably for real-time communication and EdgeDB for persistence, making it fully compatible with serverless edge deployments.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Storage**: EdgeDB cloud database for full persistence
- **Real-time**: Ably for live updates (serverless compatible)
- **Deployment**: Optimized for Vercel edge functions

## Game Rules

### Roulette
- Bet on numbers, colors (red/black), odd/even, or ranges
- Payouts: 35:1 for numbers, 1:1 for colors/odd/even, 2:1 for dozens/columns

### Baccarat
- Bet on Player, Banker, or Tie
- Payouts: Player (1:1), Banker (0.95:1), Tie (8:1)

### Three Card Poker
- Ante bet to play against dealer
- Optional Pair Plus side bet
- Various payouts for poker hands

### Blackjack
- Get closer to 21 than dealer without going over
- Blackjack pays 2.5:1, regular win pays 2:1

## License

MIT
