#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { createClient } = require('edgedb');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Starting EdgeDB migration...');
  
  try {
    // Create EdgeDB client
    const client = createClient({
      instanceName: process.env.EDGEDB_INSTANCE,
      secretKey: process.env.EDGEDB_SECRET_KEY,
    });

    console.log('Connected to EdgeDB instance');

    // Check current database state
    try {
      const result = await client.query(`
        SELECT schema::ObjectType {
          name
        } FILTER .name LIKE 'default::%';
      `);
      console.log('Current types in database:', result.map(t => t.name));
    } catch (error) {
      console.log('Could not query existing types (expected for new databases)');
    }

    // Apply schema step by step using EdgeDB DDL
    console.log('Creating Player type...');
    try {
      await client.execute(`
        CREATE TYPE default::Player {
          CREATE REQUIRED PROPERTY name -> std::str;
          CREATE REQUIRED PROPERTY balance -> std::float64;
          CREATE PROPERTY currentTable -> std::str;
          CREATE INDEX ON (.name);
        };
      `);
      console.log('✅ Player type created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Player type already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('Creating Table type...');
    try {
      await client.execute(`
        CREATE TYPE default::Table {
          CREATE REQUIRED PROPERTY name -> std::str;
          CREATE REQUIRED PROPERTY game -> std::str {
            CREATE CONSTRAINT std::one_of('roulette', 'baccarat', 'three-card-poker', 'blackjack');
          };
          CREATE REQUIRED PROPERTY minBet -> std::float64;
          CREATE REQUIRED PROPERTY maxBet -> std::float64;
          CREATE REQUIRED PROPERTY state -> std::str {
            CREATE CONSTRAINT std::one_of('waiting', 'betting', 'playing', 'finished');
          };
          CREATE MULTI LINK players -> default::Player;
          CREATE INDEX ON (.name);
        };
      `);
      console.log('✅ Table type created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Table type already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('Creating Bet type...');
    try {
      await client.execute(`
        CREATE TYPE default::Bet {
          CREATE REQUIRED PROPERTY amount -> std::float64;
          CREATE REQUIRED PROPERTY type -> std::str;
          CREATE REQUIRED LINK player -> default::Player;
          CREATE REQUIRED LINK table -> default::Table;
          CREATE PROPERTY data -> std::json;
        };
      `);
      console.log('✅ Bet type created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Bet type already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('Creating GameState type...');
    try {
      await client.execute(`
        CREATE TYPE default::GameState {
          CREATE REQUIRED PROPERTY game -> std::str;
          CREATE REQUIRED PROPERTY state -> std::str {
            CREATE CONSTRAINT std::one_of('waiting', 'betting', 'playing', 'finished');
          };
          CREATE REQUIRED LINK table -> default::Table {
            CREATE CONSTRAINT std::exclusive;
          };
          CREATE PROPERTY result -> std::json;
          CREATE PROPERTY gameData -> std::json;
          CREATE MULTI LINK bets -> default::Bet;
        };
      `);
      console.log('✅ GameState type created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('GameState type already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('Creating CasinoState type...');
    try {
      await client.execute(`
        CREATE TYPE default::CasinoState {
          CREATE REQUIRED PROPERTY houseBalance -> std::float64;
          CREATE REQUIRED PROPERTY totalBets -> std::float64;
          CREATE REQUIRED PROPERTY totalPayout -> std::float64;
          CREATE CONSTRAINT std::exclusive ON (true);
        };
      `);
      console.log('✅ CasinoState type created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('CasinoState type already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Verify the migration by checking if Table type exists
    const tableCheck = await client.query(`
      SELECT schema::ObjectType {
        name
      } FILTER .name = 'default::Table';
    `);
    
    if (tableCheck.length > 0) {
      console.log('✅ Table type exists in database');
      
      // Test creating a table to make sure everything works
      try {
        const testTable = await client.query(`
          INSERT Table {
            name := 'test-table',
            game := 'roulette',
            minBet := 10.0,
            maxBet := 1000.0,
            state := 'waiting'
          };
        `);
        console.log('✅ Successfully created test table');
        
        // Clean up test table
        await client.query(`DELETE Table FILTER .name = 'test-table';`);
        console.log('✅ Test table cleaned up');
        
      } catch (testError) {
        console.error('❌ Error testing table creation:', testError.message);
      }
    } else {
      console.error('❌ Table type still not found after migration');
    }

    // List all types to confirm
    const allTypes = await client.query(`
      SELECT schema::ObjectType {
        name
      } FILTER .name LIKE 'default::%'
      ORDER BY .name;
    `);
    
    console.log('\n📊 All types in database:');
    allTypes.forEach(type => {
      console.log(`  - ${type.name}`);
    });

    await client.close();
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };