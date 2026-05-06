import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Targets são lidos em runtime pelo processo Node/Bun do Vite (server-side),
// por isso usam process.env em vez de import.meta.env.
const apiTarget = process.env.API_TARGET ?? 'http://localhost:8000';
const wsTarget  = process.env.WS_TARGET  ?? 'ws://localhost:4001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: wsTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
