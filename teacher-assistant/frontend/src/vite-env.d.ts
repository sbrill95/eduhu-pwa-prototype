/// <reference types="vite/client" />

// Global constants injected by Vite config
declare const __VITE_TEST_MODE__: boolean;
declare const __VITE_MODE__: string;

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_TEST_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
