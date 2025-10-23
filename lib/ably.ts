import * as Ably from 'ably';

// Client-side Ably connection
let ablyClient: Ably.Realtime | null = null;

let ably_key = 'zZ3AJw.0SfSlw:eyUEtxT8OXFelgOU83WVX2WpA6G13ILxhn6hQP48gDE';

// Check if Ably is properly configured
const isAblyConfigured = () => {
  const apiKey = ably_key;
  return apiKey && apiKey !== 'your-ably-api-key-here' && apiKey.includes(':');
};

export function getAblyClient(): Ably.Realtime {
  if (!isAblyConfigured()) {
    throw new Error(`
🚫 Ably API key is not properly configured!

Please follow these steps:
1. Sign up at https://ably.com (free account)
2. Create a new app and get your API key
3. Set NEXT_PUBLIC_ABLY_API_KEY in your .env.local file

Your API key should look like: appId.keyName:keySecret
Example: xVLyHw.DEadBf:abcdefghijklmnopqrstuvwxyz123456789

See ABLY_SETUP.md for detailed instructions.
    `);
  }

  if (!ablyClient) {
    const apiKey = ably_key!;
    
    ablyClient = new Ably.Realtime({
      key: apiKey,
      clientId: `casino-client-${Math.random().toString(36).substr(2, 9)}`,
      // Add some additional options for better reliability
      disconnectedRetryTimeout: 15000,
      suspendedRetryTimeout: 30000,
    });
    
    ablyClient.connection.on('connected', () => {
      console.log('Connected to Ably!');
    });
    
    ablyClient.connection.on('failed', (stateChange) => {
      console.error('Failed to connect to Ably:', stateChange.reason);
    });
    
    ablyClient.connection.on('disconnected', () => {
      console.log('Disconnected from Ably');
    });
  }
  
  return ablyClient;
}

// Server-side Ably REST client for publishing messages
export function getAblyRestClient(): Ably.Rest {
  if (!isAblyConfigured()) {
    throw new Error(`
🚫 Ably API key is not properly configured!

Please follow these steps:
1. Sign up at https://ably.com (free account)
2. Create a new app and get your API key
3. Set NEXT_PUBLIC_ABLY_API_KEY in your .env.local file

Your API key should look like: appId.keyName:keySecret
Example: xVLyHw.DEadBf:abcdefghijklmnopqrstuvwxyz123456789

See ABLY_SETUP.md for detailed instructions.
    `);
  }

  const apiKey = ably_key!;
  
  return new Ably.Rest({
    key: apiKey,
  });
}

// Channel name utilities
export const getTableChannel = (tableId: string) => `table-${tableId}`;
export const getGlobalChannel = () => 'global';

// Event types
export const AblyEvents = {
  // Table events
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  BET_PLACED: 'bet-placed',
  COUNTDOWN_UPDATE: 'countdown-update',
  GAME_STATE_CHANGED: 'game-state-changed',
  GAME_RESULT: 'game-result',
  
  // Game-specific events
  BACCARAT_RESULT: 'baccarat-result',
  BLACKJACK_DEAL: 'blackjack-deal',
  BLACKJACK_DEALER_FINAL: 'blackjack-dealer-final',
  THREE_CARD_POKER_DEAL: 'three-card-poker-deal',
  
  // Global events
  TABLE_DELETED: 'table-deleted',
} as const;

// Utility function to publish messages from server-side
export async function publishToChannel(channelName: string, eventName: string, data: any) {
  try {
    const restClient = getAblyRestClient();
    const channel = restClient.channels.get(channelName);
    await channel.publish(eventName, data);
    console.log(`Published ${eventName} to ${channelName}`);
  } catch (error) {
    console.error('Failed to publish message to Ably:', error);
    // Don't throw the error to prevent breaking the API response
    // Real-time updates will fail but the core functionality continues
  }
}

// Utility function to subscribe to channel events on client-side
export function subscribeToChannel(
  channelName: string, 
  eventName: string, 
  callback: (message: Ably.Message) => void
) {
  const client = getAblyClient();
  const channel = client.channels.get(channelName);
  return channel.subscribe(eventName, callback);
}

// Utility function to unsubscribe from channel events
export function unsubscribeFromChannel(
  channelName: string, 
  eventName?: string, 
  callback?: (message: Ably.Message) => void
) {
  const client = getAblyClient();
  const channel = client.channels.get(channelName);
  if (eventName && callback) {
    channel.unsubscribe(eventName, callback);
  } else if (eventName) {
    channel.unsubscribe(eventName);
  } else {
    channel.unsubscribe();
  }
}

// Clean up Ably connection
export function closeAblyConnection() {
  if (ablyClient) {
    ablyClient.close();
    ablyClient = null;
  }
}