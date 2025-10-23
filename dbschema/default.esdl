module default {
  # Player type
  type Player {
    required property name -> str;
    required property balance -> float64;
    property currentTable -> str;
    
    # Unique constraint on id (which will be auto-generated)
    index on (.name);
  }

  # Table type
  type Table {
    required property name -> str;
    required property game -> str {
      constraint one_of('roulette', 'baccarat', 'three-card-poker', 'blackjack');
    };
    required property minBet -> float64;
    required property maxBet -> float64;
    required property state -> str {
      constraint one_of('waiting', 'betting', 'playing', 'finished');
    };
    
    # Multi-link to players (many-to-many relationship)
    multi link players -> Player;
    
    index on (.name);
  }

  # Bet type
  type Bet {
    required property amount -> float64;
    required property type -> str;
    required link player -> Player;
    required link table -> Table;
    
    # Additional bet data stored as JSON
    property data -> json;
  }

  # GameState type
  type GameState {
    required property game -> str;
    required property state -> str {
      constraint one_of('waiting', 'betting', 'playing', 'finished');
    };
    required link table -> Table {
      constraint exclusive;
    };
    
    # Store game-specific data as JSON
    property result -> json;
    property gameData -> json;
    
    # Multi-link to bets
    multi link bets -> Bet;
  }

  # CasinoState type (singleton)
  type CasinoState {
    required property houseBalance -> float64;
    required property totalBets -> float64;
    required property totalPayout -> float64;
    
    # Ensure only one casino state exists
    constraint exclusive on (true);
  }
}