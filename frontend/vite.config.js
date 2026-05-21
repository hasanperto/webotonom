import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor';
          // react + react-dom + scheduler ayni chunk'ta olmali (ayri vendor = unstable_now hatasi)
          if (
            /[/\\]react[/\\]/.test(id) ||
            /[/\\]react-dom[/\\]/.test(id) ||
            /[/\\]scheduler[/\\]/.test(id) ||
            id.includes('react-router') ||
            id.includes('use-sync-external-store')
          ) {
            return 'react-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['jquery', 'lightbox2']
  }
})
