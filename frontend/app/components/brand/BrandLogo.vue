<script setup lang="ts">
// Logo complet : symbole + nom en minuscules. `play` : animation à l'affichage (connexion) ; sinon au survol du lien parent.
defineProps<{ play?: boolean }>()
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <BrandMark :play="play" class="size-[1.6em] shrink-0" />
    <span class="font-display text-highlighted font-bold tracking-[-.035em]">patrimo</span>
  </span>
</template>
