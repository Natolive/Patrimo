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
      meta: [{ name: 'theme-color', content: '#059669' }],
    },
  },
  modules: ['@nuxt/ui'],
  // Thème clair uniquement : la palette des graphiques est validée sur fond clair.
  ui: { colorMode: false },
  css: ['~/assets/css/main.css'],
  // Sora (géométrique, style fintech) pour le nom et les titres ; texte courant dans la police de Nuxt UI.
  fonts: { families: [{ name: 'Sora', provider: 'google', weights: [600, 700] }] },
  runtimeConfig: {
    public: { apiUrl: '' },
  },
  // Prod : l'API passe par le front (/api), un seul domaine.
  $production: {
    routeRules: { '/api/**': { proxy: 'http://backend:3000/**' } },
  },
})
