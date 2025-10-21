export interface ImageGenerationPrefillData {
    description: string;
    imageStyle?: 'realistic' | 'cartoon' | 'illustrative' | 'abstract';
    learningGroup?: string;
    subject?: string;
    [key: string]: unknown;
}
export interface AgentSuggestion {
    agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
    reasoning: string;
    prefillData: ImageGenerationPrefillData | Record<string, unknown>;
}
export interface AgentParams {
    prompt?: string;
    userId?: string;
    sessionId?: string;
    [key: string]: unknown;
}
export interface AgentResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
    cost?: number;
    metadata?: Record<string, unknown>;
    artifacts?: Array<unknown>;
}
//# sourceMappingURL=agents.d.ts.map