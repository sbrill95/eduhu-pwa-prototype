# Setup Guide - Lehrkräfte-Assistent

## 📋 Übersicht

**Zielgruppe**: Entwickler, die das Projekt lokal einrichten möchten
**Geschätzte Setup-Zeit**: 15-30 Minuten
**Voraussetzungen**: Node.js, Git, Code Editor
**Schwierigkeitsgrad**: Mittel

---

## 🔧 SYSTEM VORAUSSETZUNGEN

### Required Software
- **Node.js**: Version 18.x oder höher
- **npm**: Version 9.x oder höher (mit Node.js installiert)
- **Git**: Neueste Version für Repository-Zugriff
- **Code Editor**: VS Code empfohlen mit Extensions

### Empfohlene VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright"
  ]
}
```

### System Requirements
- **RAM**: Mindestens 4GB, 8GB empfohlen
- **Festplatte**: 2GB freier Speicherplatz
- **Betriebssystem**: Windows 10+, macOS 10.14+, oder Linux
- **Internet**: Stabile Verbindung für API-Zugriffe

---

## 📥 REPOSITORY SETUP

### 1. Repository Klonen
```bash
# Repository klonen
git clone https://github.com/[username]/eduhu-pwa-prototype.git
cd eduhu-pwa-prototype

# In das Teacher Assistant Verzeichnis wechseln
cd teacher-assistant
```

### 2. Dependencies Installation
```bash
# Backend Dependencies
cd backend
npm install

# Frontend Dependencies
cd ../frontend
npm install

# Zurück zum Root-Verzeichnis
cd ..
```

### 3. Verifikation der Installation
```bash
# Backend Dependencies prüfen
cd backend && npm list --depth=0

# Frontend Dependencies prüfen
cd ../frontend && npm list --depth=0
```

---

## 🔑 ENVIRONMENT CONFIGURATION

### Backend Environment Setup
```bash
# Im backend/ Verzeichnis
cd backend
cp .env.example .env
```

**Editiere `.env` Datei mit erforderlichen Werten:**
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# InstantDB Configuration (Optional für lokale Entwicklung)
INSTANTDB_APP_ID=39f14e13-9afb-4222-be45-3d2c231be3a1

# Redis Configuration (für LangGraph Agents)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3003
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# File Upload Limits
MAX_FILE_SIZE=10485760
```

### Frontend Environment Setup
```bash
# Im frontend/ Verzeichnis
cd frontend
cp .env.example .env.local
```

**Editiere `.env.local` Datei:**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3003/api

# InstantDB Configuration
VITE_INSTANTDB_APP_ID=39f14e13-9afb-4222-be45-3d2c231be3a1

# Development Configuration
VITE_NODE_ENV=development
```

---

## 🔧 EXTERNAL SERVICES SETUP

### OpenAI API Key Setup
1. **Account erstellen**: Gehe zu [platform.openai.com](https://platform.openai.com)
2. **API Key generieren**:
   - Navigiere zu "API Keys" im Dashboard
   - Klicke "Create new secret key"
   - Kopiere den Key (beginnt mit `sk-proj-` oder `sk-`)
3. **Credits sicherstellen**: Stelle sicher, dass dein Account Credits hat
4. **Key testen**: Verwende den Key in der `.env` Datei

### InstantDB Setup (Optional)
```bash
# InstantDB ist bereits konfiguriert mit einer geteilten Dev-Instanz
# Für eigene Instanz:
# 1. Gehe zu instantdb.com
# 2. Erstelle neuen Account
# 3. Erstelle neue App
# 4. Kopiere App ID in .env Dateien
```

### Redis Setup (für LangGraph Agents)
**Option A: Docker (Empfohlen)**
```bash
# Redis Container starten
docker run -d --name redis-dev -p 6379:6379 redis:7-alpine

