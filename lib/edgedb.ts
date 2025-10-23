import { createClient } from 'edgedb';

// EdgeDB client configuration for Vercel edge functions
export const client = createClient({
  instanceName: process.env.EDGEDB_INSTANCE,
  secretKey: process.env.EDGEDB_SECRET_KEY,
});

// Helper function to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}