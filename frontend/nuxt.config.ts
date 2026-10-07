// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  app: {
    // Pages à racine unique (sinon la transition casse).
    pageTransition: { name: 'page', mode: 'out-in' },
    // Nom de l'appli en suffixe de chaque titre d'onglet (une page donne seulement son titre).
    head: {
      titleTemplate: '%s · Patrimo',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // viewport-fit=cover : la barre d'onglets mobile peut tenir compte de la zone de geste (safe-area).
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#062019' },
      ],
    },
  },
  modules: ['@nuxt/ui'],
  // Thème clair uniquement : la palette des graphiques est validée sur fond clair.
  ui: { colorMode: false },
  css: ['~/assets/css/main.css'],
  // Space Grotesk (géométrique, technique) pour le nom et les titres ; texte courant dans la police de Nuxt UI.
  fonts: { families: [{ name: 'Space Grotesk', provider: 'google', weights: [600, 700] }] },
  runtimeConfig: {
    public: { apiUrl: '' },
  },
  // Prod : l'API passe par le front (/api), un seul domaine.
  $production: {
    routeRules: { '/api/**': { proxy: 'http://patrimo-api:3000/**' } },
  },
})
