import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import compression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    // SWC for fast compilation
    react(),

    // PERFORMANCE: Gzip compression (most compatible)
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false,
    }),

    // PERFORMANCE: Brotli compression (better ratio, modern browsers)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),

    // Bundle analyzer - only in analyze mode
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),

  build: {
    // PERFORMANCE: Target modern browsers for smaller bundles
    target: 'es2022',

    // SECURITY: Remove console.log and debugger statements in production
    minify: 'esbuild',
    sourcemap: false,

    // PERFORMANCE: Increase chunk size warning limit
    chunkSizeWarningLimit: 250,

    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically to avoid circular dependency issues
        manualChunks: {
          // Only separate truly independent heavy libraries
          'vendor': ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
          'vendor-stripe': ['@stripe/stripe-js'],
          'vendor-mapbox': ['mapbox-gl'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp|avif)$/)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (assetInfo.name?.match(/\.(woff2?|eot|ttf|otf)$/)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },

    // PERFORMANCE: CSS optimizations
    cssCodeSplit: true,
    cssMinify: 'lightningcss',

    // PERFORMANCE: Inline small assets (< 4KB)
    assetsInlineLimit: 4096,

    // PERFORMANCE: Report compressed sizes
    reportCompressedSize: true,
  },

  esbuild: {
    // SECURITY: Drop console and debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // PERFORMANCE: Remove legal comments
    legalComments: 'none',
    // PERFORMANCE: Minify identifiers
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },

  // PERFORMANCE: Dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'i18next',
      'react-i18next',
    ],
    // Heavy deps - exclude from pre-bundling
    exclude: ['mapbox-gl'],
    // PERFORMANCE: Force ESM for better tree-shaking
    esbuildOptions: {
      target: 'es2022',
    },
  },

  // PERFORMANCE: CSS configuration
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
    },
    // PERFORMANCE: Use Lightning CSS for faster builds
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 100,
        firefox: 100,
        safari: 15,
      },
    },
  },

  // PERFORMANCE: Dev server configuration
  server: {
    port: 5173,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
    // PERFORMANCE: Enable compression in dev
    middlewareMode: false,
    // Proxy API requests to local backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // PERFORMANCE: Preview server (production simulation)
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },

  // PERFORMANCE: JSON handling
  json: {
    stringify: true, // Smaller JSON in bundle
  },
}))
