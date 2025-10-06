# Lernagent - Technical Implementation Plan

**Feature**: Lernagent Creator & Student Learning Interface
**Version**: 1.0
**Status**: Draft
**Erstellt**: 2025-10-04

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                       TEACHER FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ChatView → Intent Detection → AgentCreationModal          │
│                                     ↓                       │
│                            Agent Config Form                │
│                                     ↓                       │
│                         POST /api/agents/create             │
│                                     ↓                       │
│                         Backend Processing:                 │
│                         - Generate unique ID                │
│                         - Upload files to OpenAI            │
│                         - Create InstantDB entry            │
│                         - Generate QR Code                  │
│                                     ↓                       │
│                         AgentResultView                     │
│                         (QR + Link + Share)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       STUDENT FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QR/Link Scan → /learn/:agentId                            │
│                       ↓                                     │
│              GET /api/agents/:agentId                      │
│              (Check validity)                               │
│                       ↓                                     │
│              Student Name Dialog                            │
│              (Check existing session)                       │
│                       ↓                                     │
│              LearningChatView                              │
│              - Custom system prompt                         │
│              - Knowledge base access                        │
│              - Submit detection                             │
│                       ↓                                     │
│              "Ich möchte abgeben"                          │
│                       ↓                                     │
│              Intent Detection                               │
│                       ↓                                     │
│              Confirmation Dialog                            │
│                       ↓                                     │
│              POST /api/agents/:agentId/submit               │
│                       ↓                                     │
│              Email Service                                  │
│              (Send to teacher)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Data Models

### InstantDB Schema

#### `learningAgents` Collection

```typescript
{
  id: string;                    // UUID v4
  teacherId: string;              // User ID from auth

  // Configuration
  learningGoalType: 'solve-task' | 'learn-new' | 'practice' | 'method-help';
  learningGoalText: string;       // Free text description
  pedagogicalStrategy: 'socratic' | 'guided' | 'adaptive';

  // Knowledge Base
  knowledgeText: string;          // Direct text input
  uploadedFileIds: string[];      // OpenAI File IDs
  fileMetadata: Array<{
    id: string;
    name: string;
    size: number;
    uploadedAt: number;
  }>;

  // Submission Config
  submissionEnabled: boolean;
  teacherEmail: string | null;

  // Lifecycle
  validUntil: number;             // Unix timestamp
  createdAt: number;
  updatedAt: number;

  // Sharing
  shortId: string;                // 6-char unique code (e.g. "ABC123")
  qrCodeUrl: string;              // CDN URL or base64

  // Metadata
  status: 'active' | 'expired' | 'draft';
  sessionCount: number;           // Increment on each student access
}
```

#### `learningAgentSessions` Collection (Phase 2 - Analytics)

```typescript
{
  id: string;
  agentId: string;                // FK to learningAgents
  studentName: string;

  // Session Data
  messageCount: number;
  submittedAt: number | null;
  startedAt: number;
  lastActiveAt: number;

  // Recovery
  sessionToken: string;           // For session recovery

  // Metadata (for analytics)
  totalTokensUsed: number;
  averageResponseTime: number;
}
```

---

## 🔧 Backend Implementation

### New Routes

#### `POST /api/agents/create`

**Request Body**:
```typescript
{
  learningGoalType: 'solve-task' | 'learn-new' | 'practice' | 'method-help';
  learningGoalText: string;
  pedagogicalStrategy: 'socratic' | 'guided' | 'adaptive';
  knowledgeText: string;
  files?: File[];                 // Multipart form data
  submissionEnabled: boolean;
  teacherEmail?: string;
  validUntil: string;             // ISO date string
}
```

**Response**:
```typescript
{
  success: true;
  agent: {
    id: string;
    shortId: string;
    qrCodeUrl: string;
    shareUrl: string;             // "https://eduhu.app/learn/ABC123"
    validUntil: number;
  }
}
```

**Processing Steps**:
1. Validate request (Zod schema)
2. Upload files to OpenAI (if any)
3. Generate unique `shortId` (6 chars, collision-free)
4. Generate QR Code (using `qrcode` npm package)
5. Store QR Code (base64 in DB or upload to CDN)
6. Create InstantDB entry
7. Send confirmation email to teacher (optional)
8. Return agent data

---

#### `GET /api/agents/:shortId`

