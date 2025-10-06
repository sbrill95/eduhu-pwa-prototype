# Manual Testing Guide: BUG-017 Fix Verification

## Zweck
Verifizierung, dass die Behebung von BUG-017 korrekt funktioniert und Chat-Kontext bei Library-Fortsetzung erhalten bleibt.

---

## Voraussetzungen

1. **Frontend läuft**: `npm run dev` im `/teacher-assistant/frontend` Verzeichnis
2. **Backend läuft**: Backend-Server ist gestartet
3. **Angemeldet**: User ist in der App eingeloggt
4. **Console offen**: Browser DevTools → Console Tab geöffnet

---

## Test-Szenarien

### ✅ SZENARIO 1: Library Chat Continuation (Haupttest)

**Ziel**: Verifizieren, dass geladene Chats vollen Kontext haben

**Schritte**:

1. **Neuen Chat erstellen mit spezifischem Thema**:
   - Gehe zum Chat-Tab
   - Sende Nachricht: "Erkläre mir Photosynthese in einfachen Worten."
   - Warte auf AI-Antwort (sollte Photosynthese erklären)
   - ✅ **Erwartung**: AI antwortet mit Photosynthese-Erklärung

2. **Chat aus Library laden**:
   - Warte 2-3 Sekunden (damit Nachricht in DB gespeichert wird)
   - Gehe zum Library-Tab
   - Klicke auf den gerade erstellten Chat (oben in der Liste)
   - ✅ **Erwartung**: Chat wird geladen, alte Nachrichten sind sichtbar

3. **Kontext-abhängige Nachricht senden**:
   - Sende Nachricht: "Kannst du das noch erweitern?"
   - Schaue in Browser Console nach `[BUG-017 FIX]` Log
   - Warte auf AI-Antwort

4. **Verifiziere AI-Antwort**:
   - ✅ **Erwartung**: AI erweitert die Photosynthese-Erklärung
   - ✅ **Erwartung**: AI versteht "das" = Photosynthese
   - ❌ **FEHLER wenn**: AI fragt "Was soll ich erweitern?"

5. **Überprüfe Console Logs**:
   ```
   [BUG-017 FIX] Context for API: {
     totalMessages: X,
     previousMessages: Y,
     dbMessages: Z (MUSS > 0 sein!),
     localMessages: 1
   }
   ```
   - ✅ **Erwartung**: `dbMessages` ist mindestens 2 (User + Assistant)

---

### ✅ SZENARIO 2: Regression Test - Neue Chats

**Ziel**: Sicherstellen, dass neue Chats weiterhin funktionieren

**Schritte**:

1. **Neuen Chat starten**:
   - Gehe zum Chat-Tab
   - Falls noch ein Chat geladen ist, klicke "Neuer Chat" (falls vorhanden)
   - Sende Nachricht: "Hallo! Wer bist du?"
   - ✅ **Erwartung**: AI antwortet als Lehrkräfte-Assistent

2. **Follow-up senden**:
   - Sende Nachricht: "Was kannst du für mich tun?"
   - ✅ **Erwartung**: AI antwortet mit Kontext (bezieht sich auf vorherige Nachricht)

3. **Überprüfe Console Logs**:
   ```
   [BUG-017 FIX] Context for API: {
     totalMessages: X,
     previousMessages: Y,
     dbMessages: 0 (OK für neuen Chat),
     localMessages: Y (sollte > 0 sein)
   }
   ```

---

### ✅ SZENARIO 3: Langer Chat-Verlauf

**Ziel**: Verifizieren, dass auch lange Chats korrekt geladen werden

**Schritte**:

1. **Langen Chat erstellen**:
   - Gehe zum Chat-Tab
   - Sende mehrere Nachrichten nacheinander:
     - "Was ist Mathematik?"
     - "Erkläre Addition"
     - "Was ist 5 + 3?"
     - "Warum ist das so?"
   - Warte jeweils auf AI-Antwort

2. **Chat aus Library laden**:
   - Warte 3 Sekunden
   - Gehe zum Library-Tab
   - Lade den Chat

3. **Kontext-Test**:
   - Sende: "Kannst du das Beispiel erweitern?"
   - ✅ **Erwartung**: AI erweitert das 5+3 Beispiel oder erklärt weitere Addition-Beispiele

4. **Verifiziere Console**:
   - `dbMessages` sollte mindestens 8 sein (4 User + 4 Assistant)

