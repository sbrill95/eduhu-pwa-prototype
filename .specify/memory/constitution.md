# Teacher Assistant - Project Constitution

**Version**: 1.0
**Last Updated**: 2025-09-30
**Status**: Living Document

---

## Vision & Mission

### Vision
Wir schaffen den weltweit beliebtesten digitalen Assistenten für Lehrkräfte—ein Tool, das Lehrerinnen und Lehrer täglich nutzen **wollen**, nicht **müssen**.

### Mission
Durch herausragendes Design, ethische KI-Nutzung und bedingungslosen Respekt für Lehrkräfte und Schülerdaten bauen wir ein Produkt, das:
- **Zeit spart** (Automatisierung von Routineaufgaben)
- **Qualität steigert** (KI-gestützte Materialerstellung)
- **Freude bereitet** (Emotional Design Principles)
- **Vertrauen schafft** (Transparenz, Datenschutz, Sicherheit)

---

## Core Principles

### 1. Teachers First 👩‍🏫

**Jede Entscheidung wird durch die Brille einer Lehrkraft getroffen.**

- **Verstehe den Kontext**: Lehrkräfte arbeiten unter Zeitdruck, mit 20-30 Schülern, unterschiedlichen Fähigkeiten
- **Respektiere ihre Expertise**: KI unterstützt, ersetzt nicht ihre pädagogische Kompetenz
- **Spreche ihre Sprache**: Deutsch, freundlich (Du-Form), mit deutscher Bildungsterminologie
- **Löse echte Probleme**: Fokus auf Unterrichtsvorbereitung, Differenzierung, Materialerstellung

**Anti-Pattern**: Features bauen, die cool sind, aber keinen echten Wert für Lehrkräfte haben

---

### 2. Privacy & Security by Default 🔒

**Schüler- und Lehrerdaten sind heilig. Kein Kompromiss.**

#### Data Protection Principles

**Minimale Datenerfassung**:
- Sammle nur Daten, die absolut notwendig sind
- Keine unnötigen Tracking-Mechanismen
- Klar kommunizieren, welche Daten wofür genutzt werden

**Transparenz**:
- Lehrkräfte verstehen jederzeit, wo ihre Daten sind
- Klare Consent-Flows (kein Dark Pattern)
- Export- und Löschfunktionen zugänglich

**Sicherheit**:
- Alle sensiblen Daten verschlüsselt (at rest, in transit)
- InstantDB Authentication für sichere User-Verwaltung
- OpenAI API: Keine Trainingsdaten-Nutzung (opt-out Einstellung)
- Regelmäßige Security Audits

**Compliance**:
- DSGVO-konform (EU-Standard)
- Schul-Datenschutz-Richtlinien befolgen
- Keine Weitergabe von Daten an Dritte ohne explizite Zustimmung

**Anti-Pattern**: "Wir brauchen diese Daten für zukünftige Features" ohne klaren Mehrwert

---

### 3. Code Quality & Maintainability 💎

**Schreibe Code, als würdest du ihn in 2 Jahren debuggen müssen.**

#### Technical Standards

**TypeScript Strict Mode**:
```typescript
// ✅ GOOD: Explizite Types, klare Interfaces
interface TeacherContext {
  userId: string;
  subject: string;
  gradeLevel: number;
  schoolType: 'Grundschule' | 'Gymnasium' | 'Realschule' | 'Gesamtschule';
}

// ❌ BAD: Implizite any, unklare Strukturen
function processContext(data) {
  return data.map(d => d.value);
}
```

**Error Handling**:
- Alle Fehler mit deutschen, hilfreichen Nachrichten
- Niemals rohe Error-Objekte an User zeigen
- Graceful Degradation (Feature funktioniert nicht → App stürzt nicht ab)

**Testing**:
- Unit Tests für Business Logic (mind. 80% Coverage)
- Integration Tests für kritische Flows
- E2E Tests für User Journeys
- Keine Tests für triviale Getter/Setter

**Performance**:
- Mobile First: Alles muss auf Smartphone schnell sein
- Bundle Size: Lazy Loading für große Features
- Rendering: 60fps Animationen, keine Jank
- API: Response Times < 500ms

**Documentation**:
- Code ist self-documenting (klare Namen)
- Komplexe Logik hat Kommentare mit "Warum", nicht "Was"
- Session Logs für alle Features (in `/docs/development-logs/sessions/`)

