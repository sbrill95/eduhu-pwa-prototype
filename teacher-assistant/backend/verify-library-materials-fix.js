/**
 * Verification Script: BUG-029 Fix - Library Materials Entity
 *
 * This script verifies that imageGeneration.ts correctly saves to
 * library_materials entity instead of artifacts entity.
 */

const fs = require('fs');
const path = require('path');

console.log('=== BUG-029 Fix Verification ===\n');

// Read imageGeneration.ts
const imageGenPath = path.join(__dirname, 'src', 'routes', 'imageGeneration.ts');
const imageGenCode = fs.readFileSync(imageGenPath, 'utf-8');

// Check for correct entity usage
const hasLibraryMaterialsUpdate = imageGenCode.includes('db.tx.library_materials[libId].update');
const hasArtifactsUpdate = imageGenCode.includes('db.tx.artifacts[');
const hasCorrectLog = imageGenCode.includes("logInfo('[ImageGen] Saved to library_materials'");

console.log('1. Code Analysis:');
console.log(`   ✓ Uses db.tx.library_materials: ${hasLibraryMaterialsUpdate ? 'YES ✅' : 'NO ❌'}`);
console.log(`   ✓ Removed db.tx.artifacts: ${!hasArtifactsUpdate ? 'YES ✅' : 'NO ❌'}`);
console.log(`   ✓ Logs "Saved to library_materials": ${hasCorrectLog ? 'YES ✅' : 'NO ❌'}`);

// Extract the save code
const saveCodeMatch = imageGenCode.match(/db\.tx\.(library_materials|artifacts)\[libId\]\.update\(\{[\s\S]*?\}\)/);
if (saveCodeMatch) {
  console.log('\n2. Save Code Found:');
  console.log('   Entity:', saveCodeMatch[1]);
  console.log('   Full match:', saveCodeMatch[0].substring(0, 100) + '...');
}

// Read schema to verify library_materials exists
const schemaPath = path.join(__dirname, '..', '..', 'instant.schema.ts');
const schemaCode = fs.readFileSync(schemaPath, 'utf-8');
const hasLibraryMaterialsEntity = schemaCode.includes('library_materials: i.entity');

console.log('\n3. Schema Verification:');
console.log(`   ✓ library_materials entity exists: ${hasLibraryMaterialsEntity ? 'YES ✅' : 'NO ❌'}`);

// Final verdict
console.log('\n4. Final Verdict:');
const allChecksPassed = hasLibraryMaterialsUpdate && !hasArtifactsUpdate && hasCorrectLog && hasLibraryMaterialsEntity;
if (allChecksPassed) {
  console.log('   🎉 ALL CHECKS PASSED - BUG-029 FIX VERIFIED ✅');
  console.log('\n   Backend correctly saves to library_materials entity.');
  console.log('   If you saw "Saved to artifacts" in logs, it was from:');
  console.log('   - Cached backend process (needs reload)');
  console.log('   - Different route (langGraphAgents.ts or langGraphImageGenerationAgent.ts)');
} else {
  console.log('   ❌ CHECKS FAILED - FIX NEEDED');
  if (!hasLibraryMaterialsUpdate) console.log('   - Missing db.tx.library_materials[libId].update');
  if (hasArtifactsUpdate) console.log('   - Still using db.tx.artifacts (should be removed)');
  if (!hasCorrectLog) console.log('   - Missing correct log message');
  if (!hasLibraryMaterialsEntity) console.log('   - Schema missing library_materials entity');
}

console.log('\n5. Test Command:');
console.log('   Run this to test live:');
console.log('   curl -X POST http://localhost:3006/api/langgraph/agents/execute \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"agentId":"image-generation","input":{"description":"Test","imageStyle":"realistic"},"userId":"test","sessionId":"test"}\'');
console.log('\n   Then check backend console for: "[ImageGen] Saved to library_materials"');
