// Redis storage layer - simplified for in-memory fallback
import { Player, Table, GameState, CasinoState } from './types';

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Initial default player and table IDs
const DEFAULT_PLAYER_ID = 'koushik-player-' + generateId();
const DEFAULT_TABLE_ID = 'roulette-table-' + generateId();

// In-memory storage as fallback (for development without Redis)
const inMemoryStore: {
  players: Map<string, Player>;
  tables: Map<string, Table>;
  gameStates: Map<string, GameState>;
  casino: CasinoState;
} = {
  players: new Map(),
  tables: new Map(),
  gameStates: new Map(),
  casino: { houseBalance: 0, totalBets: 0, totalPayout: 0 }
  // players: new Map([
  //   [DEFAULT_PLAYER_ID, {
  //     id: DEFAULT_PLAYER_ID,
  //     name: 'koushik',
  //     balance: 1000,
  //     currentTable: undefined
  //   }]
  // ]),
  // tables: new Map([
  //   [DEFAULT_TABLE_ID, {
  //     id: DEFAULT_TABLE_ID,
  //     name: 'Roulette Table 1',
  //     game: 'roulette',
  //     players: [],
  //     minBet: 10,
  //     maxBet: 1000,
  //     state: 'waiting'
  //   }]
  // ]),
  // gameStates: new Map([
  //   [DEFAULT_TABLE_ID, {
  //     tableId: DEFAULT_TABLE_ID,
  //     game: 'roulette',
  //     state: 'waiting',
  //     bets: []
  //   }]
  // ]),
  // casino: { houseBalance: 10000, totalBets: 0, totalPayout: 0 }
};

// Player operations
export async function getPlayer(id: string): Promise<Player | null> {
  return inMemoryStore.players.get(id) || null;
}

export async function getAllPlayers(): Promise<Player[]> {
  return Array.from(inMemoryStore.players.values());
}

export async function setPlayer(player: Player): Promise<void> {
  inMemoryStore.players.set(player.id, player);
}

export async function deletePlayer(id: string): Promise<void> {
  inMemoryStore.players.delete(id);
}

export async function updatePlayerBalance(id: string, amount: number): Promise<Player | null> {
  const player = inMemoryStore.players.get(id);
  if (!player) return null;
  player.balance += amount;
  inMemoryStore.players.set(id, player);
  return player;
}

// Table operations
export async function getTable(id: string): Promise<Table | null> {
  return inMemoryStore.tables.get(id) || null;
}

export async function getAllTables(): Promise<Table[]> {
  return Array.from(inMemoryStore.tables.values());
}

export async function setTable(table: Table): Promise<void> {
  inMemoryStore.tables.set(table.id, table);
}

export async function deleteTable(id: string): Promise<void> {
  inMemoryStore.tables.delete(id);
}

export async function addPlayerToTable(tableId: string, playerId: string): Promise<Table | null> {
  const table = inMemoryStore.tables.get(tableId);
  if (!table) return null;
  if (!table.players.includes(playerId)) {
    table.players.push(playerId);
  }
  inMemoryStore.tables.set(tableId, table);
  
  const player = inMemoryStore.players.get(playerId);
  if (player) {
    player.currentTable = tableId;
    inMemoryStore.players.set(playerId, player);
  }
  return table;
}

export async function removePlayerFromTable(tableId: string, playerId: string): Promise<Table | null> {
  const table = inMemoryStore.tables.get(tableId);
  if (!table) return null;
  table.players = table.players.filter(id => id !== playerId);
  inMemoryStore.tables.set(tableId, table);
  
  const player = inMemoryStore.players.get(playerId);
  if (player) {
    player.currentTable = undefined;
    inMemoryStore.players.set(playerId, player);
  }
  return table;
}

// Game state operations
export async function getGameState(tableId: string): Promise<GameState | null> {
  return inMemoryStore.gameStates.get(tableId) || null;
}

export async function setGameState(state: GameState): Promise<void> {
  inMemoryStore.gameStates.set(state.tableId, state);
}

export async function deleteGameState(tableId: string): Promise<void> {
  inMemoryStore.gameStates.delete(tableId);
}

// Casino state operations
export async function getCasinoState(): Promise<CasinoState> {
  return inMemoryStore.casino;
}

export async function updateCasinoState(update: Partial<CasinoState>): Promise<CasinoState> {
  inMemoryStore.casino = { ...inMemoryStore.casino, ...update };
  return inMemoryStore.casino;
}

export async function addToCasinoBalance(amount: number): Promise<CasinoState> {
  inMemoryStore.casino.houseBalance += amount;
  return inMemoryStore.casino;
}
