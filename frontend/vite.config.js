import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { PurgeCSS } from 'purgecss'

// Custom PurgeCSS plugin - removes unused CSS classes from production build
function purgeCSSPlugin() {
  return {
    name: 'vite-plugin-purgecss-post',
    apply: 'build',
    enforce: 'post',
    async generateBundle(_, bundle) {
      const cssFiles = Object.entries(bundle).filter(([name]) => name.endsWith('.css'));
      const jsContent = Object.entries(bundle)
        .filter(([name]) => name.endsWith('.js'))
        .map(([_, asset]) => ({ raw: asset.code || String(asset.source || ''), extension: 'js' }));
      const htmlContent = Object.entries(bundle)
        .filter(([name]) => name.endsWith('.html'))
        .map(([_, asset]) => ({ raw: String(asset.source || ''), extension: 'html' }));

      for (const [name, asset] of cssFiles) {
        const original = String(asset.source);
        const purged = await new PurgeCSS().purge({
          content: [...jsContent, ...htmlContent],
          css: [{ raw: original }],
          safelist: {
            // Keep all dynamic class patterns
            standard: [
              /^agent-/, /^animate-/, /^glass-/, /^glow-/, /^gradient-/,
              /^modal/, /^btn-/, /^shimmer/, /^float$/, /^pulse/,
              /^text-/, /^overflow-/, /^touch-/, /^scroll-/,
              /^brand-/, /^strategy-/, /^checklist-/, /^dashboard-/,
              /^mobile-/, /^p-8/, /^text-center/,
              'body', 'html', 'modal-open'
            ],
            deep: [/:root/, /^@keyframes/, /^@media/, /^@font-face/],
            greedy: [/toast/, /Toaster/, /hot-toast/]
          },
          // Match class names including those with colons, slashes (responsive prefixes)
          defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
        });

        if (purged.length > 0 && purged[0].css) {
          const saved = original.length - purged[0].css.length;
          if (saved > 0) {
            console.log(`  [purgecss] ${name}: ${(original.length / 1024).toFixed(1)}KB → ${(purged[0].css.length / 1024).toFixed(1)}KB (saved ${(saved / 1024).toFixed(1)}KB)`);
            asset.source = purged[0].css;
          }
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    }),
    purgeCSSPlugin(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false
    })
  ],
  cacheDir: '.vite/cache',
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      maxWorkers: 1
    },
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            return 'vendor';
          }
          // Split app-level shared modules into their own chunks
          if (id.includes('/data/projectTemplates')) return 'project-templates';
          if (id.includes('/constants')) return 'constants';
        }
      }
    }
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false
  }
})
