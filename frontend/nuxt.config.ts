// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  app: {
    // Pages à racine unique (sinon la transition casse).
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  modules: ['@nuxt/ui'],
  // Thème clair uniquement : la palette des graphiques est validée sur fond clair.
  ui: { colorMode: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: { apiUrl: '' },
  },
  // Prod : l'API passe par le front (/api), un seul domaine.
  $production: {
    routeRules: { '/api/**': { proxy: 'http://backend:3000/**' } },
  },
})