**Response**:
```typescript
{
  success: true;
  agent: {
    id: string;
    learningGoalText: string;
    pedagogicalStrategy: string;
    submissionEnabled: boolean;
    status: 'active' | 'expired';
    validUntil: number;
  }
}
```

**Error Cases**:
- `404`: Agent not found
- `410 Gone`: Agent expired

---

#### `POST /api/agents/:agentId/session`

**Request Body**:
```typescript
{
  studentName: string;
}
```

**Response**:
```typescript
{
  success: true;
  session: {
    id: string;
    token: string;              // For recovery
    existingSession: boolean;   // True if recovered
    messageHistory?: Message[]; // If recovered
  }
}
```

**Processing**:
1. Check if session exists: `agentId + studentName`
2. If exists and within recovery window: Return existing
3. If not: Create new session
4. Increment `sessionCount` in agent
5. Return session token (store in localStorage)

---

#### `POST /api/agents/:agentId/chat`

**Request Body**:
```typescript
{
  sessionToken: string;
  message: string;
}
```

**Response**: SSE Stream (like existing chat)

**System Prompt Construction**:
```typescript
function buildLearningAgentPrompt(agent: LearningAgent): string {
  const basePrompt = `Du bist ein Lernassistent für Schüler:innen.

**Lernziel**: ${agent.learningGoalText}

**Pädagogische Strategie**: ${getStrategyDescription(agent.pedagogicalStrategy)}

**Wissensbasis**:
${agent.knowledgeText}

**Regeln**:
- Bleibe beim Thema "${agent.learningGoalText}"
- Antworte auf Deutsch
- Verwende eine schülerfreundliche Sprache
- ${getStrategyInstructions(agent.pedagogicalStrategy)}
${agent.submissionEnabled ? '- Wenn der Schüler fertig ist, weise darauf hin dass er "abgeben" kann' : ''}
`;

  return basePrompt;
}

function getStrategyDescription(strategy: string): string {
  const descriptions = {
    'socratic': 'Sokratisch - Stelle Fragen, lass den Schüler selbst denken',
    'guided': 'Geführt - Gib klare Schritt-für-Schritt Anleitungen',
    'adaptive': 'Adaptiv - Passe deine Hilfe an die Bedürfnisse an'
  };
  return descriptions[strategy];
}

function getStrategyInstructions(strategy: string): string {
  const instructions = {
    'socratic': 'Erkläre nur Konzepte. Stelle Rückfragen. Gib keine direkten Lösungen.',
    'guided': 'Gib detaillierte Anleitungen. Erkläre jeden Schritt. Führe den Schüler zur Lösung.',
    'adaptive': 'Beginne mit Fragen. Wenn der Schüler nicht weiterkommt, gib mehr Hilfe.'
  };
  return instructions[strategy];
}
```

**File Access**:
- Use OpenAI Assistants API with `file_ids`
- Or use Retrieval in Chat Completions

---

#### `POST /api/agents/:agentId/submit`

**Request Body**:
```typescript
{
  sessionToken: string;
  studentName: string;
  chatHistory: Message[];
}
```

**Response**:
```typescript
{
  success: true;
  message: 'Abgabe erfolgreich versendet'
}
```

**Processing**:
1. Validate session token
2. Get agent config (teacher email)
3. Format email content
4. Send via email service
5. Update session `submittedAt`
6. Return success

---

#### `PATCH /api/agents/:agentId`

**Request Body** (only editable fields):
```typescript
{
  knowledgeText?: string;
  files?: File[];               // Add new files
  removeFileIds?: string[];     // Remove files
  validUntil?: string;          // Extend validity
}
```

**Response**:
```typescript
{
  success: true;
  agent: LearningAgent;
}
```

---

### Email Service

**Provider**: Resend (einfachste Integration, 100 Mails/Tag gratis)

**Setup**:
```typescript
// teacher-assistant/backend/src/services/emailService.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSubmissionEmail(
  teacherEmail: string,
  submission: {
    studentName: string;
    learningGoal: string;
    chatHistory: Message[];
    submittedAt: Date;
  }
) {
  const chatText = submission.chatHistory
    .map(m => `${m.role === 'user' ? 'Schüler' : 'Bot'}: ${m.content}`)
    .join('\n\n');

  await resend.emails.send({
    from: 'Lernagent <noreply@eduhu.app>',
    to: teacherEmail,
    subject: `[Lernagent] Abgabe von ${submission.studentName} - ${submission.learningGoal}`,
    text: `
