import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/v1/events': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
