/**
 * TypeScript interfaces for Teacher Assistant application
 * Data persistence and InstantDB integration
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: number;
  last_active: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  is_archived: boolean;
  user_id: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  message_index: number;
}

export interface LibraryMaterial {
  id: string;
  user_id: string;
  title: string;
  type: 'lesson_plan' | 'quiz' | 'worksheet' | 'resource' | 'document';
  content: string;
  description?: string;
  tags: string[];
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  source_session_id?: string; // If generated from a chat
}

// Frontend-only interfaces for UI components
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  isArchived: boolean;
}

export interface MaterialSummary {
  id: string;
  title: string;
  type: LibraryMaterial['type'];
  description: string;
  tags: string[];
  createdAt: Date;
  isFavorite: boolean;
  sourceChat?: string; // Session title if generated from chat
}

// Teacher Profile interfaces for learning system
export interface TeacherProfile {
  id: string;
  user_id: string;
  display_name?: string;
  subjects: string[];
  grades: string[];
  school_type?: 'elementary' | 'secondary' | 'university' | 'vocational';
  teaching_methods: string[];
  topics: string[];
  challenges: string[];
  created_at: number;
  last_updated: number;
  conversation_count: number;
  extraction_history: ExtractionEvent[];
}

export interface ExtractionEvent {
  id: string;
  timestamp: number;
  conversation_length: number;
  extracted_data: TeacherKnowledge;
  confidence_score?: number;
}

export interface TeacherKnowledge {
  subjects?: string[];
  grades?: string[];
  school_type?: string;
  teaching_methods?: string[];
  topics?: string[];
  challenges?: string[];
}

export interface ProfileExtractionRequest {
  messages: ChatAPIMessage[];
  existing_profile?: TeacherProfile;
}

export interface ProfileExtractionResponse {
  extracted_knowledge: TeacherKnowledge;
  confidence_scores: {
    subjects: number;
    grades: number;
    school_type: number;
    teaching_methods: number;
    topics: number;
    challenges: number;
  };
  reasoning: string;
}

// API response types for chat integration
export interface ChatAPIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAPIResponse {
  message: string;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// Onboarding and Data interfaces
export interface GermanState {
  id: string;
  name: string;
  code: string;
  searchable_text: string;
}

export interface TeachingSubject {
  id: string;
  name: string;
  description: string;
  category: string;
  grade_levels: string[];
  searchable_text: string;
}

export interface TeachingPreference {
  id: string;
  name: string;
  description: string;
  category: string;
  searchable_text: string;
}

export interface OnboardingData {
  userId: string;
  name: string;
  germanState: string;
  subjects: string[];
  gradeLevel: string;
  teachingPreferences: string[];
  school?: string;
  role?: 'teacher' | 'admin' | 'student';
}

export interface OnboardingStatus {
  userId: string;
  name?: string;
  germanState?: string;
  subjects?: string[];
  gradeLevel?: string;
  teachingPreferences?: string[];
  school?: string;
  role?: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: number;
}

// API Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

// Manual Context Management types
export type ContextType = 'subject' | 'grade' | 'method' | 'topic' | 'challenge' | 'custom';

export interface ManualContextItem {
  id: string;
  content: string;
  contextType: ContextType;
  priority: number;
  isManual: boolean;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  userId: string;
}

export interface ContextFormData {
  content: string;
  contextType: ContextType;
  priority: number;
}

export interface ContextEditMode {
  [contextId: string]: boolean;
}

// LangGraph Agent Integration types
export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  capabilities: string[];
  isAvailable: boolean;
  usageLimit?: {
    monthly: number;
    current: number;
  };
}

export interface AgentExecutionRequest {
  agentId: string;
  input: string;
  context?: Record<string, any>;
  sessionId?: string;
  confirmExecution?: boolean; // Whether to execute (true) or just preview (false)
}

export interface AgentExecutionResponse {
  executionId: string;
  agentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
  // Image generation fields
  image_url?: string;
  revised_prompt?: string;
  title?: string; // German title from ChatGPT
  dalle_title?: string; // English fallback
  library_id?: string; // Library material ID
  message_id?: string; // Chat message ID
}

export interface AgentStatus {
  executionId: string;
  agentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: {
    level: 'USER_FRIENDLY' | 'DETAILED' | 'DEBUG';
    percentage: number;
    message: string;
    stepTitle?: string;
  };
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface AgentResult {
  executionId: string;
  agentId: string;
  status: 'completed' | 'failed';
  result?: {
    type: 'image' | 'text' | 'document' | 'mixed';
    content: any;
    metadata?: Record<string, any>;
  };
  error?: string;
  usage?: {
    creditsUsed: number;
    tokensUsed?: number;
  };
  artifacts?: Array<{
    id: string;
    type: string;
    url: string;
    filename?: string;
  }>;
}

export interface AgentConfirmation {
  agentId: string;
  agentName: string;
  action: string;
  context: string;
  estimatedTime?: string;
  creditsRequired?: number;
}

export interface AgentContextDetection {
  detected: boolean;
  confidence: number;
  agentId?: string;
  keywords: string[];
  suggestedAction?: string;
}

// New agent message types for chat-integrated flow
export interface AgentConfirmationMessage extends ChatMessage {
  messageType: 'agent-confirmation';
  agentId: string;
  agentName: string;
  agentIcon: string;
  agentColor: string;
  estimatedTime?: string;
  creditsRequired?: number;
  context: string; // Original user input
}

export interface AgentProgressMessage extends ChatMessage {
  messageType: 'agent-progress';
  agentId: string;
  agentName: string;
  status: 'starting' | 'in-progress' | 'completed' | 'failed';
  progress?: number; // 0-100
  statusText: string;
}

export interface AgentResultMessage extends ChatMessage {
  messageType: 'agent-result';
  agentId: string;
  agentName: string;
  resultType: 'image' | 'document' | 'text';
  resultData: {
    imageUrl?: string;
    downloadUrl?: string;
    fileName?: string;
    description?: string;
  };
}

// Image Generation Form Data
export interface ImageGenerationFormData {
  description: string;
  imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
}

// Prompt Suggestions for Home Screen
export type PromptCategory =
  | 'quiz'
  | 'worksheet'
  | 'lesson-plan'
  | 'image'
  | 'search'
  | 'explanation'
  | 'other';

export interface PromptSuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: PromptCategory;
  icon: string;
  color: string;
  estimatedTime: string;
  metadata?: {
    templateId?: string;
    personalized: boolean;
  };
}

/**
 * Backend prefill data structure for image generation
 * (Sent by ChatGPT agent detection when user requests an image)
 */
export interface ImageGenerationPrefillData {
  theme: string;           // What the image should show (e.g., "Satz des Pythagoras")
  learningGroup?: string;  // Target audience (e.g., "Klasse 8a")
}

/**
 * Frontend form data structure for image generation (Gemini Design)
 * (Used by AgentFormView component)
 *
 * Note: AgentFormView maps backend prefill data to this structure:
 * - theme + learningGroup → description (e.g., "Satz des Pythagoras für Klasse 8a")
 */
export interface ImageGenerationFormData {
  description: string;        // Textarea - "Was soll das Bild zeigen?" - required
  imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';  // Dropdown - Bildstil
}