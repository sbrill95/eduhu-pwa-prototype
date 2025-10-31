// API client for backend communication
import type {
  GermanState,
  TeachingSubject,
  TeachingPreference,
  OnboardingData,
  OnboardingStatus,
  ManualContextItem,
  ContextType,
  AgentInfo,
  AgentExecutionRequest,
  AgentExecutionResponse,
  AgentStatus,
  AgentResult,
  SharedChatMessage,
  AgentSuggestion
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:3006/api'
);

// Use shared ChatMessage type from backend
export type ChatMessage = SharedChatMessage;

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  image_data?: string;
}

// Frontend ChatResponse interface (combines shared response with frontend-specific needs)
export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  agentSuggestion?: AgentSuggestion;
}

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  recommended: boolean;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export interface EnhancedError extends Error {
  suggestedAction?: string;
  retryAfter?: number;
  status?: number;
  errorType?: 'validation' | 'openai_api' | 'rate_limit' | 'server_error';
  errorCode?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let suggestedAction: string | undefined;
      let retryAfter: number | undefined;

      try {
        const errorData = JSON.parse(errorText);
        // Use user_message for German UI, fallback to technical error message
        errorMessage = errorData.user_message || errorData.error || errorData.message || errorMessage;
        suggestedAction = errorData.suggested_action;
        retryAfter = errorData.retry_after;
      } catch {
        // Use default error message if parsing fails
      }

      // Create enhanced error with additional context
      const enhancedError = new Error(errorMessage) as Error & {
        suggestedAction?: string;
        retryAfter?: number;
        status?: number;
        errorType?: string;
        errorCode?: string;
      };

      enhancedError.suggestedAction = suggestedAction;
      enhancedError.retryAfter = retryAfter;
      enhancedError.status = response.status;

      try {
        const errorData = JSON.parse(errorText);
        enhancedError.errorType = errorData.error_type;
        enhancedError.errorCode = errorData.error_code;
      } catch {
        // Ignore parsing errors for error metadata
      }

      throw enhancedError;
    }

    return response.json();
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Chat endpoints
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.request<{
      success: boolean;
      data: ChatResponse;
      timestamp: string;
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Extract the actual chat response from the backend wrapper
    return response.data;
  }

  async getChatModels(): Promise<{ models: ChatModel[]; default: string }> {
    return this.request<{ models: ChatModel[]; default: string }>('/chat/models');
  }

  async getChatHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    return this.request<{ status: 'healthy' | 'unhealthy'; message?: string }>('/chat/health');
  }

  // Teacher Profile endpoints
  async extractTeacherProfile(request: {
    messages: ChatMessage[];
    existing_profile?: any;
  }): Promise<{
    extracted_knowledge: any;
    confidence_scores: any;
    reasoning: string;
  }> {
    return this.request<{
      extracted_knowledge: any;
      confidence_scores: any;
      reasoning: string;
    }>('/teacher-profile/extract', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Profile endpoints
  async updateUserName(userId: string, name: string): Promise<{
    userId: string;
    name: string;
    message: string;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { userId: string; name: string; message: string };
    }>('/profile/update-name', {
      method: 'POST',
      body: JSON.stringify({ userId, name }),
    });
    return response.data;
  }

  // Context Management endpoints
  async getManualContext(userId: string, contextType?: string, active?: boolean): Promise<{
    contexts: ManualContextItem[];
    count: number;
    grouped: Record<string, ManualContextItem[]>;
  }> {
    const params = new URLSearchParams();
    if (contextType) params.append('contextType', contextType);
    if (active !== undefined) params.append('active', active.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await this.request<{
      success: boolean;
      data: { contexts: ManualContextItem[]; count: number; grouped: Record<string, ManualContextItem[]> };
    }>(`/profile/context/${userId}${queryString}`);
    return response.data;
  }

  async createManualContext(userId: string, content: string, contextType: ContextType, priority?: number): Promise<{
    contextId: string;
    message: string;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { contextId: string; message: string };
    }>('/profile/context', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        content,
        contextType,
        priority: priority || 5
      }),
    });
    return response.data;
  }

  async updateManualContext(contextId: string, updates: {
    content?: string;
    contextType?: ContextType;
    priority?: number;
    isActive?: boolean;
  }): Promise<{
    contextId: string;
    message: string;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { contextId: string; message: string };
    }>(`/profile/context/${contextId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async deleteManualContext(contextId: string, permanent = false): Promise<{
    contextId: string;
    message: string;
    permanent: boolean;
  }> {
    const params = permanent ? '?permanent=true' : '';
    const response = await this.request<{
      success: boolean;
      data: { contextId: string; message: string; permanent: boolean };
    }>(`/profile/context/${contextId}${params}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async bulkManualContext(userId: string, operation: 'create' | 'activate' | 'deactivate' | 'delete', data: {
    contextIds?: string[];
    contexts?: Array<{
      content: string;
      contextType: ContextType;
      priority?: number;
    }>;
  }): Promise<{
    operation: string;
    results: Array<{ contextId: string; success: boolean; [key: string]: any }>;
    processedCount: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { operation: string; results: any[]; processedCount: number };
    }>('/profile/context/bulk', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        operation,
        ...data
      }),
    });
    return response.data;
  }

  // Data endpoints for onboarding
  async getGermanStates(search?: string): Promise<{
    states: GermanState[];
    count: number;
  }> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await this.request<{
      success: boolean;
      data: { states: GermanState[]; count: number };
    }>(`/data/states${params}`);
    return response.data;
  }

  async getTeachingSubjects(search?: string, category?: string, gradeLevel?: string): Promise<{
    subjects: TeachingSubject[];
    count: number;
    categories: string[];
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (gradeLevel) params.append('grade_level', gradeLevel);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await this.request<{
      success: boolean;
      data: { subjects: TeachingSubject[]; count: number; categories: string[] };
    }>(`/data/subjects${queryString}`);
    return response.data;
  }

  async getTeachingPreferences(search?: string, category?: string): Promise<{
    preferences: TeachingPreference[];
    count: number;
    categories: string[];
  }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await this.request<{
      success: boolean;
      data: { preferences: TeachingPreference[]; count: number; categories: string[] };
    }>(`/data/preferences${queryString}`);
    return response.data;
  }

  // Onboarding endpoints
  async saveOnboardingData(data: OnboardingData): Promise<{
    userId: string;
    message: string;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { userId: string; message: string };
    }>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const response = await this.request<{
      success: boolean;
      data: OnboardingStatus;
    }>(`/onboarding/${userId}`);
    return response.data;
  }

  async updateOnboardingData(userId: string, data: Partial<OnboardingData>): Promise<{
    userId: string;
    message: string;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { userId: string; message: string };
    }>(`/onboarding/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // File upload endpoint
  async uploadFile(file: File): Promise<{
    id: string;
    filename: string;
    size: number;
    type: string;
    url?: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/files/upload`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.user_message || errorData.error || errorData.message || errorMessage;
      } catch {
        // Use default error message if parsing fails
      }

      const enhancedError = new Error(errorMessage) as EnhancedError;
      enhancedError.status = response.status;
      throw enhancedError;
    }

    const result = await response.json();
    return result.data;
  }

  // LangGraph Agent endpoints
  async getAvailableAgents(): Promise<{
    agents: AgentInfo[];
    count: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: { agents: AgentInfo[]; count: number };
    }>('/langgraph/agents/available');
    return response.data;
  }

  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    const endpoint = '/langgraph/agents/execute';
    const fullUrl = `${this.baseUrl}${endpoint}`;

    console.log('[ApiClient] 🚀 executeAgent REQUEST', {
      timestamp: new Date().toISOString(),
      endpoint,
      fullUrl,
      agentId: request.agentId,
      hasInput: !!request.input,
      inputType: typeof request.input,
      inputKeys: request.input && typeof request.input === 'object' ? Object.keys(request.input) : [],
      userId: request.userId,
      sessionId: request.sessionId,
      confirmExecution: request.confirmExecution
    });

    try {
      const response = await this.request<{
        success: boolean;
        data: AgentExecutionResponse;
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      console.log('[ApiClient] ✅ executeAgent RESPONSE', {
        timestamp: new Date().toISOString(),
        success: !!response.data,
        hasImageUrl: !!(response.data as any)?.image_url,
        responseKeys: response.data ? Object.keys(response.data) : [],
        dataType: typeof response.data
      });

      return response.data;
    } catch (error) {
      console.error('[ApiClient] ❌ executeAgent ERROR', {
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStatus: (error as any)?.status,
        errorCode: (error as any)?.errorCode,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
      });
      throw error;
    }
  }

  async getAgentStatus(executionId: string): Promise<AgentStatus> {
    const response = await this.request<{
      success: boolean;
      data: AgentStatus;
    }>(`/langgraph/agents/execution/${executionId}/status`);
    return response.data;
  }

  async getAgentResult(executionId: string): Promise<AgentResult> {
    // Note: This endpoint doesn't exist in backend - using status instead
    const response = await this.request<{
      success: boolean;
      data: any; // Backend response structure varies
    }>(`/langgraph/agents/execution/${executionId}/status`);

    const statusData = response.data;

    // Transform backend response to AgentResult format
    if (statusData.status === 'completed') {
      return {
        executionId,
        agentId: statusData.agentId || statusData.agent_id || 'unknown',
        status: 'completed',
        result: statusData.result ? {
          type: statusData.result.type || 'text',
          content: statusData.result.content || statusData.result,
          metadata: statusData.result.metadata || {}
        } : undefined,
        usage: statusData.cost ? {
          creditsUsed: statusData.cost.credits || 0,
          tokensUsed: statusData.cost.tokens
        } : undefined,
        artifacts: statusData.artifacts || []
      } as AgentResult;
    } else if (statusData.status === 'failed') {
      return {
        executionId,
        agentId: statusData.agentId || statusData.agent_id || 'unknown',
        status: 'failed',
        error: statusData.error || 'Agent execution failed'
      } as AgentResult;
    } else {
      // Still running or unknown status - return partial result
      throw new Error(`Agent execution not completed. Status: ${statusData.status || 'unknown'}`);
    }
  }

  /**
   * Execute image generation using OpenAI Agents SDK
   * @param params - Image generation parameters
   * @returns Image generation response
   */
  async executeImageGenerationSdk(params: {
    prompt?: string;
    description?: string;
    size?: '1024x1024' | '1024x1792' | '1792x1024';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    imageStyle?: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
    learningGroup?: string;
    educationalContext?: string;
    targetAgeGroup?: string;
    subject?: string;
    enhancePrompt?: boolean;
  }): Promise<{
    image_url: string;
    revised_prompt: string;
    enhanced_prompt?: string;
    educational_optimized: boolean;
    title: string;
    tags: string[];
    library_id?: string;
    originalParams: any;
  }> {
    const endpoint = '/agents-sdk/image/generate';

    console.log('[ApiClient] 🚀 executeImageGenerationSdk REQUEST', {
      timestamp: new Date().toISOString(),
      endpoint,
      hasPrompt: !!params.prompt,
      hasDescription: !!params.description,
      params
    });

    try {
      const response = await this.request<{
        success: boolean;
        data: any;
        cost: number;
        metadata: any;
        artifacts: any[];
        timestamp: number;
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      console.log('[ApiClient] ✅ executeImageGenerationSdk RESPONSE', {
        timestamp: new Date().toISOString(),
        success: response.success,
        hasImageUrl: !!response.data?.image_url,
        cost: response.cost
      });

      console.log('[ApiClient] 🔍 DEBUG: Full backend response structure:', {
        responseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : [],
        hasLibraryIdInData: 'library_id' in (response.data || {}),
        libraryIdValue: response.data?.library_id
      });

      console.log('[ApiClient] 🔍 DEBUG: response.data object:', response.data);

      return response.data;
    } catch (error) {
      console.error('[ApiClient] ❌ executeImageGenerationSdk ERROR', {
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStatus: (error as any)?.status
      });
      throw error;
    }
  }

  /**
   * Classify user intent for router agent (Story 3.1.3)
   * @param prompt - User's prompt to classify
   * @param override - Optional manual override ('create_image' | 'edit_image' | 'unknown')
   * @returns Classification result with intent, confidence, and entities
   */
  async classifyIntent(params: {
    prompt: string;
    override?: 'create_image' | 'edit_image' | 'unknown';
  }): Promise<{
    intent: 'create_image' | 'edit_image' | 'unknown';
    confidence: number;
    needsManualSelection: boolean;
    entities: {
      subject?: string;
      gradeLevel?: string;
      topic?: string;
      style?: string;
    };
    reasoning?: string;
    overridden: boolean;
  }> {
    const endpoint = '/agents-sdk/router/classify';

    console.log('[ApiClient] 🔀 classifyIntent REQUEST', {
      timestamp: new Date().toISOString(),
      endpoint,
      promptLength: params.prompt.length,
      hasOverride: !!params.override,
    });

    try {
      const response = await this.request<{
        success: boolean;
        data: {
          intent: 'create_image' | 'edit_image' | 'unknown';
          confidence: number;
          needsManualSelection: boolean;
          entities: {
            subject?: string;
            gradeLevel?: string;
            topic?: string;
            style?: string;
          };
          reasoning?: string;
          overridden: boolean;
        };
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      console.log('[ApiClient] ✅ classifyIntent SUCCESS', {
        timestamp: new Date().toISOString(),
        intent: response.data?.intent,
        confidence: response.data?.confidence,
        needsManualSelection: response.data?.needsManualSelection,
      });

      return response.data;
    } catch (error) {
      console.error('[ApiClient] ❌ classifyIntent ERROR', {
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStatus: (error as any)?.status,
      });
      throw error;
    }
  }

  /**
   * Edit an existing image using Gemini 2.5 Flash Image model
   * @param imageId - Original image ID
   * @param instruction - German instruction (e.g., "Füge 'Klasse 5b' oben rechts hinzu")
   * @param userId - User ID
   * @returns Edited image data with usage information
   */
  async editImage(params: {
    imageId: string;
    instruction: string;
    userId: string;
  }): Promise<{
    editedImage: {
      id: string;
      url: string;
      originalImageId: string;
      editInstruction: string;
      version: number;
      createdAt: Date;
    };
    usage: {
      used: number;
      limit: number;
      remaining: number;
    };
  }> {
    const endpoint = '/images/edit';

    console.log('[ApiClient] 🎨 editImage REQUEST', {
      timestamp: new Date().toISOString(),
      endpoint,
      imageId: params.imageId,
      instructionLength: params.instruction.length,
      userId: params.userId,
    });

    try {
      const response = await this.request<{
        success: boolean;
        data: {
          editedImage: {
            id: string;
            url: string;
            originalImageId: string;
            editInstruction: string;
            version: number;
            createdAt: Date;
          };
          usage: {
            used: number;
            limit: number;
            remaining: number;
          };
        };
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(params),
      });

      console.log('[ApiClient] ✅ editImage SUCCESS', {
        timestamp: new Date().toISOString(),
        editedImageId: response.data?.editedImage?.id,
        version: response.data?.editedImage?.version,
        usageRemaining: response.data?.usage?.remaining,
      });

      return response.data;
    } catch (error) {
      console.error('[ApiClient] ❌ editImage ERROR', {
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStatus: (error as any)?.status,
      });
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default ApiClient;