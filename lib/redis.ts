// EdgeDB storage layer for casino app
import { Player, Table, GameState, CasinoState } from './types';
import { client, generateId } from './edgedb';

// Type helper for EdgeDB query results
type EdgeDBResult = Record<string, any>;

// Player operations
export async function getPlayer(id: string): Promise<Player | null> {
  try {
    const result = await client.querySingle(`
      SELECT Player {
        id,
        name,
        balance,
        currentTable
      }
      FILTER .id = <uuid>$id
    `, { id }) as EdgeDBResult | null;
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      balance: result.balance,
      currentTable: result.currentTable || undefined
    };
  } catch (error) {
    console.error('Error getting player:', error);
    return null;
  }
}

export async function getAllPlayers(): Promise<Player[]> {
  try {
    const result = await client.query(`
      SELECT Player {
        id,
        name,
        balance,
        currentTable
      }
    `) as EdgeDBResult[];
    
    return result.map(player => ({
      id: player.id,
      name: player.name,
      balance: player.balance,
      currentTable: player.currentTable || undefined
    }));
  } catch (error) {
    console.error('Error getting all players:', error);
    return [];
  }
}

export async function setPlayer(player: Player): Promise<void> {
  try {
    if (player.id) {
      // Update existing player
      await client.query(`
        UPDATE Player
        FILTER .id = <uuid>$id
        SET {
          name := $name,
          balance := $balance,
          currentTable := $currentTable
        }
      `, {
        id: player.id,
        name: player.name,
        balance: player.balance,
        currentTable: player.currentTable || null
      });
    } else {
      // Create new player
      await client.query(`
        INSERT Player {
          name := $name,
          balance := $balance,
          currentTable := $currentTable
        }
      `, {
        name: player.name,
        balance: player.balance,
        currentTable: player.currentTable || null
      });
    }
  } catch (error) {
    console.error('Error setting player:', error);
    throw error;
  }
}

export async function deletePlayer(id: string): Promise<void> {
  try {
    await client.query(`
      DELETE Player
      FILTER .id = <uuid>$id
    `, { id });
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
}

export async function updatePlayerBalance(id: string, amount: number): Promise<Player | null> {
  try {
    await client.query(`
      UPDATE Player
      FILTER .id = <uuid>$id
      SET {
        balance := .balance + <float64>$amount
      }
    `, { id, amount });
    
    return await getPlayer(id);
  } catch (error) {
    console.error('Error updating player balance:', error);
    return null;
  }
}

// Table operations
export async function getTable(id: string): Promise<Table | null> {
  try {
    const result = await client.querySingle(`
      SELECT Table {
        id,
        name,
        game,
        minBet,
        maxBet,
        state,
        players: {
          id
        }
      }
      FILTER .id = <uuid>$id
    `, { id }) as EdgeDBResult | null;
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      game: result.game,
      minBet: result.minBet,
      maxBet: result.maxBet,
      state: result.state,
      players: (result.players as EdgeDBResult[]).map(p => p.id)
    };
  } catch (error) {
    console.error('Error getting table:', error);
    return null;
  }
}

export async function getAllTables(): Promise<Table[]> {
  try {
    const result = await client.query(`
      SELECT Table {
        id,
        name,
        game,
        minBet,
        maxBet,
        state,
        players: {
          id
        }
      }
    `) as EdgeDBResult[];
    
    return result.map(table => ({
      id: table.id,
      name: table.name,
      game: table.game,
      minBet: table.minBet,
      maxBet: table.maxBet,
      state: table.state,
      players: (table.players as EdgeDBResult[]).map(p => p.id)
    }));
  } catch (error) {
    console.error('Error getting all tables:', error);
    return [];
  }
}

export async function setTable(table: Table): Promise<void> {
  try {
    if (table.id) {
      // Update existing table
      await client.query(`
        UPDATE Table
        FILTER .id = <uuid>$id
        SET {
          name := $name,
          game := $game,
          minBet := $minBet,
          maxBet := $maxBet,
          state := $state
        }
      `, {
        id: table.id,
        name: table.name,
        game: table.game,
        minBet: table.minBet,
        maxBet: table.maxBet,
        state: table.state
      });
    } else {
      // Create new table
      await client.query(`
        INSERT Table {
          name := $name,
          game := $game,
          minBet := $minBet,
          maxBet := $maxBet,
          state := $state
        }
      `, {
        name: table.name,
        game: table.game,
        minBet: table.minBet,
        maxBet: table.maxBet,
        state: table.state
      });
    }
  } catch (error) {
    console.error('Error setting table:', error);
    throw error;
  }
}

export async function deleteTable(id: string): Promise<void> {
  try {
    await client.query(`
      DELETE Table
      FILTER .id = <uuid>$id
    `, { id });
  } catch (error) {
    console.error('Error deleting table:', error);
    throw error;
  }
}

export async function addPlayerToTable(tableId: string, playerId: string): Promise<Table | null> {
  try {
    // Add player to table
    await client.query(`
      UPDATE Table
      FILTER .id = <uuid>$tableId
      SET {
        players += (SELECT Player FILTER .id = <uuid>$playerId)
      }
    `, { tableId, playerId });
    
    // Update player's current table
    await client.query(`
      UPDATE Player
      FILTER .id = <uuid>$playerId
      SET {
        currentTable := $tableId
      }
    `, { playerId, tableId });
    
    return await getTable(tableId);
  } catch (error) {
    console.error('Error adding player to table:', error);
    return null;
  }
}

