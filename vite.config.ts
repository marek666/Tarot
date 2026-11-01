import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Tarot Trainer',
        short_name: 'Tarot',
        description: 'Mobilní aplikace pro učení klasických tarotových karet.',
        lang: 'cs',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#07111f',
        background_color: '#07111f',
        categories: ['education'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,js,css,jpg,jpeg,png,svg,ico,webp,webmanifest}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
