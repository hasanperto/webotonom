import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // React ekosistemi tek chunk'ta olmali. Diger paketleri Vite/Rollup
        // otomatik bolsun — manuel bolme TDZ ("Cannot access 'X' before
        // initialization") ve "unstable_now" hatalarina yol aciyordu.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor';
          if (id.includes('framer-motion')) return 'motion';
          if (
            /[/\\]react[/\\]/.test(id) ||
            /[/\\]react-dom[/\\]/.test(id) ||
            /[/\\]scheduler[/\\]/.test(id) ||
            id.includes('react-router') ||
            id.includes('react-helmet-async') ||
            id.includes('react-select') ||
            id.includes('react-icons') ||
            id.includes('use-sync-external-store') ||
            id.includes('@emotion') ||
            id.includes('@floating-ui')
          ) {
            return 'react-vendor';
          }
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
