'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Player, Table } from '@/lib/types';
import { getAblyClient, subscribeToChannel, unsubscribeFromChannel, getTableChannel, getGlobalChannel, AblyEvents, closeAblyConnection } from '@/lib/ably';

export default function PlayerPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showBettingInterface, setShowBettingInterface] = useState(false);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [selectedBetType, setSelectedBetType] = useState<string>('');
  const [selectedBetValue, setSelectedBetValue] = useState<number | number[] | null>(null);
  const [betMessage, setBetMessage] = useState<string>('');

  const loadData = async () => {
    try {
      const [playersRes, tablesRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/tables'),
      ]);

      if (playersRes.ok) setPlayers(await playersRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentPlayer) {
      // Reload player data periodically
      const interval = setInterval(() => {
        fetch(`/api/players/${currentPlayer.id}`)
          .then(res => res.json())
          .then(data => setCurrentPlayer(data))
          .catch(console.error);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentPlayer]);

  useEffect(() => {
    // Initialize Ably connection
    const ablyClient = getAblyClient();

    // Subscribe to bet placed events
    subscribeToChannel('global', AblyEvents.BET_PLACED, (message) => {
      console.log('Bet placed:', message.data);
      loadData(); // Reload data when bet is placed
    });

    return () => {
      // Clean up subscriptions
      unsubscribeFromChannel('global', AblyEvents.BET_PLACED);
    };
  }, []);

  useEffect(() => {
    if (currentPlayer?.currentTable) {
      // Subscribe to table-specific events
      const tableChannel = getTableChannel(currentPlayer.currentTable);
      subscribeToChannel(tableChannel, AblyEvents.PLAYER_JOINED, () => {
        loadData(); // Reload when players join
      });
      subscribeToChannel(tableChannel, AblyEvents.PLAYER_LEFT, () => {
        loadData(); // Reload when players leave
      });

      return () => {
        unsubscribeFromChannel(tableChannel, AblyEvents.PLAYER_JOINED);
        unsubscribeFromChannel(tableChannel, AblyEvents.PLAYER_LEFT);
      };
    }
  }, [currentPlayer?.currentTable, currentPlayer?.id]);

  const placeBet = async () => {
    if (!currentPlayer || !currentPlayer.currentTable || !selectedBetType) {
      setBetMessage('Please select a bet type');
      return;
    }

    const currentTable = tables.find(t => t.id === currentPlayer.currentTable);
    if (!currentTable) {
      setBetMessage('Table not found');
      return;
    }

    if (betAmount < currentTable.minBet || betAmount > currentTable.maxBet) {
      setBetMessage(`Bet must be between ₹${currentTable.minBet} and ₹${currentTable.maxBet}`);
      return;
    }

    if (betAmount > currentPlayer.balance) {
      setBetMessage('Insufficient balance');
      return;
    }

    try {
      const betData: {
        playerId: string;
        amount: number;
        type: string;
        value?: number | number[];
      } = {
        playerId: currentPlayer.id,
        amount: betAmount,
        type: selectedBetType,
      };

      if (selectedBetValue !== null) {
        betData.value = selectedBetValue;
      }

      const res = await fetch(`/api/tables/${currentPlayer.currentTable}/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(betData),
      });

      const data = await res.json();

      if (res.ok) {
        setBetMessage(`✅ Bet placed successfully! Remaining balance: ₹${data.remainingBalance.toFixed(2)}`);
        setCurrentPlayer({ ...currentPlayer, balance: data.remainingBalance });
        // Reset bet selection
        setSelectedBetType('');
        setSelectedBetValue(null);
        
        // Note: Real-time updates are now handled automatically via Ably in the API
      } else {
        setBetMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to place bet:', error);
      setBetMessage('❌ Failed to place bet');
    }
  };

  const selectPlayer = (player: Player) => {
    setCurrentPlayer(player);
  };

  const joinTable = async (tableId: string) => {
    if (!currentPlayer) return;

    try {
      const res = await fetch(`/api/tables/${tableId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      });

      if (res.ok) {
        const updatedPlayer = { ...currentPlayer, currentTable: tableId };
        setCurrentPlayer(updatedPlayer);
        loadData();
      }
    } catch (error) {
      console.error('Failed to join table:', error);
    }
  };

  const leaveTable = async () => {
    if (!currentPlayer || !currentPlayer.currentTable) return;

    try {
      const res = await fetch(`/api/tables/${currentPlayer.currentTable}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      });

      if (res.ok) {
        const updatedPlayer = { ...currentPlayer, currentTable: undefined };
        setCurrentPlayer(updatedPlayer);
        loadData();
      }
    } catch (error) {
      console.error('Failed to leave table:', error);
    }
  };

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">🎮 Player Dashboard</h1>
            <Link 
              href="/" 
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Select Your Player Profile
            </h2>
            <div className="grid gap-4">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-left transition-all transform hover:scale-105"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{player.name}</p>
                      <p className="text-blue-200 mt-1">
                        Balance: ₹{player.balance.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-4xl">👤</div>
                  </div>
                </button>
              ))}
              {players.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  No players available. Ask the admin to add players.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTable = tables.find(t => t.id === currentPlayer.currentTable);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">🎮 Player Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPlayer(null)}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition"
            >
              Change Player
            </button>
            <Link 
              href="/" 
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">{currentPlayer.name}</h2>
              <p className="text-xl text-blue-300 mt-2">
                Balance: ₹{currentPlayer.balance.toFixed(2)}
              </p>
            </div>
            {currentTable && (
              <div className="text-right">
                <p className="text-gray-400 text-sm">Currently at:</p>
                <p className="text-xl font-bold text-white">{currentTable.name}</p>
                <p className="text-sm text-purple-400">{currentTable.game}</p>
                <button
                  onClick={leaveTable}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                >
                  Leave Table
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Betting Interface */}
        {currentTable && (
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Place Your Bet</h2>
              <button
                onClick={() => setShowBettingInterface(!showBettingInterface)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                {showBettingInterface ? 'Hide Betting' : 'Show Betting'}
              </button>
            </div>

            {showBettingInterface && (
              <div className="space-y-4">
                {/* Bet Amount */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Bet Amount</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min={currentTable.minBet}
                    max={Math.min(currentTable.maxBet, currentPlayer.balance)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Min: ₹{currentTable.minBet} | Max: ₹{currentTable.maxBet}
                  </p>
                </div>

                {/* Game-specific betting options */}
                {currentTable.game === 'roulette' && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Select Your Bet</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {/* Number bets */}
                      <div className="col-span-2 md:col-span-4 mb-2">
                        <p className="text-xs text-gray-400 mb-2">Numbers (35:1)</p>
                        <div className="grid grid-cols-6 gap-1">
                          {Array.from({ length: 37 }, (_, i) => i).map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setSelectedBetType('number');
                                setSelectedBetValue(num);
                              }}
                              className={`px-2 py-1 text-xs rounded ${
                                selectedBetType === 'number' && selectedBetValue === num
                                  ? 'bg-yellow-500 text-black'
                                  : num === 0
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num)
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Outside bets */}
                      <button
                        onClick={() => { setSelectedBetType('red'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'red' ? 'bg-yellow-500 text-black' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Red (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('black'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'black' ? 'bg-yellow-500 text-black' : 'bg-gray-900 hover:bg-gray-800 text-white border border-white'
                        }`}
                      >
                        Black (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('odd'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'odd' ? 'bg-yellow-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Odd (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('even'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'even' ? 'bg-yellow-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Even (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('low'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'low' ? 'bg-yellow-500 text-black' : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        Low 1-18 (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('high'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'high' ? 'bg-yellow-500 text-black' : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        High 19-36 (1:1)
                      </button>
                    </div>
                  </div>
                )}

                {currentTable.game === 'baccarat' && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Select Your Bet</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setSelectedBetType('player'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'player' ? 'bg-yellow-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Player (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('banker'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'banker' ? 'bg-yellow-500 text-black' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Banker (0.95:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('tie'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'tie' ? 'bg-yellow-500 text-black' : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        Tie (8:1)
                      </button>
                    </div>
                  </div>
                )}

                {currentTable.game === 'three-card-poker' && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Select Your Bet</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setSelectedBetType('ante'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'ante' ? 'bg-yellow-500 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Ante Bet (1:1)
                      </button>
                      <button
                        onClick={() => { setSelectedBetType('pair-plus'); setSelectedBetValue(null); }}
                        className={`px-4 py-3 rounded-lg ${
                          selectedBetType === 'pair-plus' ? 'bg-yellow-500 text-black' : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        Pair Plus (bonus payout)
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Ante: Play against dealer. Pair Plus: Bet on your hand quality.
                    </p>
                  </div>
                )}

                {currentTable.game === 'blackjack' && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Place Your Bet</label>
                    <button
                      onClick={() => { setSelectedBetType('main'); setSelectedBetValue(null); }}
                      className={`w-full px-4 py-3 rounded-lg ${
                        selectedBetType === 'main' ? 'bg-yellow-500 text-black' : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Main Bet (Blackjack pays 2.5:1)
                    </button>
                  </div>
                )}

                {/* Place Bet Button */}
                <button
                  onClick={placeBet}
                  disabled={!selectedBetType}
                  className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition ${
                    selectedBetType
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Place Bet ₹{betAmount}
                </button>

                {/* Bet Message */}
                {betMessage && (
                  <div className={`p-3 rounded-lg ${
                    betMessage.startsWith('✅') ? 'bg-green-600/50' : 'bg-red-600/50'
                  }`}>
                    <p className="text-white text-center">{betMessage}</p>
                  </div>
                )}

                {/* Selected Bet Display */}
                {selectedBetType && (
                  <div className="p-3 bg-blue-600/30 rounded-lg">
                    <p className="text-white text-sm">
                      <strong>Selected:</strong> {selectedBetType}
                      {selectedBetValue !== null && ` - ${selectedBetValue}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Available Tables */}
        <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Available Tables</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {tables.map((table) => {
              const isCurrentTable = table.id === currentPlayer.currentTable;
              const canJoin = !currentPlayer.currentTable;
              
              return (
                <div
                  key={table.id}
                  className={`p-6 rounded-xl ${
                    isCurrentTable
                      ? 'bg-gradient-to-r from-green-600 to-green-700'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{table.name}</h3>
                      <p className="text-sm text-gray-300 mt-1">{table.game}</p>
                    </div>
                    {isCurrentTable && (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">
                        You&apos;re here
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 space-y-1 mb-4">
                    <p>Players: {table.players.length}</p>
                    <p>Min Bet: ₹{table.minBet}</p>
                    <p>Max Bet: ₹{table.maxBet}</p>
                    <p>State: <span className="capitalize">{table.state}</span></p>
                  </div>
                  {!isCurrentTable && canJoin && (
                    <button
                      onClick={() => joinTable(table.id)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Join Table
                    </button>
                  )}
                  {isCurrentTable && (
                    <Link
                      href={`/table?id=${table.id}`}
                      className="block w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-center rounded-lg transition"
                    >
                      View Table Screen
                    </Link>
                  )}
                </div>
              );
            })}
            {tables.length === 0 && (
              <p className="text-gray-400 text-center py-8 col-span-2">
                No tables available. Ask the admin to create tables.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