# Verbindung testen
docker exec -it redis-dev redis-cli ping
# Sollte "PONG" zurückgeben
```

**Option B: Lokale Installation**
```bash
# macOS mit Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows: Redis für Windows herunterladen oder WSL verwenden
```

---

## 🚀 DEVELOPMENT SERVER STARTEN

### Backend Server starten
```bash
# Im backend/ Verzeichnis
cd backend

# Development Server starten
npm run dev

# Ausgabe sollte sein:
# Server running on http://localhost:3003
# Environment: development
# OpenAI connection: healthy
```

### Frontend Server starten
```bash
# Neues Terminal, im frontend/ Verzeichnis
cd frontend

# Development Server starten
npm run dev

# Ausgabe sollte sein:
# Local:   http://localhost:5173/
# Network: use --host to expose
```

### Vollständige Anwendung testen
1. **Browser öffnen**: Gehe zu `http://localhost:5173`
2. **Login testen**: Verwende Magic Link Authentication
3. **Chat testen**: Sende eine Nachricht an ChatGPT
4. **File Upload testen**: Lade eine PDF oder Bild hoch

---

## 🧪 TESTING SETUP

### Test Dependencies installieren
```bash
# Playwright für E2E Tests (im frontend/ Verzeichnis)
cd frontend
npx playwright install

# Browser Dependencies installieren
npx playwright install-deps
```

### Tests ausführen
```bash
# Backend Tests
cd backend
npm test

# Frontend Tests
cd frontend
npm test

# E2E Tests
npm run test:e2e

# Alle Tests mit Coverage
npm run test:coverage
```

### Test Konfiguration verifizieren
```bash
# Test Status prüfen
npm run test:ci

# Erwartete Ausgabe:
# ✅ Backend: 45/45 tests passing
# ✅ Frontend: 76/76 tests passing
# ✅ E2E: 13/13 tests passing
```

---

## 🔍 TROUBLESHOOTING

### Häufige Probleme und Lösungen

#### Problem: "OpenAI API key not working"
```bash
# Lösung 1: API Key Format prüfen
echo $OPENAI_API_KEY | head -c 20
# Sollte "sk-proj-" oder "sk-" anzeigen

# Lösung 2: Direkt testen
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models | head -n 5

# Lösung 3: Backend Health Check
curl http://localhost:3003/api/chat/health
```

#### Problem: "Port already in use"
```bash
# Ports freigeben
# Backend Port (3003)
lsof -ti:3003 | xargs kill -9

# Frontend Port (5173)
lsof -ti:5173 | xargs kill -9

# Alternative Ports verwenden
PORT=3004 npm run dev  # Backend
PORT=5174 npm run dev  # Frontend
```

#### Problem: "InstantDB connection failed"
```bash
# App ID prüfen
echo $VITE_INSTANTDB_APP_ID
# Sollte UUID Format haben: 39f14e13-9afb-4222-be45-3d2c231be3a1

# Browser Network Tab prüfen für InstantDB requests
# Magic Link Email-Zustellung kann verzögert sein
```

#### Problem: "Redis connection failed"
```bash
# Redis Status prüfen
redis-cli ping

# Redis neu starten (Docker)
docker restart redis-dev

# Alternative: Memory Mode verwenden (automatischer Fallback)
# Agents funktionieren weiterhin, aber ohne Persistenz
```

#### Problem: "File upload fails"
```bash
# Upload Endpoint testen
curl -X POST -F "file=@test.txt" \
     http://localhost:3003/api/files/upload

# Logs prüfen
tail -f backend/logs/app.log

# File permissions prüfen
chmod 644 test-file.pdf
```

### Development Tools

#### Nützliche Debug-Commands
```bash
# Backend API Health Check
curl http://localhost:3003/api/health

# Frontend Build Test
cd frontend && npm run build

# TypeScript Compile Check
cd backend && npx tsc --noEmit

# Dependency Audit
npm audit --audit-level moderate
```

#### Log-Files Überwachen
```bash
# Backend Logs (wenn Winston logging aktiviert)
tail -f backend/logs/app.log

# Browser Console für Frontend Debugging
# Öffne Entwicklertools (F12) > Console Tab

# Network Requests überwachen
# Entwicklertools > Network Tab > Filter nach API calls
```

