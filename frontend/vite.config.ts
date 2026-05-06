import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const wsTarget = process.env.WS_TARGET ?? 'ws://localhost:4001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/socket.io': {
        target: wsTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
