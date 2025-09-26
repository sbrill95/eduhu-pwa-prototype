import { init } from '@instantdb/react';

// InstantDB client configuration
// To get your App ID, visit: https://instantdb.com/dash
const APP_ID = import.meta.env.VITE_INSTANTDB_APP_ID || '__APP_ID__';

if (APP_ID === '__APP_ID__') {
  console.warn(
    'InstantDB App ID not configured. Please:\n' +
    '1. Visit https://instantdb.com/dash to create an account and app\n' +
    '2. Copy your App ID\n' +
    '3. Set VITE_INSTANTDB_APP_ID in your .env file'
  );
}

// Initialize the InstantDB client without schema for now
// We can add a proper schema later when we define our data structures
const db = init({
  appId: APP_ID,
});

export default db;