---

## 📋 DEVELOPMENT WORKFLOW

### Empfohlener Entwicklungsablauf
1. **Morning Setup**:
   ```bash
   # Backend und Frontend Server starten
   cd backend && npm run dev &
   cd frontend && npm run dev &
   ```

2. **Code Quality Check**:
   ```bash
   # Vor Commits ausführen
   npm run lint
   npm run format
   npm test
   ```

3. **Feature Development**:
   - Neue Features mit Tests entwickeln
   - TypeScript strict mode beachten
   - API changes in beiden Projekten aktualisieren

4. **Testing**:
   ```bash
   # Regelmäßig alle Tests ausführen
   npm run test:all
   npm run test:e2e
   ```

### Code Quality Standards
- **TypeScript**: Strict mode, keine 'any' types
- **ESLint**: Zero warnings/errors
- **Prettier**: Automatic formatting
- **Tests**: 95% coverage für neue Features
- **Git**: Meaningful commit messages

### File Structure Conventions
```
teacher-assistant/
├── backend/src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── config/          # Configuration
│   └── types/           # TypeScript types
├── frontend/src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
└── docs/                # Documentation
```

---

## 🎯 NEXT STEPS

### Nach erfolgreichem Setup
1. **Anwendung erkunden**: Alle Features durchgehen
2. **Code verstehen**: Architektur-Dokumentation lesen
3. **Tests verstehen**: Test-Strategien analysieren
4. **Eigene Features**: Mit kleinen Änderungen beginnen

### Weiterführende Dokumentation
- [System Architecture](../architecture/system-overview.md)
- [API Documentation](../architecture/api-documentation.md)
- [Testing Strategy](../testing/test-strategy.md)
- [Deployment Guide](./deployment-guide.md)

### Community & Support
- **Issues**: GitHub Issues für Bug Reports
- **Discussions**: GitHub Discussions für Fragen
- **Documentation**: Docs-Verzeichnis für Details
- **Code Review**: Pull Request Guidelines beachten

---

## ✅ SETUP VERIFICATION CHECKLIST

### Pre-Development Checklist
- [ ] Node.js 18+ installiert und funktionsfähig
- [ ] Repository erfolgreich geklont
- [ ] Backend Dependencies installiert (npm install)
- [ ] Frontend Dependencies installiert (npm install)
- [ ] .env Dateien konfiguriert mit gültigen Werten
- [ ] OpenAI API Key funktioniert (Health Check OK)
- [ ] InstantDB Verbindung erfolgreich
- [ ] Redis läuft (oder Fallback-Modus aktiviert)

### Server Status Checklist
- [ ] Backend Server läuft auf http://localhost:3003
- [ ] Frontend Server läuft auf http://localhost:5173
- [ ] API Health Check returns 200 OK
- [ ] Browser öffnet Anwendung ohne Fehler
- [ ] Console zeigt keine kritischen Errors

### Functionality Checklist
- [ ] Login mit Magic Link funktioniert
- [ ] Chat mit ChatGPT funktioniert
- [ ] File Upload funktioniert
- [ ] Navigation zwischen Tabs funktioniert
- [ ] Mobile responsive Design funktioniert

### Testing Checklist
- [ ] Backend Tests: 45/45 passing
- [ ] Frontend Tests: 76/76 passing
- [ ] E2E Tests: 13/13 passing
- [ ] TypeScript Compilation: Error-free
- [ ] ESLint: Warning-free

**Setup Status**: Wenn alle Checkboxen ✅ sind, ist die Entwicklungsumgebung bereit!

---

**Dokument gepflegt von**: Entwicklungsteam
**Review-Zeitplan**: Monatliche Updates, bei größeren Änderungen sofort
**Verwandte Dokumente**: Deployment Guide, Architecture Overview, Troubleshooting Guide