Hallo,

${submission.studentName} hat eine Abgabe für deinen Lernagenten gemacht:

Lernziel: ${submission.learningGoal}
Abgabezeitpunkt: ${submission.submittedAt.toLocaleString('de-DE')}
Anzahl Nachrichten: ${submission.chatHistory.length}

--- Chat-Verlauf ---
${chatText}
---

Diese Mail wurde automatisch von eduhu.app generiert.
    `.trim(),
  });
}
```

**Environment Variables**:
```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@eduhu.app
```

---

### QR Code Generation

**Library**: `qrcode` (npm)

```typescript
// teacher-assistant/backend/src/services/qrCodeService.ts
import QRCode from 'qrcode';

export async function generateQRCode(url: string): Promise<string> {
  // Generate as base64 PNG
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return qrDataUrl; // "data:image/png;base64,..."
}

// Alternative: Generate as buffer and upload to CDN
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
  });
}
```

**Storage Options**:
1. **Base64 in DB** (einfach, initial): Speichere `qrDataUrl` direkt
2. **Upload to CDN** (skalierbar, Phase 2): S3, Cloudflare R2, etc.

---

### Short ID Generation

**Strategy**: Base62 encoding mit Collision-Check

```typescript
// teacher-assistant/backend/src/services/shortIdService.ts
import { customAlphabet } from 'nanoid';

// Exclude ambiguous characters: 0, O, I, l
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);

export async function generateUniqueShortId(db: InstantDB): Promise<string> {
  let shortId: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    shortId = nanoid();
    attempts++;

    // Check if exists
    const existing = await db.learningAgents.findOne({
      where: { shortId }
    });

    if (!existing) {
      return shortId;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique short ID');
    }
  } while (true);
}
```

**URL Format**: `https://eduhu.app/learn/ABC123`

---

## 🎨 Frontend Implementation

### New Components

#### `AgentCreationModal.tsx`

**Location**: `teacher-assistant/frontend/src/components/AgentCreationModal.tsx`

**Props**:
```typescript
interface AgentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: LearningAgent) => void;
}
```

**Structure**:
```tsx
<IonModal isOpen={isOpen}>
  <IonHeader>
    <IonToolbar>
      <IonTitle>Lernagent erstellen</IonTitle>
      <IonButtons slot="end">
        <IonButton onClick={onClose}>
          <IonIcon icon={closeOutline} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>

  <IonContent className="p-4">
    <form onSubmit={handleSubmit}>
      {/* Section 1: Lernziel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">1. Was soll erreicht werden?</h3>
        <div className="space-y-2">
          {goalTypes.map(type => (
            <label key={type.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="goalType" value={type.value} />
              <span className="ml-3">{type.label}</span>
            </label>
          ))}
        </div>
        <IonTextarea
          placeholder="Beschreibe das Lernziel..."
          value={learningGoalText}
          onIonChange={e => setLearningGoalText(e.detail.value)}
          className="mt-4"
        />
      </div>

      {/* Section 2: Wissensbasis */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">2. Was muss der Agent wissen?</h3>
        <IonTextarea
          placeholder="Füge hier Kontext ein oder lade Dateien hoch..."
          value={knowledgeText}
          rows={6}
        />
        <FileUpload
          onFilesSelected={setFiles}
          maxSize={10 * 1024 * 1024}
          acceptedTypes="*"
        />
      </div>

      {/* Section 3: Pädagogische Strategie */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">3. Wie soll der Agent helfen?</h3>
        <div className="space-y-3">
          {strategies.map(strategy => (
            <StrategyCard
              key={strategy.value}
              value={strategy.value}
              label={strategy.label}
              description={strategy.description}
              selected={pedagogicalStrategy === strategy.value}
              onSelect={() => setPedagogicalStrategy(strategy.value)}
            />
          ))}
        </div>
      </div>

      {/* Section 4: Abgabe */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">4. Abgabe aktivieren?</h3>
        <IonToggle
          checked={submissionEnabled}
          onIonChange={e => setSubmissionEnabled(e.detail.checked)}
        >
          Schüler:innen können abgeben
        </IonToggle>
        {submissionEnabled && (
          <IonInput
            type="email"
            placeholder="Deine E-Mail-Adresse"
            value={teacherEmail}
            className="mt-3"
          />
        )}
      </div>

      {/* Section 5: Gültigkeit */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">5. Wie lange gültig?</h3>
        <IonDatetime
          value={validUntil}
          min={new Date().toISOString()}
          max={getMaxDate()}
        />
      </div>

      {/* Submit */}
      <IonButton
        expand="block"
        type="submit"
        disabled={!isValid}
        className="bg-primary mt-6"
      >
        Lernagent erstellen
      </IonButton>
    </form>
  </IonContent>
</IonModal>
```

