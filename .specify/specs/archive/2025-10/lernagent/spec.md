# Lernagent - Feature Specification

**Feature**: Lernagent Creator & Student Learning Interface
**Version**: 1.0
**Status**: Draft
**Erstellt**: 2025-10-04
**Zielgruppe**: Lehrkräfte (Ersteller) & Schüler:innen (Nutzer)

---

## 🎯 Überblick

Lehrkräfte können direkt aus dem Chat heraus personalisierte Lernagenten erstellen, die Schüler:innen über einen QR-Code oder Link nutzen können. Der Agent hilft beim Lernen nach vordefinierten pädagogischen Strategien und ermöglicht optionale Abgaben per E-Mail.

**Kernproblem**: Lehrkräfte möchten individualisierte Lernunterstützung für Schüler:innen bereitstellen, ohne für jeden Schüler manuell einen separaten Chat zu führen.

**Lösung**: Ein Self-Service-Tool zur Erstellung von spezialisierten Chatbots mit klaren Lernzielen, anpassbaren Hilfestellungen und optionaler Abgabefunktion.

---

## 🧑‍🏫 User Stories

### Lehrkraft (Ersteller)

**US-01: Agent-Erstellung initiieren**
> Als Lehrkraft möchte ich im Chat erkennen lassen, dass ich einen Lernagenten erstellen will, damit ich schnell einen individuellen Lernbot für meine Klasse bereitstellen kann.

**Akzeptanzkriterien**:
- System erkennt Intent "Lernagent erstellen" aus natürlicher Sprache
- Agent-Confirmation-Modal öffnet sich mit Setup-Formular
- Lehrkraft kann Prozess jederzeit abbrechen

---

**US-02: Lernziel definieren**
> Als Lehrkraft möchte ich das Ziel des Lernagenten festlegen, damit Schüler:innen die passende Unterstützung erhalten.

**Akzeptanzkriterien**:
- Auswahl aus 4 Lernzielen:
  1. **Aufgabe lösen mit Chatbot-Hilfe**
  2. **Etwas Neues erarbeiten**
  3. **Bekanntes trainieren**
  4. **Hilfe bei einer Methode**
- Pflichtfeld: Freitext-Eingabe "Lernziel beschreiben" (min. 10 Zeichen)

---

**US-03: Wissensbasis bereitstellen**
> Als Lehrkraft möchte ich thematisches Wissen hochladen oder eingeben, damit der Agent fachlich korrekt antworten kann.

**Akzeptanzkriterien**:
- Freitext-Editor für direkte Eingabe (Markdown-Support optional)
- Datei-Upload (alle von OpenAI unterstützten Formate)
- Max. Dateigröße: 10 MB
- Multiple File Upload möglich
- Preview der hochgeladenen Inhalte

---

**US-04: Pädagogische Strategie wählen**
> Als Lehrkraft möchte ich festlegen, wie der Agent hilft, damit die Unterstützung zum Lernziel passt.

**Akzeptanzkriterien**:
- Auswahl aus 3 Hilfestellungs-Modi:
  1. **Sokratisch** - Nur Konzepte erklären, Schüler selbst denken lassen
  2. **Geführt** - Schritt-für-Schritt genaue Anleitung geben
  3. **Adaptiv** - Flexibel zwischen Erklären und Anleiten wechseln
- Tooltip/Info-Icons erklären jeden Modus

---

**US-05: Abgabe konfigurieren (optional)**
> Als Lehrkraft möchte ich optional eine E-Mail-Adresse angeben, damit Schüler:innen ihre Ergebnisse abgeben können.

**Akzeptanzkriterien**:
- Optional: E-Mail-Eingabefeld
- E-Mail-Validierung (Format-Check)
- Wenn E-Mail angegeben: Abgabe-Feature wird aktiviert
- Wenn leer: Kein Abgabe-Workflow für Schüler:innen

---

**US-06: Gültigkeit festlegen**
> Als Lehrkraft möchte ich bestimmen, wie lange der Agent nutzbar ist, damit ich die Kontrolle über Lernphasen habe.

