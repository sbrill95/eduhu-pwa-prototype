#!/bin/bash
# Ultra-Minimal Restart Backend Script
# Absolute minimum functionality, maximum safety

echo ""
echo "Restarting backend..."
echo ""

# Step 1: Kill old processes (inline, no external script)
echo "Step 1: Kill old processes"
taskkill //F //IM node.exe 2>&1 | head -n 5 || echo "No node processes found"
sleep 3
echo ""

# Step 2: Start backend
echo "Step 2: Start backend"
cd C:\\Users\\steff\\Desktop\\eduhu-pwa-prototype\\teacher-assistant\\backend || exit 1

# Start in background with explicit log file
VITE_TEST_MODE=true npm start > backend-test.log 2>&1 &

echo "Backend PID: $!"
echo ""

# Step 3: Wait for startup
echo "Step 3: Wait for startup"
sleep 10
echo ""

# Step 4: Simple check
echo "Step 4: Check if running"
curl -s http://localhost:3006/api/health | head -c 200 || echo "Health check failed"
echo ""
echo ""

echo "Done. Check if backend is running at http://localhost:3006"
echo ""

exit 0