export async function removePlayerFromTable(tableId: string, playerId: string): Promise<Table | null> {
  try {
    // Remove player from table
    await client.query(`
      UPDATE Table
      FILTER .id = <uuid>$tableId
      SET {
        players -= (SELECT Player FILTER .id = <uuid>$playerId)
      }
    `, { tableId, playerId });
    
    // Clear player's current table
    await client.query(`
      UPDATE Player
      FILTER .id = <uuid>$playerId
      SET {
        currentTable := <str>{}
      }
    `, { playerId });
    
    return await getTable(tableId);
  } catch (error) {
    console.error('Error removing player from table:', error);
    return null;
  }
}

// Game state operations
export async function getGameState(tableId: string): Promise<GameState | null> {
  try {
    const result = await client.querySingle(`
      SELECT GameState {
        table: {
          id
        },
        game,
        state,
        result,
        gameData,
        bets: {
          id,
          amount,
          type,
          player: {
            id
          },
          data
        }
      }
      FILTER .table.id = <uuid>$tableId
    `, { tableId }) as EdgeDBResult | null;
    
    if (!result) return null;
    
    return {
      tableId: (result.table as EdgeDBResult).id,
      game: result.game,
      state: result.state,
      result: result.result,
      bets: (result.bets as EdgeDBResult[]).map(bet => ({
        playerId: (bet.player as EdgeDBResult).id,
        amount: bet.amount,
        type: bet.type,
        tableId: (result.table as EdgeDBResult).id,
        ...bet.data
      }))
    };
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
}

export async function setGameState(state: GameState): Promise<void> {
  try {
    // First, check if a game state exists for this table
    const existing = await client.querySingle(`
      SELECT GameState {
        id
      }
      FILTER .table.id = <uuid>$tableId
    `, { tableId: state.tableId });
    
    if (existing) {
      // Update existing game state
      await client.query(`
        UPDATE GameState
        FILTER .table.id = <uuid>$tableId
        SET {
          game := $game,
          state := $state,
          result := <json>$result,
          gameData := <json>$gameData
        }
      `, {
        tableId: state.tableId,
        game: state.game,
        state: state.state,
        result: state.result ? JSON.stringify(state.result) : null,
        gameData: JSON.stringify({})
      });
    } else {
      // Create new game state
      await client.query(`
        INSERT GameState {
          table := (SELECT Table FILTER .id = <uuid>$tableId),
          game := $game,
          state := $state,
          result := <json>$result,
          gameData := <json>$gameData
        }
      `, {
        tableId: state.tableId,
        game: state.game,
        state: state.state,
        result: state.result ? JSON.stringify(state.result) : null,
        gameData: JSON.stringify({})
      });
    }
  } catch (error) {
    console.error('Error setting game state:', error);
    throw error;
  }
}

export async function deleteGameState(tableId: string): Promise<void> {
  try {
    await client.query(`
      DELETE GameState
      FILTER .table.id = <uuid>$tableId
    `, { tableId });
  } catch (error) {
    console.error('Error deleting game state:', error);
    throw error;
  }
}

// Casino state operations
export async function getCasinoState(): Promise<CasinoState> {
  try {
    const result = await client.querySingle(`
      SELECT CasinoState {
        houseBalance,
        totalBets,
        totalPayout
      }
      LIMIT 1
    `) as EdgeDBResult | null;
    
    if (result) {
      return {
        houseBalance: result.houseBalance,
        totalBets: result.totalBets,
        totalPayout: result.totalPayout
      };
    }
    
    // If no casino state exists, create one with default values
    const defaultState = { houseBalance: 0, totalBets: 0, totalPayout: 0 };
    await client.query(`
      INSERT CasinoState {
        houseBalance := 0,
        totalBets := 0,
        totalPayout := 0
      }
    `);
    return defaultState;
  } catch (error) {
    console.error('Error getting casino state:', error);
    return { houseBalance: 0, totalBets: 0, totalPayout: 0 };
  }
}

export async function updateCasinoState(update: Partial<CasinoState>): Promise<CasinoState> {
  try {
    // First, ensure a casino state exists
    await getCasinoState();
    
    // Update the casino state
    await client.query(`
      UPDATE CasinoState
      SET {
        houseBalance := $houseBalance ?? .houseBalance,
        totalBets := $totalBets ?? .totalBets,
        totalPayout := $totalPayout ?? .totalPayout
      }
    `, {
      houseBalance: update.houseBalance,
      totalBets: update.totalBets,
      totalPayout: update.totalPayout
    });
    
    return await getCasinoState();
  } catch (error) {
    console.error('Error updating casino state:', error);
    throw error;
  }
}

export async function addToCasinoBalance(amount: number): Promise<CasinoState> {
  try {
    // First, ensure a casino state exists
    await getCasinoState();
    
    await client.query(`
      UPDATE CasinoState
      SET {
        houseBalance := .houseBalance + <float64>$amount
      }
    `, { amount });
    
    return await getCasinoState();
  } catch (error) {
    console.error('Error adding to casino balance:', error);
    throw error;
  }
}