---

### ✅ SZENARIO 4: Mehrere Chat-Ladevorgänge

**Ziel**: Verifizieren, dass Context Switch zwischen Chats funktioniert

**Schritte**:

1. **Erstelle 2 Chats mit unterschiedlichen Themen**:
   - Chat 1: "Erkläre Photosynthese"
   - Chat 2: "Erkläre Gravitation"

2. **Lade Chat 1 aus Library**:
   - Sende: "Kannst du das erweitern?"
   - ✅ **Erwartung**: AI spricht über Photosynthese

3. **Lade Chat 2 aus Library**:
   - Sende: "Kannst du das erweitern?"
   - ✅ **Erwartung**: AI spricht über Gravitation (NICHT Photosynthese!)

4. **Verifiziere Context Switch**:
   - Jeder geladene Chat muss eigenen Kontext haben
   - Keine Vermischung von Themen

---

## Console Log Interpretation

### ✅ ERFOLG - Geladener Chat:
```javascript
[BUG-017 FIX] Context for API: {
  totalMessages: 5,
  previousMessages: 4,
  dbMessages: 4,        // ✅ > 0 bedeutet DB-Kontext vorhanden
  localMessages: 1      // ✅ Neue User-Nachricht
}
```

### ✅ ERFOLG - Neuer Chat:
```javascript
[BUG-017 FIX] Context for API: {
  totalMessages: 3,
  previousMessages: 2,
  dbMessages: 0,        // ✅ OK für neuen Chat
  localMessages: 3      // ✅ Alle Nachrichten lokal
}
```

### ❌ FEHLER - Kein Kontext:
```javascript
[BUG-017 FIX] Context for API: {
  totalMessages: 1,     // ❌ Nur neue Nachricht
  previousMessages: 0,  // ❌ Kein vorheriger Kontext
  dbMessages: 0,        // ❌ DB-Nachrichten fehlen!
  localMessages: 1
}
```

---

## Erwartete Ergebnisse (Zusammenfassung)

| Szenario | Erwartetes Verhalten | Zeichen eines Fehlers |
|----------|----------------------|------------------------|
| Library Chat Laden | AI hat vollen Kontext | AI fragt nach, was "das" ist |
| Neue Chats | AI antwortet kontextbezogen | AI verhält sich wie neuer Chat |
| Langer Chat | Alle Nachrichten im Kontext | AI kennt nur letzte Nachricht |
| Context Switch | Jeder Chat hat eigenen Kontext | Themen vermischen sich |

---

## Problembehandlung

### Problem: AI hat keinen Kontext nach Library-Laden

**Diagnose**:
1. Überprüfe Console Log: `dbMessages` sollte > 0 sein
2. Überprüfe Network Tab: API-Request sollte alte Nachrichten enthalten
3. Überprüfe, ob Nachrichten in UI sichtbar sind

**Mögliche Ursachen**:
- DB-Query lädt Nachrichten nicht korrekt
- `stableMessages` ist leer
- Code-Fix wurde nicht korrekt angewendet

### Problem: Neue Chats funktionieren nicht mehr

**Diagnose**:
1. Überprüfe Console Log: `localMessages` sollte > 0 sein
2. Überprüfe, ob Regression in `messages` Berechnung

**Mögliche Ursachen**:
- `messages` Array-Berechnung fehlerhaft
- Slice-Logik inkorrekt

---

## Abnahmekriterien

**BUG-017 ist gefixt wenn**:
- ✅ Alle 4 Szenarien erfolgreich durchlaufen
- ✅ Console Logs zeigen `dbMessages > 0` bei geladenen Chats
- ✅ AI antwortet kontextbezogen auf "Kannst du das erweitern?"
- ✅ Keine Regression bei neuen Chats
- ✅ Context Switch funktioniert korrekt
- ✅ Keine Duplikat-Nachrichten in UI oder API

---

## Nächste Schritte nach Manual Testing

1. ✅ Manual Tests bestanden → E2E Tests ausführen
2. ✅ E2E Tests bestanden → Production Deployment vorbereiten
3. ❌ Tests fehlgeschlagen → Debug und erneut fixen

**E2E Test Command**:
```bash
npm run test:e2e -- bug-017-library-chat-continuation.spec.ts
```

---

**Testing by**: _____________
**Date**: _____________
**Result**: ☐ PASSED ☐ FAILED
**Notes**:
