import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  console.log(`🔧 Vite starting in mode: "${mode}"`);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },
    // Inject global constants at build time
    define: {
      '__VITE_TEST_MODE__': JSON.stringify(mode === 'test'),
      '__VITE_MODE__': JSON.stringify(mode)
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3006',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