**Akzeptanzkriterien**:
- Datum-Picker für "Gültig bis"
- Default: 7 Tage ab Erstellung
- Minimum: 1 Tag, Maximum: 90 Tage
- Nach Ablauf: Agent nicht mehr über Link/QR nutzbar

---

**US-07: QR-Code & Link erhalten**
> Als Lehrkraft möchte ich einen QR-Code und kurzen Link erhalten, damit ich diesen einfach mit Schüler:innen teilen kann.

**Akzeptanzkriterien**:
- QR-Code wird generiert (enthält Kurz-URL)
- Kurz-URL (z.B. `eduhu.app/a/ABC123`)
- Download-Button für QR-Code (PNG, 512x512px)
- Copy-to-Clipboard für Link
- Teilen-Button (WhatsApp, E-Mail, etc.)

---

**US-08: Agenten verwalten**
> Als Lehrkraft möchte ich meine erstellten Agenten sehen und bearbeiten, damit ich Materialien aktualisieren kann.

**Akzeptanzkriterien**:
- Übersicht aller erstellten Agenten (in Library oder eigener Sektion)
- Status-Anzeige: Aktiv, Abgelaufen, Entwurf
- Bearbeiten-Funktion für:
  - Wissensbasis (Dateien hinzufügen/löschen, Text ändern)
  - Gültigkeit verlängern
- **Nicht editierbar**: Lernziel, Pädagogische Strategie (würde bestehende Sessions verfälschen)
- Löschen-Funktion (mit Warnung bei aktiven Sessions)

---

### Schüler:in (Nutzer)

**US-09: Zugang über QR/Link**
> Als Schüler:in möchte ich per QR-Code oder Link auf den Lernagenten zugreifen, ohne mich registrieren zu müssen.

**Akzeptanzkriterien**:
- Scan/Klick öffnet Lernagent-Interface
- Keine Registrierung erforderlich
- Mobile-optimiert (QR-Scan mit Smartphone-Kamera)

---

**US-10: Session-Recovery**
> Als Schüler:in möchte ich meine Session fortsetzen können, wenn ich den Link erneut öffne.

**Akzeptanzkriterien**:
- Bei erstem Besuch: Namensabfrage
- System prüft: Gibt es bereits Session mit diesem Namen?
- Wenn ja: Session-Recovery-Dialog ("Möchtest du deine vorherige Session fortsetzen?")
- Wenn nein: Neue Session starten
- Recovery-Window: Bis Agent-Ablaufdatum

---

**US-11: Begrüßung & Einführung**
> Als Schüler:in möchte ich beim Start wissen, was der Agent kann und wie ich abgeben kann.

**Akzeptanzkriterien**:
- Begrüßungsnachricht zeigt:
  - Lernziel (vom Lehrer definiert)
  - Hinweis: "Deine Lehrkraft hat diesen Lernbot für dich erstellt"
  - Abgabe-Hinweis (wenn aktiviert): "Schreibe 'Ich möchte abgeben', wenn du fertig bist"
- Namensabfrage: Pflichtfeld bei Abgabe-Feature, sonst optional

---

**US-12: Lerninteraktion**
> Als Schüler:in möchte ich mit dem Agent chatten und Hilfe erhalten, die zu meinem Lernziel passt.

**Akzeptanzkriterien**:
- Chat-Interface wie normaler Chat
- Agent antwortet gemäß pädagogischer Strategie
- Agent hat Zugriff auf hochgeladene Wissensbasis
- Agent bleibt im Thema (kein Off-Topic)

---

**US-13: Abgabe einreichen**
> Als Schüler:in möchte ich meine Arbeit abgeben können, wenn der Lehrer das aktiviert hat.

**Akzeptanzkriterien**:
- Intent-Detection erkennt Abgabe-Wunsch:
  - "Ich möchte abgeben"
  - "Fertig"
  - "Abgeben"
  - Ähnliche Varianten
