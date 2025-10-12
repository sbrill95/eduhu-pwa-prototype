/**
 * Debug script to understand InstantDB admin API
 */

async function debugInstantDB() {
  console.log('\n=== DEBUG InstantDB Admin API ===\n');

  // Import the service
  const { getInstantDB, isInstantDBAvailable } = await import('./dist/services/instantdbService.js');

  console.log('1. isInstantDBAvailable():', isInstantDBAvailable());

  if (isInstantDBAvailable()) {
    const db = getInstantDB();

    console.log('2. db type:', typeof db);
    console.log('3. db keys:', Object.keys(db).slice(0, 20));
    console.log('4. db.id exists?:', typeof db.id);
    console.log('5. db.id is function?:', typeof db.id === 'function');

    if (typeof db.id === 'function') {
      console.log('6. db.id() result:', db.id());
    } else {
      console.log('6. ❌ db.id is NOT a function!');
      console.log('   Searching for ID generation methods...');

      // Search for potential UUID/ID methods
      const allKeys = Object.keys(db);
      const potentialIdMethods = allKeys.filter(key =>
        key.toLowerCase().includes('id') ||
        key.toLowerCase().includes('uuid') ||
        key.toLowerCase().includes('generate')
      );

      console.log('   Potential ID methods found:', potentialIdMethods);

      // Check nested objects
      for (const key of allKeys.slice(0, 10)) {
        const value = db[key];
        if (value && typeof value === 'object') {
          const subKeys = Object.keys(value);
          if (subKeys.includes('id')) {
            console.log(`   Found .id in db.${key}:`, typeof value.id);
          }
        }
      }
    }
  } else {
    console.log('❌ InstantDB not available');
  }
}

debugInstantDB().catch(err => {
  console.error('Debug failed:', err);
});