**Validation**:
- Lernziel-Typ: Required
- Lernziel-Text: Min. 10 Zeichen
- Wissensbasis: Entweder Text oder Dateien erforderlich
- Strategie: Required
- Email: Validierung wenn `submissionEnabled`
- Gültigkeit: Min. 1 Tag, Max. 90 Tage

---

#### `AgentResultView.tsx`

**Location**: `teacher-assistant/frontend/src/components/AgentResultView.tsx`

**Props**:
```typescript
interface AgentResultViewProps {
  agent: LearningAgent;
  onClose: () => void;
}
```

**Structure**:
```tsx
<div className="p-6 text-center">
  <h2 className="text-2xl font-bold mb-4">🎉 Dein Lernagent ist bereit!</h2>

  {/* QR Code */}
  <div className="mb-6">
    <img
      src={agent.qrCodeUrl}
      alt="QR Code"
      className="mx-auto w-64 h-64"
    />
  </div>

  {/* Short URL */}
  <div className="mb-6">
    <p className="text-sm text-gray-600 mb-2">Link zum Teilen:</p>
    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
      <code className="flex-1 text-sm">{agent.shareUrl}</code>
      <IonButton onClick={copyToClipboard}>
        <IonIcon icon={copyOutline} />
      </IonButton>
    </div>
  </div>

  {/* Share Buttons */}
  <div className="flex gap-3 mb-6">
    <IonButton
      expand="block"
      onClick={downloadQR}
      className="flex-1"
    >
      <IonIcon icon={downloadOutline} slot="start" />
      QR herunterladen
    </IonButton>
    <IonButton
      expand="block"
      onClick={shareWhatsApp}
      className="flex-1"
    >
      <IonIcon icon={logoWhatsapp} slot="start" />
      Teilen
    </IonButton>
  </div>

  {/* Validity Info */}
  <p className="text-sm text-gray-600 mb-6">
    Gültig bis: {formatDate(agent.validUntil)}
  </p>

  {/* Actions */}
  <IonButton
    expand="block"
    routerLink="/library?tab=agents"
    className="bg-primary"
  >
    Zu meinen Agenten
  </IonButton>
</div>
```

---

#### `LearningChatView.tsx`

**Location**: `teacher-assistant/frontend/src/pages/Learn/LearningChatView.tsx`

**Route**: `/learn/:shortId`

**Flow**:
1. Load agent via `GET /api/agents/:shortId`
2. Check validity (show expired state if needed)
3. Show `StudentNameDialog` if no session
4. Initialize chat with custom system prompt
5. Monitor for submit intent
6. Show `SubmitConfirmationDialog` when detected

**Differences from Regular Chat**:
- Custom system prompt (built from agent config)
- No persistent user profile needed
- Submit button always visible (if enabled)
- Read-only knowledge base access

---

#### `StudentNameDialog.tsx`

**Props**:
```typescript
interface StudentNameDialogProps {
  agentId: string;
  onSessionCreated: (session: Session) => void;
}
```

**Structure**:
```tsx
<IonModal isOpen={true} backdropDismiss={false}>
  <IonContent className="p-6">
    <h2 className="text-xl font-bold mb-4">Willkommen beim Lernbot!</h2>
    <p className="mb-4">Deine Lehrkraft hat diesen Bot für dich erstellt.</p>

    <IonInput
      placeholder="Wie heißt du?"
      value={name}
      onIonChange={e => setName(e.detail.value)}
    />

    <IonButton
      expand="block"
      onClick={handleStart}
      disabled={!isValidName}
      className="mt-4 bg-primary"
    >
      Los geht's!
    </IonButton>
  </IonContent>
</IonModal>
```

