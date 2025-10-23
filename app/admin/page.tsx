'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Player, Table, CasinoState } from '@/lib/types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [casino, setCasino] = useState<CasinoState | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [selectedGame, setSelectedGame] = useState<'roulette' | 'baccarat' | 'three-card-poker' | 'blackjack'>('roulette');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [chipAmount, setChipAmount] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [playersRes, tablesRes, casinoRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/tables'),
        fetch('/api/admin/casino'),
      ]);

      if (playersRes.ok) setPlayers(await playersRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
      if (casinoRes.ok) setCasino(await casinoRes.json());
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'koushikisgreat') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
      setPasswordInput('');
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName, balance: 0 }),
      });

      if (res.ok) {
        setNewPlayerName('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to add player:', error);
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      await fetch(`/api/players/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Failed to delete player:', error);
    }
  };

  const addTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTableName, 
          game: selectedGame,
          minBet: 50,
          maxBet: 1000
        }),
      });

      if (res.ok) {
        setNewTableName('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to add table:', error);
    }
  };

  const addChips = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !chipAmount) return;

    try {
      const res = await fetch('/api/admin/add-chips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId: selectedPlayer, 
          amount: parseFloat(chipAmount)
        }),
      });

      if (res.ok) {
        setChipAmount('');
        setSelectedPlayer('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to add chips:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-8">
        <div className="bg-gray-800/80 backdrop-blur rounded-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">👑 Admin Access</h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Enter Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-bold"
            >
              Access Admin Dashboard
            </button>
          </form>
          <Link 
            href="/" 
            className="block text-center mt-4 text-gray-400 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">👑 Admin Dashboard</h1>
          <Link 
            href="/" 
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Casino Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">House Balance</h3>
            <p className="text-3xl font-bold text-green-400">
              ₹{casino?.houseBalance.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Bets</h3>
            <p className="text-3xl font-bold text-blue-400">
              ₹{casino?.totalBets.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
            <h3 className="text-gray-400 text-sm mb-2">Total Payout</h3>
            <p className="text-3xl font-bold text-purple-400">
              ₹{casino?.totalPayout.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Players Management */}
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Players</h2>
            
            <form onSubmit={addPlayer} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Add Player
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{player.name}</p>
                    <p className="text-sm text-gray-400">
                      Balance: ₹{player.balance.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePlayer(player.id)}
                    className="px-3 py-1 bg-red-600/50 hover:bg-red-600 text-white text-sm rounded transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-gray-400 text-center py-4">No players yet</p>
              )}
            </div>
          </div>

          {/* Tables Management */}
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Tables</h2>
            
            <form onSubmit={addTable} className="mb-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Table name"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="roulette">🎡 Roulette</option>
                  <option value="baccarat">🃏 Baccarat</option>
                  <option value="three-card-poker">🎴 Three Card Poker</option>
                  <option value="blackjack">🂡 Blackjack</option>
                </select>
                <button
                  type="submit"
                  className="w-full px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Add Table
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-gray-700/50 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white font-medium">{table.name}</p>
                    <span className="text-xs px-2 py-1 bg-purple-600 rounded text-white">
                      {table.game}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Players: {table.players.length} | State: {table.state}
                  </p>
                </div>
              ))}
              {tables.length === 0 && (
                <p className="text-gray-400 text-center py-4">No tables yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Add Chips Section */}
        <div className="mt-8 bg-gray-800/80 backdrop-blur rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Add Chips to Player</h2>
          <form onSubmit={addChips} className="flex gap-4">
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} (₹{player.balance.toFixed(2)})
                </option>
              ))}
            </select>
            <input
              type="number"
              value={chipAmount}
              onChange={(e) => setChipAmount(e.target.value)}
              placeholder="Amount"
              min="0"
              step="0.01"
              className="w-48 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Add Chips
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
