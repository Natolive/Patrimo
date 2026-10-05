// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: { apiUrl: '' },
  },
  // Prod : l'API passe par le front (/api), un seul domaine.
  $production: {
    routeRules: { '/api/**': { proxy: 'http://backend:3000/**' } },
  },
})
