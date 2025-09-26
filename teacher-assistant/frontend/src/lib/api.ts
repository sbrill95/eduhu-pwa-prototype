// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:8081/api'
);

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Chat endpoints
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChatModels(): Promise<{ models: ChatModel[]; default: string }> {
    return this.request<{ models: ChatModel[]; default: string }>('/chat/models');
  }

  async getChatHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    return this.request<{ status: 'healthy' | 'unhealthy'; message?: string }>('/chat/health');
  }
}

export const apiClient = new ApiClient();
export default ApiClient;