- Agent-Confirmation-Dialog zeigt:
  - "Möchtest du wirklich abgeben?"
  - Preview: Dein Name, Anzahl Nachrichten
  - Bestätigen/Abbrechen
- Nach Bestätigung:
  - Success-Nachricht: "Deine Abgabe wurde an deine Lehrkraft gesendet!"
  - Session bleibt offen (Schüler kann weitermachen)
  - Mehrfache Abgaben möglich (Lehrer bekommt jeweils neue Mail)

---

## 📬 E-Mail-System

### Abgabe-Mail an Lehrkraft

**Empfänger**: Vom Lehrer angegebene E-Mail
**Betreff**: `[Lernagent] Abgabe von [Schülername] - [Lernziel]`
**Inhalt**:
```
Hallo,

[Schülername] hat eine Abgabe für deinen Lernagenten gemacht:

Lernziel: [Lernziel-Text]
Abgabezeitpunkt: [Datum, Uhrzeit]
Anzahl Nachrichten: [X]

--- Chat-Verlauf ---
[Kompletter Chat als Text]
---

Diese Mail wurde automatisch von eduhu.app generiert.
```

**Technische Anforderungen**:
- Plain Text (kein HTML initial)
- UTF-8 Encoding
- Rate-Limiting: Max. 10 Abgaben pro Schüler pro Agent pro Tag

---

### Bestätigungs-Mail an Lehrkraft (bei Erstellung)

**Betreff**: `[Lernagent] Dein Lernagent "[Lernziel]" wurde erstellt`
**Inhalt**:
```
Hallo,

dein Lernagent wurde erfolgreich erstellt!

Lernziel: [Lernziel]
Gültig bis: [Datum]
Link: [Kurz-URL]

QR-Code: [Anhang oder Inline-Bild]

Viel Erfolg!
Dein eduhu-Team
```

---

## 🎨 UI/UX Anforderungen

### Lehrkraft-Interface

**Agent-Setup-Modal**:
- Ein großes Formular (ähnlich wie Bild-Generator-Modal)
- Sections für jeden Setup-Schritt
- Klare visuelle Trennung
- Submit-Button: "Lernagent erstellen" (Orange, Primary)
- Cancel-Button: "Abbrechen" (Gray)

**Result-View nach Erstellung**:
- Erfolgs-Nachricht: "Dein Lernagent ist bereit!"
- QR-Code zentral dargestellt
- Link darunter mit Copy-Button
- Share-Buttons (WhatsApp, E-Mail)
- "Zu meinen Agenten" Button

**Agenten-Übersicht** (Library oder neue Sektion):
- Card-basierte Liste
- Pro Agent:
  - Lernziel (Titel)
  - Status-Badge (Aktiv, Abgelaufen)
  - Gültig bis: [Datum]
  - Anzahl Sessions: [X]
  - Bearbeiten/Löschen Icons

---

### Schüler-Interface

**Landing-Page (bei QR/Link-Scan)**:
- Wenn Agent abgelaufen:
  - "Dieser Lernagent ist nicht mehr verfügbar"
  - Kein Zugriff
- Wenn Agent aktiv:
  - Namensabfrage-Dialog
  - "Willkommen! Wie heißt du?"
  - Input-Feld (Pflicht wenn Abgabe aktiv)
  - "Los geht's" Button

**Chat-Interface**:
- Standard Chat-View
- Subtiler Hinweis oben: "🤖 Lernbot von [Lehrkraft-Name falls verfügbar]"
- Abgabe-Button persistent sichtbar (wenn aktiviert)
  - Icon: Upload/Send-Symbol
  - Label: "Abgeben"

**Abgabe-Confirmation-Dialog**:
- "Möchtest du abgeben?"
- Info: "Deine Lehrkraft bekommt den gesamten Chat-Verlauf"
- Bestätigen/Abbrechen

