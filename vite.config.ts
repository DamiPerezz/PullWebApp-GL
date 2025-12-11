import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // SECURITY: Remove console.log and debugger statements in production
    // This prevents sensitive information from being exposed in browser DevTools
    minify: 'esbuild',
    sourcemap: false, // Don't expose source maps in production
  },
  esbuild: {
    // Drop console and debugger in production builds
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
