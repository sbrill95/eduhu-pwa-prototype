import { init } from '@instantdb/react';
import { useState, useEffect } from 'react';

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

// Function to get test images from window (injected by Playwright tests)
function getTestImages() {
  const images = (window as any).__TEST_IMAGES__ || [];
  console.log('🔍 [MOCK DEBUG] getTestImages() called:', {
    windowTestImages: images.length,
    firstImage: images[0] ? {
      id: images[0].id,
      title: images[0].title,
      user_id: images[0].user_id
    } : null
  });
  return images;
}

// Function to get current mock data (with dynamic test images)
function getMockDataStore() {
  const testImages = getTestImages();
  console.log('🔍 [MOCK DEBUG] getMockDataStore() called:', {
    imageCount: testImages.length,
    images: testImages.map((img: any) => ({
      id: img.id,
      title: img.title,
      user_id: img.user_id
    }))
  });
  return {
    chat_sessions: [],
    messages: [],
    library_materials: testImages, // Dynamically fetch from window
    teacher_profiles: [
      {
        id: 'test-teacher-profile-001',
        user_id: '38eb3d27-dd97-4ed4-9e80-08fafe18115f', // FIXED: Match TEST_USER.id
        subjects: JSON.stringify(['Mathematik', 'Informatik']),
        grades: JSON.stringify(['5', '6', '7']),
        school_type: 'Gymnasium',
        teaching_methods: JSON.stringify(['Projektbasiert', 'Digitale Medien']),
        topics: JSON.stringify(['Programmierung', 'Algebra']),
        challenges: JSON.stringify([]),
        created_at: Date.now(),
        last_updated: Date.now(),
        conversation_count: 0,
        extraction_history: JSON.stringify([])
      }
    ]
  };
}

// Create a REACT HOOK function for mock useQuery
// This MUST be a proper React hook that can be called from components
function useMockQuery(query: any) {
  //  CRITICAL: This is a React hook, so it must use useState/useEffect
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Serialize query to string to avoid infinite re-renders
  // (query object is recreated on every render)
  const queryKey = query ? JSON.stringify(query) : 'null';

  useEffect(() => {
    // Compute data when query changes OR when component mounts
    try {
      console.log('🔍 [MOCK DEBUG] useMockQuery called with query:', query);

      // Get fresh mock data (includes dynamically updated test images)
      const mockDataStore = getMockDataStore();
      console.log('🔍 [MOCK DEBUG] mockDataStore:', {
        library_materials_count: mockDataStore.library_materials?.length || 0
      });

      if (!query) {
        // No query - return all mock data
        console.log('🔍 [MOCK DEBUG] No query - returning all mock data');
        setData(mockDataStore);
        setIsLoading(false);
        return;
      }

      let filteredData: any = {};

      // Process each entity in the query
      Object.keys(query).forEach(entity => {
        const entityQuery = query[entity];
        const entityData = mockDataStore[entity as keyof typeof mockDataStore] || [];

        console.log(`🔍 [MOCK DEBUG] Processing entity: ${entity}`, {
          hasWhere: !!entityQuery?.$?.where,
          whereClause: entityQuery?.$?.where,
          inputCount: entityData.length
        });

        if (entityQuery?.$ && entityQuery.$.where) {
          const where = entityQuery.$.where;

          // Apply WHERE filtering
          filteredData[entity] = entityData.filter((item: any) => {
            const matches = Object.keys(where).every(key => {
              const itemValue = item[key];
              const whereValue = where[key];
              const match = itemValue === whereValue;

              if (!match) {
                console.log(`🔍 [MOCK DEBUG] WHERE mismatch for ${entity}:`, {
                  key,
                  itemValue,
                  whereValue,
                  itemId: item.id
                });
              }

              return match;
            });
            return matches;
          });

          console.log(`🔍 [MOCK DEBUG] After WHERE filter:`, {
            entity,
            inputCount: entityData.length,
            outputCount: filteredData[entity].length,
            whereClause: where
          });
        } else {
          // No WHERE clause - return all data for this entity
          filteredData[entity] = entityData;
          console.log(`🔍 [MOCK DEBUG] No WHERE clause - returning all ${entity}:`, {
            count: entityData.length
          });
        }
      });

      setData(filteredData);
      setIsLoading(false);
    } catch (err) {
      console.error('🔍 [MOCK DEBUG] useMockQuery error:', err);
      setError(err);
      setIsLoading(false);
    }
  }, [queryKey]); // Use serialized string to avoid infinite re-renders

  return { data, isLoading, error };
}

// Create mock InstantDB client for test mode
function createMockInstantClient() {
  return {
    useQuery: useMockQuery, // Use the proper React hook function

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
    },
    // BUG-001 FIX: Add tx namespace for ALL entities (not just teacher_profiles)
    // This Proxy dynamically handles ANY entity (chat_sessions, messages, teacher_profiles, etc.)
    tx: new Proxy({}, {
      get: (target, entityName) => {
        // Return a Proxy for the entity (e.g., tx.chat_sessions, tx.messages)
        return new Proxy({}, {
          get: (entityTarget, entityId) => {
            // Return an object with update() method for the specific entity ID
            return {
              update: (data: any) => {
                if (import.meta.env.DEV) {
                  console.log(`[TEST MODE] tx.${String(entityName)}[${String(entityId)}].update() bypassed:`, Object.keys(data));
                }
                return {
                  entityName: String(entityName),
                  entityId: String(entityId),
                  action: 'update',
                  data
                };
              }
            };
          }
        });
      }
    })
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