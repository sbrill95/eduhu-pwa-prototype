# ✅ KORREKTE Aufgabe: Gemini Styling für Chat + Modal

**Datum**: 2025-10-02
**Priorität**: P0 (Critical)

---

## 🎯 Das ECHTE Problem

**Was NICHT stimmt:**
1. ❌ Chat-Interface sieht nicht wie Gemini aus (alte Styling)
2. ❌ Agent Modal Form könnte nicht 100% dem Screenshot entsprechen

**Was NICHT gemacht werden soll:**
- ❌ KEINE neuen Tabs (Generieren, Automatisieren, Profil)
- ❌ KEINE Navigation ändern
- ❌ KEINE neuen Features

**Was gemacht werden soll:**
- ✅ Chat-Interface im Gemini-Style stylen
- ✅ Agent Modal Form verifizieren/fixen
- ✅ Nur STYLING, keine Funktionalität ändern!

---

## 📋 Tasks (Frontend-Agent)

### TASK-CHAT-1: Style Chat-Interface mit Gemini Design

**Ziel**: Chat-Messages sollen wie im Gemini-Prototyp aussehen

**Files to update:**
- `teacher-assistant/frontend/src/pages/Chat/Chat.tsx`
- `teacher-assistant/frontend/src/components/ChatView.tsx` (wenn verwendet)

**Was ändern:**
1. **Message Bubbles - User (rechts)**:
   - Background: Orange (#FB6542)
   - Text: Weiß
   - Border-radius: `rounded-2xl rounded-br-md` (abgeschnittene Ecke rechts unten)
   - Padding: `px-4 py-3`
   - Max-width: `max-w-[80%]`
   - Float: `justify-end`

2. **Message Bubbles - Assistant (links)**:
   - Background: Teal (#D3E4E6)
   - Text: Grau (#1F2937)
   - Border-radius: `rounded-2xl rounded-bl-md` (abgeschnittene Ecke links unten)
   - Padding: `px-4 py-3`
   - Max-width: `max-w-[80%]`
   - Float: `justify-start`

3. **Chat Input**:
   - Border-radius: `rounded-xl`
   - Border: Gray
   - Send-Button: Orange (#FB6542)

4. **Verify**:
   - Take Playwright screenshot
   - Compare to Gemini prototype

**Estimate**: 1 hour

---

### TASK-CHAT-2: Verify Agent Modal Form matches Screenshot

**Ziel**: Sicherstellen dass das Modal Form genau wie im Screenshot aussieht

**File to check:**
- `teacher-assistant/frontend/src/components/AgentFormView.tsx`

**Screenshot-Anforderungen:**
- ✅ Header: "Generieren" (Orange, oben links)
- ✅ Subtitle: "Maßgeschneidertes Arbeitsmaterial in Minuten."
- ✅ Form-Felder:
  1. **Thema** (Textarea): Pre-filled
  2. **Lerngruppe** (Dropdown): "Klasse 8a"
  3. **Differenzierung** (Sektion-Header)
  4. **DaZ-Unterstützung** (Toggle)
  5. **Lernschwierigkeiten** (Toggle, orange wenn aktiv)
- ✅ **CTA-Button**: "Idee entfalten ✨" (Orange, fixed bottom)
- ✅ Background: Weiß/Teal Cards
- ✅ Border-radius: `rounded-2xl`

**Action:**
1. Open Modal (trigger via backend test message)
2. Take screenshot
3. Compare to `.specify/specs/Screenshot 2025-10-02 080256.png`
4. If mismatch: Fix styling
5. If match: Mark as done

**Estimate**: 30 minutes (if no fixes needed)

---

### TASK-CHAT-3: Integrate AgentConfirmationMessage in Chat

**Ziel**: Sicherstellen dass AgentConfirmationMessage im Chat angezeigt wird

**File to update:**
- `teacher-assistant/frontend/src/pages/Chat/Chat.tsx`

**Was checken:**
1. Wenn Backend `agentSuggestion` in Response zurückgibt
2. Soll AgentConfirmationMessage angezeigt werden
3. Mit "Ja, Bild erstellen ✨" Button
4. Im Gemini-Style (Gradient background, Orange button)

**Implementation:**
```tsx
// In Chat.tsx - beim Rendern der Assistant-Message
{message.agentSuggestion ? (
  <AgentConfirmationMessage message={message} />
) : (
  <div className="flex justify-start mb-3">
    <div className="bg-background-teal text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
      {message.content}
    </div>
  </div>
)}
```

**Estimate**: 1 hour

---

## 📊 Summary

**Total Tasks**: 3
**Total Time**: ~2.5 hours
**Agent**: react-frontend-developer

**Deliverables:**
1. ✅ Chat-Interface mit Gemini Bubble-Style
2. ✅ Agent Modal Form verified/fixed
3. ✅ AgentConfirmationMessage integration
4. ✅ Screenshots (before/after)
5. ✅ No functional changes, only styling!

---

## 🚀 Success Criteria

- ✅ Chat Bubbles: Orange (user) + Teal (assistant)
- ✅ rounded-2xl mit abgeschnittenen Ecken
- ✅ Agent Modal matches Screenshot
- ✅ AgentConfirmationMessage shows when backend returns agentSuggestion
- ✅ No new tabs/features added
- ✅ Existing functionality unchanged

---

**Next**: Assign to Frontend-Agent mit DIESEN Tasks!
