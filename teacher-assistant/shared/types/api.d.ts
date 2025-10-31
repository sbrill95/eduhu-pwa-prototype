import { ImageGenerationPrefillData } from './agents';
export interface ApiResponse<T = Record<string, unknown>> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    details?: unknown;
    metadata?: Record<string, unknown>;
    timestamp: string;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    metadata?: {
        agentSuggestion?: {
            agentType: string;
            reasoning: string;
            prefillData: Record<string, unknown>;
        };
    };
}
export interface ChatResponse extends ApiResponse {
    success: true;
    data: {
        message: string;
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
        model: string;
        finish_reason: string;
        agentSuggestion?: {
            agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
            reasoning: string;
            prefillData: ImageGenerationPrefillData | Record<string, unknown>;
        };
    };
}
export interface Message {
    id: string;
    author?: string;
    chat_id?: string;
    content?: string;
    content_type?: string;
    educational_topics?: unknown;
    is_edited?: boolean;
    message_index?: number;
    metadata?: string | null;
    response_time_ms?: number;
    role?: string;
    session?: string;
    session_id?: string;
    timestamp?: number;
    token_count?: number;
    user_id?: string;
}
export interface LibraryMaterial {
    id: string;
    content?: string;
    created_at?: number;
    description?: string;
    is_favorite?: boolean;
    metadata?: string | null;
    source_session_id?: string;
    tags?: string;
    title?: string;
    type?: string;
    updated_at?: number;
    usage_count?: number;
    user_id?: string;
}
//# sourceMappingURL=api.d.ts.map