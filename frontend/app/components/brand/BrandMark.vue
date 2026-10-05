<script setup lang="ts">
// Symbole Patrimo : tuile émeraude, « P » blanc et étincelle de croissance.
// `play` : le P se trace puis l'étincelle surgit (page de connexion, à l'arrivée) ; sinon l'animation rejoue au survol du lien qui le contient.
withDefaults(defineProps<{ play?: boolean }>(), { play: false })
const id = useId()
</script>

<template>
  <svg viewBox="0 0 48 48" class="mark" :class="{ play }" aria-hidden="true">
    <defs>
      <linearGradient :id="`${id}-tile`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#34d399" />
        <stop offset="1" stop-color="#047857" />
      </linearGradient>
      <radialGradient :id="`${id}-glow`" cx="0.3" cy="0.2" r="0.9">
        <stop offset="0" stop-color="#fff" stop-opacity=".28" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="48" height="48" rx="14" :fill="`url(#${id}-tile)`" />
    <rect width="48" height="48" rx="14" :fill="`url(#${id}-glow)`" />
    <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path class="stem" d="M17 36V13" pathLength="1" />
      <path class="bowl" d="M17 13h7.5a8.5 8.5 0 0 1 0 17H17" pathLength="1" />
    </g>
    <circle class="spark" cx="36" cy="12" r="3.6" fill="#a7f3d0" />
  </svg>
</template>

<style scoped>
.mark { overflow: visible; }
.stem, .bowl { stroke-dasharray: 1; }
.spark { transform-box: fill-box; transform-origin: 50% 50%; }

.play .stem, a:hover .stem, a:focus-visible .stem { animation: draw .45s cubic-bezier(.6, 0, .3, 1) both; }
.play .bowl, a:hover .bowl, a:focus-visible .bowl { animation: draw .55s cubic-bezier(.4, 0, .2, 1) .3s both; }
.play .spark, a:hover .spark, a:focus-visible .spark { animation: spark .6s cubic-bezier(.3, 1.6, .5, 1) .75s both; }

@keyframes draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes spark {
  0% { transform: translate(-6px, 6px) scale(0); opacity: 0; }
  60% { transform: translate(1px, -2px) scale(1.25); opacity: 1; }
  100% { transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .stem, .bowl, .spark { animation: none !important; }
}
</style>