**Anti-Pattern**: "Funktioniert bei mir" ohne Cross-Browser/Device Testing

---

### 4. Emotional Design as Competitive Edge 🎨

**Functional ist Standard. Delightful ist unser Vorteil.**

> "The product has to be so good people want to talk about it." — Reed Hastings

#### Design Philosophy

**Human, Not Robotic**:
- Animationen sind emotionales Feedback, nicht Eye-Candy
- Erfolgsmomente werden gefeiert (nicht nur Checkmarks)
- Fehler werden freundlich behandelt (Forgiveness Principle)

**Polish = Trust**:
- In High-Stakes-Bereichen (Bildung) signalisiert Polish Kompetenz
- Jede Micro-Interaction ist ein Trust Signal
- Erste Impression ist kritisch (Onboarding Investment)

**Addictiveness (Ethical)**:
- ✅ Progress Visualization, Streaks, Micro-Achievements
- ✅ Positive Feedback Loops, Celebration Moments
- ❌ Dark Patterns, Artificial Scarcity, Nagging

**Mobile Excellence**:
- Touch Targets ≥ 44x44px
- 60fps Animationen
- Gestures für häufige Aktionen

**Anti-Pattern**: "Design können wir später machen" (Design ist Product, nicht Decoration)

---

### 5. Accessibility & Inclusion ♿

**Jede Lehrkraft, unabhängig von Fähigkeiten oder Technologie-Zugang.**

#### Standards

**WCAG 2.1 AA Compliance**:
- Keyboard Navigation für alle Features
- Screen Reader Support (ARIA Labels)
- Farbkontraste mind. 4.5:1
- Keine Information nur über Farbe

**Responsive Design**:
- Funktioniert auf alten Android-Geräten
- Offline-Fähigkeit für kritische Features
- Langsame Internet-Verbindungen berücksichtigt

**Internationalisierung**:
- Aktuell: Deutsch (Deutschland)
- Zukunft: Deutsch (Österreich, Schweiz), andere Sprachen
- Keine hard-coded Strings

**Anti-Pattern**: "Die meisten User haben schnelles Internet" (viele Schulen nicht)

---

### 6. AI Ethics & Transparency 🤖

**KI ist Werkzeug, nicht Blackbox.**

#### OpenAI Integration

**Transparenz**:
- Lehrkräfte wissen immer, wann KI im Einsatz ist
- Generierte Inhalte sind gekennzeichnet
- Kosten transparent kommuniziert (wenn relevant)

**Quality Control**:
- KI-Output wird validiert, nicht blind übernommen
- Lehrkraft hat finale Kontrolle über alle Inhalte
- Feedback-Loops zur Verbesserung

**Educational Context**:
- Prompts sind auf deutschen Bildungskontext optimiert
- Berücksichtigung von Lehrplänen und Schulformen
- Altergerechte Sprache für Schülerinnen und Schüler

**Bias Awareness**:
- Bewusstsein für KI-Bias in Ausgaben
- Diverse Beispiele und Perspektiven
- Regelmäßige Audits der generierten Inhalte

**LangGraph Agents**:
- Klare Agent Detection (Lehrkraft versteht, was passiert)
- Usage Limits kommuniziert
- State Management sicher und nachvollziehbar

**Anti-Pattern**: "KI macht das schon" ohne Human-in-the-Loop

---

### 7. Performance & Reliability 🚀

**Downtime = Lehrkraft kann nicht vorbereiten = unacceptable.**

#### Infrastructure

**Uptime Target**: 99.9% (max. 43 Minuten Downtime/Monat)

**Monitoring**:
- Error Tracking (Sentry o.ä.)
- Performance Monitoring (Response Times, Bundle Size)
- User Analytics (Privacy-respecting, opt-in)

**Deployment**:
- Zero-Downtime Deployments
- Rollback Plan für jedes Deployment
- Staging Environment für Testing

**Scalability**:
- Vorbereitet für 10.000+ gleichzeitige User
- InstantDB und OpenAI API Rate Limits verstanden
- Caching-Strategie (Redis für Sessions)

**Anti-Pattern**: "Das skaliert später" (später ist zu spät)

---

### 8. Developer Experience & Team Culture 🤝

**Gutes Product braucht gutes Team. Gutes Team braucht gute Tools.**

#### Workflow

