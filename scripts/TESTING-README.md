# Bash Script Crash Testing Suite

This directory contains tools to diagnose and fix bash script crashes on Windows/Git Bash.

---

## 🚨 The Problem

The `restart-backend.sh` script crashes Claude Code on Windows. Even simplified versions crash. This suite identifies the exact crash point.

---

## 🧪 Testing Tools

### 1. Modular Component Tests

Six isolated tests that check individual bash features:

```bash
# Run all tests sequentially
bash scripts/test-runner.sh
```

**Individual tests**:
- `test-01-minimal.sh` - Basic echo (should always work)
- `test-02-variables.sh` - Variable assignment, command substitution
- `test-03-paths.sh` - Path operations, dirname, directory checks
- `test-04-kill.sh` - Calls kill-backend.sh (external script)
- `test-05-curl.sh` - HTTP requests with curl
- `test-06-background.sh` - Background process with `&` and PID capture

**How to use**:
1. Run `bash scripts/test-runner.sh`
2. Watch which test is running when Claude Code crashes
3. That test contains the problematic pattern
4. Check `docs/troubleshooting/windows-bash-crash-patterns.md` for alternatives

---

### 2. Ultra-Minimal Restart Script

Absolute simplest restart script - hardcoded paths, no fancy features:

```bash
bash scripts/restart-backend-ultra-minimal.sh
```

**What it does**:
- Kills node.exe processes (inline, no external script)
- Starts backend with hardcoded path
- Waits 10 seconds (no smart checking)
- Tests health endpoint once

**What it avoids**:
- No command substitution `$()`
- No external scripts
- No loops
- No variable expansion in redirects
- No PowerShell
- No tasklist PID checking

**If this crashes**, the problem is extremely basic (e.g., `&` operator, `cd` command, or `npm start`).

---

### 3. Original Scripts (For Comparison)

- `restart-backend.sh` - Full-featured (crashes)
- `restart-backend-safe.sh` - Simplified (also crashes)
- `kill-backend.sh` - Might be causing issues

---

## 🔍 Diagnosis Strategy

### Step 1: Run Component Tests
```bash
bash scripts/test-runner.sh
```

**What to watch for**:
- Does Claude Code crash during tests?
- If YES: Which test was running? (That's your crash point)
- If NO: All components work, issue is in script composition

### Step 2: Try Ultra-Minimal Script
```bash
bash scripts/restart-backend-ultra-minimal.sh
```

**Outcomes**:
- ✅ **Works**: Original scripts are too complex, use simpler patterns
- ❌ **Crashes**: Even basic bash features crash, deeper environment issue

### Step 3: Manual Fallback (If All Scripts Crash)
```bash
# Step 1: Kill old processes
taskkill //F //IM node.exe

# Step 2: Wait for port to free
timeout /t 3

# Step 3: Start backend manually
cd teacher-assistant/backend
set VITE_TEST_MODE=true
npm start
```

---

## 📊 Expected Results

### Scenario A: Component Test Crashes at Test 02-06
→ **Specific bash feature is the issue**
→ Check crash patterns doc for that feature
→ Build custom restart script avoiding that feature

### Scenario B: All Component Tests Pass
→ **Script composition/complexity is the issue**
→ Scripts individually work, but together they crash
→ Use ultra-minimal script or manual steps

### Scenario C: Ultra-Minimal Script Works
→ **Original scripts are too complex**
→ Use ultra-minimal as template
→ Gradually add features from passing tests

### Scenario D: Everything Crashes (Even Test 01)
→ **Environment issue (Git Bash, Claude Code, or system)**
→ Use manual steps only
→ Report issue to Claude Code team

---

## 🛠️ Building a Safe Restart Script

Once you know which components work:

### Option 1: Use Passing Tests as Building Blocks
```bash
# If tests 01-05 pass but 06 crashes:
# → Build script without background process checks
# → Use simple sleep instead of PID monitoring

bash scripts/test-01-minimal.sh  # ✅ Works
bash scripts/test-02-variables.sh  # ✅ Works
bash scripts/test-06-background.sh  # ❌ Crashes

# Conclusion: Avoid background process PID capture
```

### Option 2: Simplify Until It Works
1. Start with ultra-minimal
2. Add one feature at a time
3. Test after each addition
4. When it crashes, previous version is your safe script

### Option 3: Avoid Bash Entirely
```cmd
REM Use Windows batch file instead
@echo off
echo Restarting backend...
taskkill /F /IM node.exe
timeout /t 3
cd teacher-assistant\backend
set VITE_TEST_MODE=true
start npm start
```

---

## 📚 Documentation

### Primary Docs:
- `docs/troubleshooting/windows-bash-crash-patterns.md` - Crash patterns and safe alternatives
- `docs/troubleshooting/restart-backend-crash-analysis.md` - Original analysis

### Test Results:
- Update crash patterns doc with your test results
- Document which tests pass/fail
- Add safe script that works for your environment

---

## 🔗 Quick Reference

```bash
# Run all tests
bash scripts/test-runner.sh

# Try ultra-minimal restart
bash scripts/restart-backend-ultra-minimal.sh

# Manual restart (if all scripts crash)
taskkill //F //IM node.exe
cd teacher-assistant/backend
VITE_TEST_MODE=true npm start &

# Check backend health
curl http://localhost:3006/api/health
```

---

## ✅ Success Criteria

You've successfully diagnosed the issue when:

1. ✅ You know which bash features crash (from component tests)
2. ✅ You have a working restart script (ultra-minimal or custom)
3. ✅ Backend starts reliably without Claude Code crashing
4. ✅ Crash patterns are documented for future reference

---

## 🚀 Next Steps After Diagnosis

1. **Update crash patterns doc** with confirmed issues
2. **Create permanent safe restart script** (e.g., `restart-backend-proven-safe.sh`)
3. **Update Error Prevention System** docs with new insights
4. **Share findings** with Claude Code team if it's a tool issue
5. **Add to BMad workflow** as known issue + workaround

---

**Created**: 2025-10-27
**Purpose**: Systematic diagnosis of bash script crashes on Windows
**Status**: Ready for testing
