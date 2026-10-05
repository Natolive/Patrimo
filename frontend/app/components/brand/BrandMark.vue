<script setup lang="ts">
// Symbole Patrimo : deux barres de graphique qui montent jusqu'au « P », troisième barre et la plus haute (le portefeuille qui grandit) ; angles vifs, tuile sombre.
// `play` : les barres puis le P montent l'un après l'autre (page de connexion, à l'arrivée) ; sinon l'animation rejoue au survol du lien qui le contient.
withDefaults(defineProps<{ play?: boolean }>(), { play: false })
</script>

<template>
  <svg viewBox="0 0 48 48" class="mark" :class="{ play }" aria-hidden="true">
    <rect width="48" height="48" rx="4" fill="#062019" />
    <rect x=".5" y=".5" width="47" height="47" rx="3.5" fill="none" stroke="#34d399" stroke-opacity=".25" />
    <rect class="rise rise-1" x="8" y="30" width="5.5" height="8" fill="#047857" />
    <rect class="rise rise-2" x="16" y="22" width="5.5" height="16" fill="#10b981" />
    <path class="rise rise-3" fill-rule="evenodd" fill="#6ee7b7" d="M24 10h12.5l3.5 3.5v13L36.5 30h-7v8H24ZM29.5 15.5v9h4.5v-9Z" />
  </svg>
</template>

<style scoped>
.rise { transform-box: fill-box; transform-origin: 50% 100%; }

.play .rise, a:hover .rise, a:focus-visible .rise { animation: rise .4s cubic-bezier(.3, 1.4, .5, 1) both; }
.play .rise-2, a:hover .rise-2, a:focus-visible .rise-2 { animation-delay: .1s; }
.play .rise-3, a:hover .rise-3, a:focus-visible .rise-3 { animation-delay: .2s; }

@keyframes rise {
  from { transform: scaleY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .rise { animation: none !important; }
}
</style>
