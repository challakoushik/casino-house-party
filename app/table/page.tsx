'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Table, Player } from '@/lib/types';
import { io, Socket } from 'socket.io-client';
import { Card, CardHand } from '@/app/components/Card';
import { RouletteWheel } from '@/app/components/RouletteWheel';

function TableScreenContent() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('id');
  const [table, setTable] = useState<Table | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<any>(null);
  const [recentBets, setRecentBets] = useState<Array<{playerId: string, playerName: string, bet: any}>>([]);

  useEffect(() => {
    if (tableId) {
      loadTableData();
      const interval = setInterval(loadTableData, 2000);
      return () => clearInterval(interval);
    } else {
      // Load list of all tables when no specific table ID
      loadTablesData();
    }
  }, [tableId]);

  const loadTablesData = async () => {
    setTablesLoading(true);
    try {
      const [tablesRes, playersRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/players')
      ]);

      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }

      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Failed to load tables data:', error);
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Table screen connected to server');
      if (tableId) {
        socketInstance.emit('join-table', { tableId, playerId: 'table-screen' });
      }
    });

    socketInstance.on('countdown-update', (data: { remainingSeconds: number }) => {
      setCountdown(data.remainingSeconds);
      setGameResult(null); // Clear previous game result when new round starts
    });

    socketInstance.on('bet-placed', (data: { playerId: string, playerName: string, bet: any }) => {
      console.log('Bet placed:', data);
      setRecentBets(prev => [...prev.slice(-4), data]); // Keep last 5 bets
    });

    socketInstance.on('game-state-changed', (data: { state: string }) => {
      console.log('Game state changed:', data.state);
      if (data.state === 'waiting') {
        setCountdown(null);
        setGameResult(null);
        setRecentBets([]); // Clear bets when returning to waiting
      }
    });

    socketInstance.on('game-result', (data: any) => {
      console.log('Game result:', data);
      setCountdown(null);
      setGameResult(data);
    });

    socketInstance.on('baccarat-result', (data: any) => {
      console.log('Baccarat result:', data);
      setGameResult({ game: 'baccarat', ...data });
    });

    socketInstance.on('blackjack-deal', (data: any) => {
      console.log('Blackjack deal:', data);
      setGameResult({ game: 'blackjack-deal', ...data });
    });

    socketInstance.on('blackjack-dealer-final', (data: any) => {
      console.log('Blackjack dealer final:', data);
      setGameResult((prev: any) => ({ ...prev, dealerFinalCards: data.dealerCards }));
    });

    socketInstance.on('three-card-poker-deal', (data: any) => {
      console.log('Three card poker deal:', data);
      setGameResult({ game: 'three-card-poker', ...data });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [tableId]);

  const loadTableData = async () => {
    if (!tableId) return;

    try {
      const [playersRes] = await Promise.all([
        fetch('/api/players'),
      ]);

      if (playersRes.ok) {
        const allPlayers = await playersRes.json();
        setPlayers(allPlayers);
      }

      // Get table data
      const tablesRes = await fetch('/api/tables');
      if (tablesRes.ok) {
        const tables = await tablesRes.json();
        const foundTable = tables.find((t: Table) => t.id === tableId);
        setTable(foundTable || null);
      }
    } catch (error) {
      console.error('Failed to load table data:', error);
    }
  };

  if (!tableId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">📺 Table Screen</h1>
            <p className="text-xl text-gray-300">Select a table to display</p>
          </div>

          {tablesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4">🎰</div>
                <p className="text-xl text-white">Loading tables...</p>
              </div>
            </div>
          ) : tables.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🎰</div>
              <p className="text-xl text-gray-300 mb-6">No tables available</p>
              <Link 
                href="/" 
                className="inline-block px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                ← Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((tableItem) => {
                const tablePlayers = players.filter(p => tableItem.players.includes(p.id));
                const gameIcon = getGameIcon(tableItem.game);
                const gameColor = getGameColor(tableItem.game);
                
                return (
                  <Link
                    key={tableItem.id}
                    href={`/table?id=${tableItem.id}`}
                    className="block group"
                  >
                    <div className={`bg-gradient-to-br ${gameColor} rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">{gameIcon}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{tableItem.name}</h3>
                          <p className="text-white/80 capitalize">{tableItem.game.replace('-', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Players:</span>
                          <span className="text-white font-bold">{tablePlayers.length}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            tableItem.state === 'betting' ? 'bg-yellow-500 text-gray-900' :
                            tableItem.state === 'finished' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {tableItem.state.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="border-t border-white/20 pt-3">
                          <div className="flex justify-between text-sm">
                            <div>
                              <span className="text-white/70">Min: </span>
                              <span className="text-green-300 font-bold">₹{tableItem.minBet}</span>
                            </div>
                            <div>
                              <span className="text-white/70">Max: </span>
                              <span className="text-red-300 font-bold">₹{tableItem.maxBet}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <span className="text-white/90 group-hover:text-white transition text-sm font-medium">
                          Click to view →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link 
              href="/" 
              className="inline-block px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎰</div>
          <p className="text-xl text-white">Loading table...</p>
        </div>
      </div>
    );
  }

  const tablePlayers = players.filter(p => table.players.includes(p.id));

  const getGameIcon = (game: string) => {
    switch (game) {
      case 'roulette': return '🎡';
      case 'baccarat': return '🃏';
      case 'three-card-poker': return '🎴';
      case 'blackjack': return '🂡';
      default: return '🎰';
    }
  };

  const getGameColor = (game: string) => {
    switch (game) {
      case 'roulette': return 'from-red-600 to-red-800';
      case 'baccarat': return 'from-green-600 to-green-800';
      case 'three-card-poker': return 'from-blue-600 to-blue-800';
      case 'blackjack': return 'from-purple-600 to-purple-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Table Header */}
        <div className={`bg-gradient-to-r ${getGameColor(table.game)} rounded-2xl p-8 mb-8 shadow-2xl`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="text-7xl">{getGameIcon(table.game)}</div>
              <div>
                <h1 className="text-5xl font-bold text-white">{table.name}</h1>
                <p className="text-2xl text-white/80 mt-2 capitalize">{table.game.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${
                table.state === 'betting' ? 'bg-yellow-500 text-gray-900' :
                table.state === 'finished' ? 'bg-blue-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {table.state.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Players List */}
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Players ({tablePlayers.length})
            </h2>
            <div className="space-y-3">
              {tablePlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-700/50 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">👤</div>
                    <div>
                      <p className="text-lg font-bold text-white">{player.name}</p>
                      <p className="text-sm text-gray-400">
                        ₹{player.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {tablePlayers.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  Waiting for players to join...
                </p>
              )}
            </div>
          </div>

          {/* Main Game Display */}
          <div className="md:col-span-2 bg-gray-800/80 backdrop-blur rounded-xl p-8">
            <div className="aspect-video bg-gradient-to-br from-green-800 to-green-900 rounded-xl flex items-center justify-center border-4 border-yellow-600 relative overflow-hidden">
              <div className="text-center z-10 w-full px-4">
                {/* Countdown Display */}
                {countdown !== null && countdown > 0 && (
                  <div className="mt-4">
                    <div className="text-6xl mb-4">{getGameIcon(table.game)}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {table.game === 'roulette' && 'Roulette Wheel'}
                      {table.game === 'baccarat' && 'Baccarat Table'}
                      {table.game === 'three-card-poker' && 'Three Card Poker'}
                      {table.game === 'blackjack' && 'Blackjack Table'}
                    </h3>
                    <p className="text-2xl text-yellow-300 mb-2">Round starting in</p>
                    <div className="text-8xl font-bold text-yellow-400 animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Roulette - Show wheel with spinning animation or result */}
                {table.game === 'roulette' && countdown === null && (
                  <div>
                    {gameResult?.game === 'roulette' && gameResult?.result?.winningNumber !== undefined && (
                      <div>
                        <RouletteWheel winningNumber={gameResult.result.winningNumber} />
                        <div className="mt-4">
                          <p className="text-3xl text-yellow-300 mb-2 font-bold">Winning Number</p>
                          <p className="text-2xl text-gray-200">
                            {gameResult.result.winningNumber === 0 ? 'Green' :
                             [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(gameResult.result.winningNumber) 
                               ? 'Red' : 'Black'}
                          </p>
                        </div>
                      </div>
                    )}
                    {!gameResult && table.state === 'waiting' && (
                      <div>
                        <div className="text-8xl mb-4">🎡</div>
                        <h3 className="text-4xl font-bold text-white mb-4">Roulette Wheel</h3>
                        <p className="text-xl text-gray-300">Waiting for bets...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Baccarat - Show cards */}
                {table.game === 'baccarat' && countdown === null && (
                  <div>
                    {gameResult?.game === 'baccarat' && (
                      <div className="space-y-6">
                        <div>
                          <p className="text-3xl text-yellow-300 mb-4 font-bold">
                            {gameResult.result.winner === 'player' && '👤 Player Wins!'}
                            {gameResult.result.winner === 'banker' && '🏦 Banker Wins!'}
                            {gameResult.result.winner === 'tie' && '🤝 Tie!'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-blue-600/30 p-4 rounded-lg">
                            <p className="text-lg text-gray-200 mb-3 font-semibold">Player - Score: {gameResult.result.playerScore}</p>
                            {gameResult.result.playerCards && (
                              <CardHand cards={gameResult.result.playerCards} />
                            )}
                          </div>
                          <div className="bg-red-600/30 p-4 rounded-lg">
                            <p className="text-lg text-gray-200 mb-3 font-semibold">Banker - Score: {gameResult.result.bankerScore}</p>
                            {gameResult.result.bankerCards && (
                              <CardHand cards={gameResult.result.bankerCards} />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {!gameResult && (
                      <div>
                        <div className="text-8xl mb-4">🃏</div>
                        <h3 className="text-4xl font-bold text-white mb-4">Baccarat Table</h3>
                        <p className="text-xl text-gray-300">
                          {table.state === 'waiting' && 'Waiting for bets...'}
                          {table.state === 'betting' && 'Place your bets!'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Blackjack - Show dealer and player hands */}
                {table.game === 'blackjack' && countdown === null && (
                  <div>
                    {gameResult?.game === 'blackjack-deal' && (
                      <div className="space-y-6">
                        <p className="text-2xl text-yellow-300 font-bold">Cards Dealt!</p>
                        
                        {/* Dealer hand */}
                        <div className="bg-red-600/30 p-4 rounded-lg">
                          <p className="text-lg text-gray-200 mb-3 font-semibold">Dealer</p>
                          {gameResult.result.dealerCards && (
                            <CardHand 
                              cards={gameResult.result.dealerFinalCards || gameResult.result.dealerCards}
                            />
                          )}
                        </div>
                        
                        {/* Player hands */}
                        {gameResult.result.playerHands && (
                          <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                            {gameResult.result.playerHands.map((hand: any, idx: number) => {
                              const player = players.find(p => p.id === hand.playerId);
                              return (
                                <div key={idx} className="bg-blue-600/30 p-4 rounded-lg">
                                  <p className="text-lg text-gray-200 mb-3 font-semibold">
                                    {player?.name || 'Player'}
                                  </p>
                                  <CardHand cards={hand.cards} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {!gameResult && (
                      <div>
                        <div className="text-8xl mb-4">🂡</div>
                        <h3 className="text-4xl font-bold text-white mb-4">Blackjack Table</h3>
                        <p className="text-xl text-gray-300">
                          {table.state === 'waiting' && 'Waiting for bets...'}
                          {table.state === 'betting' && 'Place your bets!'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Three Card Poker - Show dealer and player hands */}
                {table.game === 'three-card-poker' && countdown === null && (
                  <div>
                    {gameResult?.game === 'three-card-poker' && (
                      <div className="space-y-6">
                        <p className="text-2xl text-yellow-300 font-bold">Cards Dealt!</p>
                        
                        {/* Dealer hand */}
                        {gameResult.result.dealerCards && (
                          <div className="bg-red-600/30 p-4 rounded-lg">
                            <p className="text-lg text-gray-200 mb-3 font-semibold">Dealer</p>
                            <CardHand cards={gameResult.result.dealerCards} />
                          </div>
                        )}
                        
                        {/* Player hands */}
                        {gameResult.result.playerHands && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gameResult.result.playerHands.map((hand: any, idx: number) => {
                              const player = players.find(p => p.id === hand.playerId);
                              return (
                                <div key={idx} className="bg-blue-600/30 p-4 rounded-lg">
                                  <p className="text-lg text-gray-200 mb-3 font-semibold">
                                    {player?.name || 'Player'}
                                  </p>
                                  <CardHand cards={hand.cards} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {!gameResult && (
                      <div>
                        <div className="text-8xl mb-4">🎴</div>
                        <h3 className="text-4xl font-bold text-white mb-4">Three Card Poker</h3>
                        <p className="text-xl text-gray-300">
                          {table.state === 'waiting' && 'Waiting for bets...'}
                          {table.state === 'betting' && 'Place your bets!'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Animated background effect during betting */}
              {table.state === 'betting' && countdown !== null && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20 animate-pulse"></div>
              )}
            </div>

            {/* Betting Limits */}
            <div className="mt-6 flex justify-around text-center">
              <div>
                <p className="text-sm text-gray-400">Minimum Bet</p>
                <p className="text-2xl font-bold text-green-400">₹{table.minBet}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Maximum Bet</p>
                <p className="text-2xl font-bold text-red-400">₹{table.maxBet}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bets */}
        <div className="mt-8 bg-gray-800/80 backdrop-blur rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Bets</h3>
          {recentBets.length > 0 ? (
            <div className="space-y-2">
              {recentBets.map((bet, index) => {
                const player = players.find(p => p.id === bet.playerId);
                return (
                  <div key={index} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{bet.playerName || player?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">
                        {bet.bet.type}
                        {bet.bet.value !== undefined && ` - ${bet.bet.value}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">₹{bet.bet.amount}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              {table.state === 'waiting' ? 'Waiting for bets...' : 'No bets placed yet'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TableScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎰</div>
          <p className="text-xl text-white">Loading...</p>
        </div>
      </div>
    }>
      <TableScreenContent />
    </Suspense>
  );
}
