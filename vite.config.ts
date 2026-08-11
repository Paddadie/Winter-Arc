import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Doit correspondre exactement au nom du repo GitHub pour le déploiement
  // sur GitHub Pages (https://<user>.github.io/Winter-Arc/).
  base: '/Winter-Arc/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // on gère nous-mêmes le bouton "Mettre à jour" (étape 11)
      injectRegister: false, // enregistrement fait à la main via useRegisterSW (bandeau custom)
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Suivi personnel',
        short_name: 'Suivi',
        description: 'Suivi de régime et d’apnée',
        theme_color: '#123542',
        background_color: '#F5F7F7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Winter-Arc/',
        scope: '/Winter-Arc/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