**Success-State**:
- Konfetti-Animation (optional, Phase 3.2)
- "✅ Abgegeben! Deine Lehrkraft hat deine Arbeit erhalten."
- "Du kannst weiter mit dem Lernbot chatten"

---

## 🔐 Security & Privacy

1. **Keine Persistierung von Schülerdaten** (initial):
   - Nur Session-basiert (LocalStorage oder SessionStorage)
   - Bei Session-Recovery: Lookup via `agentId + studentName`
   - Analytics-Phase: Anonymisierte Speicherung mit Opt-In

2. **Rate-Limiting**:
   - Max. 50 Nachrichten pro Schüler-Session
   - Max. 10 Abgaben pro Schüler pro Tag

3. **Spam-Prevention**:
   - Agent-Links haben Secret-Token
   - CAPTCHA bei verdächtigem Traffic (optional)

4. **Datenschutz**:
   - E-Mails werden nicht gespeichert (nur in Agent-Config)
   - Schüler-Namen werden nicht persistent gespeichert (initial)
   - Hinweis für Lehrkräfte: "Verwende nur schulische E-Mail-Adressen"

---

## 📊 Analytics (geplant für Phase 2)

**Lehrkraft-Dashboard**:
- Anzahl aktiver Sessions
- Durchschnittliche Nachrichtenanzahl
- Häufigste Fragen/Themen (Keyword-Analyse)
- Abgabe-Rate (wenn aktiviert)

**Kein Tracking**:
- Keine individuellen Schüler-Profile
- Keine Speicherung von IP-Adressen
- Aggregierte Daten nur

---

## ✅ Success Criteria

**Must-Have (MVP)**:
- ✅ Lehrkraft kann Lernagent mit allen 6 Setup-Schritten erstellen
- ✅ QR-Code + Link werden generiert und sind teilbar
- ✅ Schüler:innen können ohne Registrierung zugreifen
- ✅ Session-Recovery funktioniert (Name-basiert)
- ✅ Abgabe-Workflow mit E-Mail funktioniert
- ✅ Agent respektiert Gültigkeitsdatum
- ✅ Lehrkraft kann Wissensbasis nachträglich bearbeiten

**Nice-to-Have (Phase 2)**:
- Analytics-Dashboard für Lehrkräfte
- WhatsApp-Integration für Abgaben
- Multi-Language Support
- Voice-Input für Schüler:innen
- Export als PDF (Chat-Verlauf)

**Out-of-Scope (initial)**:
- Schüler-Accounts mit Login
- Echtzeit-Monitoring durch Lehrkraft
- Video/Audio-Uploads von Schüler:innen
- Gamification (Punkte, Badges)

---

## 🚀 Rollout-Plan

**Phase 1 (MVP)**: Core Functionality
- Agent-Erstellung mit allen Setup-Schritten
- QR/Link-Generation
- Schüler-Chat mit Session-Recovery
- E-Mail-Abgaben

**Phase 2**: Analytics & Verbesserungen
- Lehrkraft-Dashboard
- Nutzungsstatistiken
- Erweiterte Bearbeitung (Strategie ändern)

**Phase 3**: Advanced Features
- Multi-Agent-Sessions (Schüler nutzt mehrere Agents parallel)
- Peer-Learning (Schüler chatten miteinander)
- Integration mit Learning Management Systems (Moodle, etc.)

---

## 📝 Offene Fragen

1. **Session-Recovery**: Soll es eine maximale Anzahl Sessions pro Name geben? (z.B. max. 3 Sessions mit Name "Max")
2. **Wissensbasis-Update**: Wie werden laufende Sessions informiert, wenn Lehrkraft Materialien ändert?
3. **E-Mail-Service**: Welchen Provider nutzen wir? (Resend, SendGrid, SMTP?)
4. **Agent-Limits**: Max. Anzahl aktiver Agents pro Lehrkraft? (initial keine Limits)
5. **Offline-Support**: Sollen Schüler offline chatten können? (initial: Nein)

---

**Nächster Schritt**: `plan.md` erstellen mit technischer Architektur
