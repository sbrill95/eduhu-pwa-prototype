export interface ImageGenerationRequest {
    description: string;
    imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
}
export interface ImageGenerationResponse {
    success: boolean;
    data: {
        imageUrl: string;
        prompt: string;
        generatedAt: string;
        title?: string;
        tags?: string[];
    };
    error?: string;
}
export interface ChatMessageRequest {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
    userId: string;
    sessionId?: string;
}
export interface ChatMessageResponse {
    content: string;
    agentSuggestion?: {
        agentType: 'image-generation' | 'worksheet-generation';
        reasoning: string;
        prefillData: Record<string, any>;
    };
    sessionId: string;
}
export interface ProfileExtractionRequest {
    userId: string;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
}
export interface ProfileExtractionResponse {
    characteristics: Array<{
        category: string;
        value: string;
        confidence: number;
    }>;
}
export interface MaterialUploadRequest {
    userId: string;
    title: string;
    type: 'image' | 'worksheet' | 'presentation' | 'document';
    fileData: string;
    tags?: string[];
    description?: string;
}
export interface MaterialUploadResponse {
    success: boolean;
    data?: {
        materialId: string;
        url: string;
    };
    error?: string;
}
export interface AgentExecutionRequest {
    agentId: string;
    input: string | Record<string, any>;
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
}
export interface AgentExecutionResponse {
    success: boolean;
    data?: {
        execution_preview?: {
            agent_id: string;
            agent_name: string;
            can_execute: boolean;
            requires_confirmation: boolean;
        };
        result?: Record<string, any>;
    };
    error?: string;
}
export declare const isImageGenerationRequest: (data: any) => data is ImageGenerationRequest;
export declare const isChatMessageRequest: (data: any) => data is ChatMessageRequest;
//# sourceMappingURL=api-contracts.d.ts.map