**Logic**:
```typescript
async function handleStart() {
  const response = await fetch(`/api/agents/${agentId}/session`, {
    method: 'POST',
    body: JSON.stringify({ studentName: name })
  });

  const { session } = await response.json();

  if (session.existingSession) {
    // Show recovery dialog
    const shouldRecover = await confirmRecovery(session);
    if (shouldRecover) {
      loadExistingChat(session.messageHistory);
    }
  }

  // Store session token
  localStorage.setItem('learningSession', session.token);
  onSessionCreated(session);
}
```

---

#### `AgentManagementView.tsx`

**Location**: `teacher-assistant/frontend/src/pages/Library/AgentManagementView.tsx`

**Integration**: Add new tab to Library page

**Structure**:
```tsx
<div className="p-4">
  <h2 className="text-2xl font-bold mb-4">Meine Lernagenten</h2>

  {/* Filter Tabs */}
  <div className="flex gap-2 mb-4">
    <button
      className={cn('px-4 py-2 rounded-full', filter === 'active' && 'bg-primary text-white')}
      onClick={() => setFilter('active')}
    >
      Aktiv ({activeCount})
    </button>
    <button
      className={cn('px-4 py-2 rounded-full', filter === 'expired' && 'bg-gray-200')}
      onClick={() => setFilter('expired')}
    >
      Abgelaufen ({expiredCount})
    </button>
  </div>

  {/* Agent Cards */}
  <div className="space-y-3">
    {agents.map(agent => (
      <AgentCard
        key={agent.id}
        agent={agent}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ))}
  </div>
</div>
```

**AgentCard**:
```tsx
<div className="bg-white rounded-2xl shadow-sm p-4 border">
  <div className="flex justify-between items-start mb-2">
    <div>
      <h3 className="font-semibold">{agent.learningGoalText}</h3>
      <p className="text-sm text-gray-600">
        {getStrategyLabel(agent.pedagogicalStrategy)}
      </p>
    </div>
    <span className={cn('px-3 py-1 rounded-full text-xs', getStatusStyle(agent.status))}>
      {getStatusLabel(agent.status)}
    </span>
  </div>

  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
    <span>Gültig bis: {formatDate(agent.validUntil)}</span>
    <span>Sessions: {agent.sessionCount}</span>
  </div>

  <div className="flex gap-2">
    <IonButton size="small" onClick={() => onEdit(agent)}>
      <IonIcon icon={createOutline} slot="start" />
      Bearbeiten
    </IonButton>
    <IonButton size="small" color="danger" onClick={() => onDelete(agent)}>
      <IonIcon icon={trashOutline} slot="start" />
      Löschen
    </IonButton>
    <IonButton size="small" onClick={() => shareAgent(agent)}>
      <IonIcon icon={shareOutline} slot="start" />
      Teilen
    </IonButton>
  </div>
</div>
```

---

### Intent Detection

**Location**: `teacher-assistant/frontend/src/lib/intentDetection.ts`

**Agent Creation Detection**:
```typescript
export function detectAgentCreationIntent(message: string): boolean {
  const patterns = [
    /lernagent.*erstellen/i,
    /lernbot.*erstellen/i,
    /chatbot.*für.*schüler/i,
    /lern.*assistent.*erstellen/i,
    /agent.*für.*klasse/i,
  ];

  return patterns.some(pattern => pattern.test(message));
}
```

**Submit Detection** (Student side):
```typescript
export function detectSubmitIntent(message: string): boolean {
  const patterns = [
    /^(ich )?möchte abgeben$/i,
    /^abgeben$/i,
    /^fertig$/i,
    /^ich bin fertig$/i,
    /^submit$/i,
  ];

  return patterns.some(pattern => pattern.test(message));
}
```

---

### Hooks

#### `useAgentCreation.ts`

```typescript
export function useAgentCreation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAgent(config: AgentConfig): Promise<LearningAgent> {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('learningGoalType', config.learningGoalType);
      formData.append('learningGoalText', config.learningGoalText);
      formData.append('pedagogicalStrategy', config.pedagogicalStrategy);
      formData.append('knowledgeText', config.knowledgeText);
      formData.append('submissionEnabled', String(config.submissionEnabled));
      formData.append('validUntil', config.validUntil.toISOString());

      if (config.teacherEmail) {
        formData.append('teacherEmail', config.teacherEmail);
      }

      config.files?.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/agents/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Agent creation failed');
      }

      const data = await response.json();
      return data.agent;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { createAgent, loading, error };
}
```

#### `useLearningSession.ts`

