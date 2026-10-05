<template>
  <main class="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
    <!-- Panneau de marque sur grand écran ; en dessous, le logo seul au-dessus du formulaire. -->
    <section class="brand-panel relative isolate hidden flex-col justify-between overflow-hidden p-14 text-white lg:flex">
      <BrandLogo play class="text-3xl [&_.text-highlighted]:text-white" />
      <!-- Marge basse : le texte reste au-dessus de la courbe. -->
      <div class="pb-36">
        <h2 class="font-display text-5xl leading-[1.05] font-bold tracking-tight xl:text-6xl">Ton portefeuille,<br>en clair.</h2>
        <p class="mt-6 max-w-sm text-lg text-white/75">Opérations, plus-values, tendances et actualités de tes valeurs, au même endroit.</p>
      </div>
      <!-- Graphique décoratif (ligne brisée, comme un cours) qui se trace à l'arrivée sur la page. -->
      <svg viewBox="0 0 600 180" class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 w-full opacity-60" aria-hidden="true">
        <defs>
          <linearGradient id="brand-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#6ee7b7" stop-opacity=".35" />
            <stop offset="1" stop-color="#6ee7b7" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path class="area" d="M0 152 L40 146 L70 150 L110 132 L140 138 L180 118 L210 124 L250 100 L280 108 L320 84 L350 92 L390 66 L420 74 L460 50 L490 58 L530 34 L560 40 L600 12 V180 H0Z" fill="url(#brand-area)" />
        <path class="line" d="M0 152 L40 146 L70 150 L110 132 L140 138 L180 118 L210 124 L250 100 L280 108 L320 84 L350 92 L390 66 L420 74 L460 50 L490 58 L530 34 L560 40 L600 12" fill="none" stroke="#6ee7b7" stroke-width="2.5" stroke-linejoin="miter" pathLength="1" />
      </svg>
    </section>

    <section class="flex items-center justify-center px-4 py-12 sm:px-10">
      <div class="w-full max-w-sm">
        <BrandLogo play class="mb-12 text-2xl lg:hidden" />
        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Fond de marque : la tuile du logo, quadrillage discret et lueur émeraude en haut à gauche. */
.brand-panel {
  background:
    radial-gradient(60% 50% at 10% 0%, rgb(16 185 129 / .35), transparent 70%),
    linear-gradient(rgb(52 211 153 / .06) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(90deg, rgb(52 211 153 / .06) 1px, transparent 1px) 0 0 / 48px 48px,
    #03140f;
}

.line {
  stroke-dasharray: 1;
  animation: draw 1.6s cubic-bezier(.4, 0, .2, 1) .6s both;
}
.area {
  animation: fade 1s ease-out 1.6s both;
}
@keyframes draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
@keyframes fade {
  from { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .line, .area { animation: none; }
}
</style>
