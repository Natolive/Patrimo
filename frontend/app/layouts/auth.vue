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
      <!-- Courbe décorative qui se trace à l'arrivée sur la page. -->
      <svg viewBox="0 0 600 180" class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 w-full opacity-60" aria-hidden="true">
        <defs>
          <linearGradient id="brand-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#6ee7b7" stop-opacity=".35" />
            <stop offset="1" stop-color="#6ee7b7" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path class="area" d="M0 150 C60 140 90 120 140 126 S220 96 270 104 S350 60 400 70 S480 30 530 34 S580 14 600 10 V180 H0Z" fill="url(#brand-area)" />
        <path class="line" d="M0 150 C60 140 90 120 140 126 S220 96 270 104 S350 60 400 70 S480 30 530 34 S580 14 600 10" fill="none" stroke="#a7f3d0" stroke-width="3" stroke-linecap="round" pathLength="1" />
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
/* Fond de marque : émeraude profond, plus clair en haut à gauche. */
.brand-panel {
  background:
    radial-gradient(70% 60% at 15% 10%, #059669 0%, transparent 70%),
    linear-gradient(160deg, #064e3b, #022c22);
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
