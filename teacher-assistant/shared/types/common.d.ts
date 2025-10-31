export interface ApiError {
    success: false;
    error: string;
    details?: string;
    timestamp: string;
}
export interface ApiSuccess<T = any> {
    success: true;
    data: T;
    timestamp?: string;
}
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface SearchParams {
    query: string;
    filters?: Record<string, any>;
    limit?: number;
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    query: string;
}
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    status: LoadingState;
}
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
}
export interface FileUploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
}
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'auto';
    language?: 'de' | 'en';
    notifications?: boolean;
}
export type Required<T> = {
    [P in keyof T]-?: T[P];
};
export type PickByType<T, U> = {
    [P in keyof T as T[P] extends U ? P : never]: T[P];
};
export type NonNullable<T> = T extends null | undefined ? never : T;
//# sourceMappingURL=common.d.ts.map