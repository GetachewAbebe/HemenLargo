import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Content-Security-Policy for production builds only (the dev server needs inline
// scripts for hot reload). Network access is limited to this app's Supabase project.
const buildCsp = (supabaseUrl) => {
  let supabaseOrigins = 'https://*.supabase.co wss://*.supabase.co'
  try {
    const { host } = new URL(supabaseUrl)
    supabaseOrigins = `https://${host} wss://${host}`
  } catch {
    // Missing URL: fall back to any Supabase project; the CI workflow requires one anyway.
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${supabaseOrigins}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

const cspPlugin = (supabaseUrl) => ({
  name: 'sukie-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: buildCsp(supabaseUrl) },
      injectTo: 'head-prepend',
    },
  ],
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), cspPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_SUPABASE_URL)],
  base: './',
  build: {
    manifest: 'asset-manifest.json',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}))