**SpecKit Integration**:
- Alle Features starten mit spec.md (WAS & WARUM)
- Technical Planning in plan.md (WIE)
- Task Breakdown in tasks.md (Implementierung)

**Agent Collaboration**:
- Backend-Agent, Frontend-Agent, QA-Agent, Emotional Design Agent
- Klare Verantwortlichkeiten, parallele Arbeit wo möglich
- Session Logs nach jedem Task

**Documentation**:
- `/docs/development-logs/sessions/` für tägliche Arbeit
- `/docs/architecture/` für System-Überblick
- `/docs/quality-assurance/bug-tracking.md` für Issues

**Communication**:
- Session Logs sind Kommunikationsmittel
- Retrospectives nach Features
- Lessons Learned dokumentiert

**Anti-Pattern**: "Das steht im Code" ohne Kontext-Dokumentation

---

## Decision Framework

### Bei jeder Entscheidung fragen:

1. **Teacher First**: Hilft das Lehrkräften wirklich? Oder ist es nur cool?
2. **Privacy**: Brauchen wir diese Daten wirklich? Wie schützen wir sie?
3. **Quality**: Können wir das in 2 Jahren noch verstehen und maintainen?
4. **Design**: Fühlt sich das gut an? Würde eine Lehrkraft das weiterempfehlen?
5. **Accessibility**: Funktioniert das für alle Lehrkräfte?
6. **Ethics**: Ist das transparent und fair?
7. **Performance**: Ist das schnell genug für Schulnetz-Infrastruktur?
8. **Team**: Macht das die Arbeit für andere Agents einfacher oder komplizierter?

### Wenn in Zweifel:

**Ask the Teacher**: Frag eine echte Lehrkraft. Keine Annahmen.

---

## Non-Negotiables

Diese Prinzipien sind **absolut** und können nicht "später" aufgeräumt werden:

1. ❌ **Keine Schülerdaten ohne explizite Zustimmung**
2. ❌ **Keine Dark Patterns oder manipulative UX**
3. ❌ **Keine rohen Error Messages an User**
4. ❌ **Keine ungetesteten Deployments zu Production**
5. ❌ **Keine Features ohne SpecKit-Dokumentation**
6. ❌ **Keine TypeScript `any` Types (außer explizit gerechtfertigt)**
7. ❌ **Keine Features ohne Mobile Testing**
8. ❌ **Keine KI-Outputs ohne Human Review**

---

## Success Metrics

### Product Success

**Engagement**:
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- DAU/MAU Ratio (Stickiness)
- Feature Usage Rates

**Satisfaction**:
- Net Promoter Score (NPS) > 50
- User Interviews (qualitative Feedback)
- Support Ticket Volume (niedrig = gut)
- Retention Rate nach 30/60/90 Tagen

**Impact**:
- Zeit gespart pro Woche (Self-Reported)
- Materialien erstellt
- Teacher Testimonials

### Technical Success

**Quality**:
- Test Coverage > 80%
- Zero Critical Security Issues
- Performance Budget eingehalten
- Accessibility Audit passed

**Reliability**:
- Uptime > 99.9%
- Error Rate < 0.1%
- Average Response Time < 500ms

**Maintainability**:
- Code Review Approval Rate
- Time to Fix Bugs
- Deployment Frequency

---

## Living Document

Diese Constitution ist ein **Living Document**. Sie wird erweitert und verfeinert, wenn wir lernen.

### Amendment Process

1. Problem oder neue Erkenntnis identifiziert
2. Vorschlag in Team diskutiert
3. Constitution aktualisiert mit Rationale
4. Version Bump und Change Log

### Change Log

| Date | Version | Change | Rationale |
|------|---------|--------|-----------|
| 2025-09-30 | 1.0 | Initial Constitution | Project Foundation |

---

## Conclusion

> "Your long-term edge isn't the code or the features. It's how your product leaves people feeling when they close the tab or swipe away."

Wir bauen nicht nur eine App. Wir bauen ein Tool, das Lehrkräfte **lieben** werden.

Jede Zeile Code, jede Design-Entscheidung, jede Feature-Priorisierung wird an diesen Prinzipien gemessen.

**Das ist unser Versprechen an Lehrkräfte. Das ist unsere Constitution.**

---

**Maintained by**: All Agents (Backend, Frontend, QA, Emotional Design)
**Enforced by**: Code Reviews, SpecKit Workflow, Session Logs
**Reviewed**: Quarterly or when major changes occur