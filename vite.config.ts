import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const basePath = process.env.GITHUB_PAGES === 'true' ? '/simple-finance/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'app-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Simple Finance',
        short_name: 'Finance',
        description: 'Finanzas personales privadas, locales e instalables.',
        lang: 'es',
        start_url: basePath,
        scope: basePath,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#062633',
        background_color: '#062633',
        icons: [
          {
            src: `${basePath}app-icon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: `${basePath}apple-touch-icon.png`,
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        skipWaiting: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
