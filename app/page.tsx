import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">🎰 Casino Party</h1>
          <p className="text-xl text-gray-300">
            Welcome to your home casino! Choose your role to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin"
            className="group bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="text-5xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin</h2>
            <p className="text-red-100">
              Manage players, tables, and add chips to wallets
            </p>
          </Link>

          <Link
            href="/player"
            className="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">Player</h2>
            <p className="text-blue-100">
              Join tables, place bets, and track your winnings
            </p>
          </Link>

          <Link
            href="/table"
            className="group bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-2xl font-bold text-white mb-2">Table Screen</h2>
            <p className="text-green-100">
              Display game state with beautiful animations
            </p>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 text-gray-300">
            <h3 className="text-lg font-semibold mb-2 text-white">Available Games</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="px-4 py-2 bg-purple-600 rounded-full text-sm">🎡 Roulette</span>
              <span className="px-4 py-2 bg-purple-600 rounded-full text-sm">🃏 Baccarat</span>
              <span className="px-4 py-2 bg-purple-600 rounded-full text-sm">🎴 Three Card Poker</span>
              <span className="px-4 py-2 bg-purple-600 rounded-full text-sm">🂡 Blackjack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