```typescript
export function useLearningSession(agentId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function startSession(studentName: string) {
    const response = await fetch(`/api/agents/${agentId}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName }),
    });

    const data = await response.json();
    setSession(data.session);

    // Store session token
    localStorage.setItem(`learning_session_${agentId}`, data.session.token);

    return data.session;
  }

  async function submitWork(chatHistory: Message[]) {
    const sessionToken = localStorage.getItem(`learning_session_${agentId}`);

    const response = await fetch(`/api/agents/${agentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        studentName: session?.studentName,
        chatHistory,
      }),
    });

    return response.json();
  }

  return { session, startSession, submitWork, loading };
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**Backend**:
- `shortIdService.test.ts`: Unique ID generation, collision handling
- `qrCodeService.test.ts`: QR generation, format validation
- `emailService.test.ts`: Email formatting, template rendering
- `agentService.test.ts`: Agent CRUD operations

**Frontend**:
- `AgentCreationModal.test.tsx`: Form validation, file upload
- `intentDetection.test.ts`: Pattern matching accuracy
- `useAgentCreation.test.ts`: API integration, error handling

---

### Integration Tests

**E2E Flow Tests** (Playwright):

```typescript
// teacher-assistant/frontend/e2e-tests/agent-creation-flow.spec.ts
test('Teacher creates learning agent and student accesses it', async ({ page, context }) => {
  // 1. Login as teacher
  await page.goto('/');
  await loginAsTeacher(page);

  // 2. Trigger agent creation
  await page.goto('/chat');
  await page.fill('textarea', 'Ich möchte einen Lernagent erstellen');
  await page.click('button[type="submit"]');

  // 3. Wait for modal
  await page.waitForSelector('[data-testid="agent-creation-modal"]');

  // 4. Fill form
  await page.click('input[value="solve-task"]');
  await page.fill('[placeholder="Beschreibe das Lernziel..."]', 'Bruchrechnung üben');
  await page.fill('[placeholder="Füge hier Kontext ein..."]', 'Brüche kürzen und erweitern');
  await page.click('input[value="guided"]');
  await page.fill('input[type="email"]', 'teacher@example.com');

  // 5. Submit
  await page.click('button:has-text("Lernagent erstellen")');

  // 6. Get share URL
  await page.waitForSelector('[data-testid="agent-result-view"]');
  const shareUrl = await page.textContent('code');

  // 7. Open in new context (simulate student)
  const studentPage = await context.newPage();
  await studentPage.goto(shareUrl);

  // 8. Enter name
  await studentPage.waitForSelector('[placeholder="Wie heißt du?"]');
  await studentPage.fill('[placeholder="Wie heißt du?"]', 'Max Mustermann');
  await studentPage.click('button:has-text("Los geht\'s!")');

  // 9. Chat
  await studentPage.waitForSelector('textarea');
  await studentPage.fill('textarea', 'Wie kürze ich 4/8?');
  await studentPage.click('button[type="submit"]');

  // 10. Wait for response
  await studentPage.waitForSelector('[data-testid="assistant-message"]');
  const response = await studentPage.textContent('[data-testid="assistant-message"]');
  expect(response).toContain('Bruch');

  // 11. Submit work
  await studentPage.fill('textarea', 'Ich möchte abgeben');
  await studentPage.click('button[type="submit"]');

  // 12. Confirm submission
  await studentPage.waitForSelector('[data-testid="submit-confirmation"]');
  await studentPage.click('button:has-text("Bestätigen")');

  // 13. Verify success message
  await studentPage.waitForSelector('text=Abgegeben!');
});
```

---

### Manual Testing Checklist

**Teacher Flow**:
- [ ] Intent detection triggers modal
- [ ] All form fields validate correctly
- [ ] File upload works (PDF, DOCX, TXT)
- [ ] File size limit enforced (10MB)
- [ ] QR code generates correctly
- [ ] Copy-to-clipboard works
- [ ] Share buttons work (WhatsApp, Email)
- [ ] Agent appears in Library
- [ ] Edit functionality updates knowledge base
- [ ] Delete shows warning and removes agent

**Student Flow**:
- [ ] QR scan redirects correctly
- [ ] Expired agent shows error
- [ ] Name dialog appears
- [ ] Session recovery works
- [ ] Chat responds with correct strategy
- [ ] Submit intent detected
- [ ] Confirmation dialog appears
- [ ] Email sent successfully
- [ ] Can continue chatting after submit

---

## 🚀 Deployment Considerations

### Environment Variables

**Backend** (`teacher-assistant/backend/.env`):
```env
# Email Service
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@eduhu.app

# Frontend URL (for QR codes)
FRONTEND_URL=https://eduhu.app

# Rate Limiting
MAX_SESSIONS_PER_STUDENT=10
MAX_SUBMISSIONS_PER_DAY=10
```

**Frontend** (`teacher-assistant/frontend/.env`):
```env
VITE_API_URL=https://api.eduhu.app
VITE_LEARN_BASE_URL=https://eduhu.app/learn
```

---

### Database Migrations

**InstantDB Schema Update**:
```typescript
// Add to InstantDB schema
{
  learningAgents: {
    $: {
      where: { teacherId: 'string' },
      order: { createdAt: 'desc' }
    }
  },
  learningAgentSessions: {
    $: {
      where: { agentId: 'string' },
      order: { startedAt: 'desc' }
    }
  }
}
```

**Indexes**:
- `learningAgents.shortId` (unique)
- `learningAgents.teacherId` (for teacher queries)
- `learningAgentSessions.agentId + studentName` (for recovery)

---

### Performance Optimization

**QR Code Caching**:
- Generate once on creation
- Store in DB or CDN
- No regeneration needed

**Session Recovery**:
- Use localStorage for session token
- Reduce DB queries

**File Upload**:
- Stream uploads to OpenAI (don't buffer entire file)
- Show upload progress

**Email Rate Limiting**:
- Implement Redis-based rate limiter
- Max 10 submissions per student per day
- Max 100 emails per teacher per day

---

## 📊 Monitoring & Analytics (Phase 2)

### Metrics to Track

**Agent Performance**:
- Total agents created
- Active vs. expired agents
- Average session count per agent
- Most popular pedagogical strategies

**Student Engagement**:
- Total sessions started
- Average messages per session
- Session duration
- Submission rate (if enabled)

**System Health**:
- Email delivery success rate
- File upload success rate
- QR code generation time
- API response times

---

### Error Handling

**Backend Errors**:
- File upload failures → Retry with exponential backoff
- Email send failures → Queue for retry (use Bull/Redis)
- OpenAI API errors → Graceful degradation (disable knowledge base temporarily)
- DB write failures → Transaction rollback + user notification

**Frontend Errors**:
- Network failures → Retry logic with user feedback
- Invalid agent ID → 404 page with helpful message
- Session expired → Prompt re-entry or redirect to home
- Submit failures → Show error, allow retry

---

## 🔐 Security Checklist

- [ ] Validate all file uploads (type, size, content)
- [ ] Sanitize user inputs (prevent XSS)
- [ ] Rate limit all endpoints
- [ ] Implement CAPTCHA for public student pages (if abuse detected)
- [ ] Use HTTPS everywhere
- [ ] Validate session tokens (JWT with expiry)
- [ ] Encrypt sensitive data in transit and at rest
- [ ] Implement CSP headers
- [ ] CORS configuration (whitelist only)
- [ ] Input validation on all forms (Zod schemas)

---

## 📝 Open Questions & Decisions

1. **Session Storage**: LocalStorage vs. Cookies vs. SessionStorage?
   - **Decision**: LocalStorage with session token (simplest for MVP)

2. **QR Code Storage**: DB vs. CDN?
   - **Decision**: Base64 in DB initially, migrate to CDN in Phase 2

3. **Email Provider**: Resend vs. SendGrid vs. Postmark?
   - **Decision**: Resend (einfachste API, 100 free emails/day)

4. **File Storage**: OpenAI Files API vs. separate S3?
   - **Decision**: OpenAI Files API (native integration, no extra infra)

5. **Analytics**: InstantDB vs. separate analytics DB?
   - **Decision**: InstantDB for Phase 1, consider Plausible/PostHog later

6. **Multi-Language**: German only or i18n from start?
   - **Decision**: German-only MVP, i18n in Phase 2

---

## 🎯 Next Steps

1. Create `tasks.md` with detailed implementation checklist
2. Set up backend routes and services
3. Implement frontend components
4. Write tests (unit + E2E)
5. Deploy to staging
6. User testing with real teachers
7. Iterate based on feedback

---

**Review & Approval**: Ready for `tasks.md` creation
