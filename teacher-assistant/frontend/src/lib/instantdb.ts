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

// Check if running in test mode
const isTestMode = (window as any).__VITE_TEST_MODE__ === true;

// Create mock InstantDB client for test mode
function createMockInstantClient() {
  const mockData = {
    sessions: [],
    messages: [],
    materials: [],
    library_materials: []
  };

  return {
    useQuery: (query: any) => {
      // Return empty data for test mode
      return {
        data: mockData,
        isLoading: false,
        error: null
      };
    },
    transact: async (mutations: any[]) => {
      // Mock transaction - log but don't execute
      if (import.meta.env.DEV) {
        console.log('[TEST MODE] InstantDB transaction bypassed:', mutations.length, 'mutations');
      }
      return Promise.resolve({
        status: 200,
        data: {
          result: 'mocked',
          mutations: mutations.length
        }
      });
    },
    auth: {
      signInWithIdToken: async () => {
        if (import.meta.env.DEV) {
          console.log('[TEST MODE] InstantDB auth bypassed');
        }
        return Promise.resolve({ user: { id: 'test-user', email: 'test@example.com' } });
      },
      signOut: async () => {
        if (import.meta.env.DEV) {
          console.log('[TEST MODE] InstantDB signOut bypassed');
        }
        return Promise.resolve();
      },
      user: null
    }
  };
}

// Initialize the InstantDB client
// In test mode, use mock client to prevent 400 errors from mutations
const db = isTestMode
  ? createMockInstantClient() as any
  : init({
      appId: APP_ID,
    });

if (isTestMode && import.meta.env.DEV) {
  console.log('[TEST MODE] Using mock InstantDB client');
}

export default db;