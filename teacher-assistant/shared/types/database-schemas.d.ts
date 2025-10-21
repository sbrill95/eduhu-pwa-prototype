export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    user_id: string;
    session_id: string;
    message_index: number;
    timestamp: Date;
    created_at: Date;
    metadata?: Record<string, any>;
}
export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    message_count: number;
}
export interface UserProfile {
    id: string;
    user_id: string;
    display_name?: string;
    email?: string;
    created_at: Date;
    updated_at: Date;
}
export interface TeacherCharacteristic {
    id: string;
    user_id: string;
    category: string;
    value: string;
    confidence: number;
    extracted_at: Date;
    source_session_id?: string;
}
export interface GeneratedArtifact {
    id: string;
    user_id: string;
    artifact_type: 'image' | 'worksheet' | 'presentation' | 'document';
    title: string;
    description?: string;
    file_url: string;
    thumbnail_url?: string;
    tags?: string[];
    created_at: Date;
    session_id?: string;
    generator_agent?: string;
}
export interface ContextItem {
    id: string;
    user_id: string;
    name: string;
    type: 'subject' | 'class' | 'topic' | 'custom';
    value: string;
    created_at: Date;
}
export declare const isChatMessage: (data: any) => data is ChatMessage;
export declare const isGeneratedArtifact: (data: any) => data is GeneratedArtifact;
//# sourceMappingURL=database-schemas.d.ts.map