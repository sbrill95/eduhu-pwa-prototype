// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'
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

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Use default error message if parsing fails
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  // Chat endpoints
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChatModels(): Promise<{ models: ChatModel[]; default: string }> {
    return this.request<{ models: ChatModel[]; default: string }>('/api/chat/models');
  }

  async getChatHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    return this.request<{ status: 'healthy' | 'unhealthy'; message?: string }>('/api/chat/health');
  }
}

export const apiClient = new ApiClient();
export default ApiClient;