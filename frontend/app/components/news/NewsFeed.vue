<script setup lang="ts">
import type { FeedItemDto } from '@pea/shared'

// Fil de l'accueil (bandeau latéral) : actualités de toutes les valeurs suivies, avec les valeurs que chacune concerne.
// Pas de photo d'article (le flux n'en donne pas) : logo de l'éditeur à la place.
const api = useApi()
const { data, status } = useAsyncData('news-feed', () => api<FeedItemDto[]>('/watches/news'), { lazy: true })
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 xl:max-h-[calc(100dvh-14rem)] xl:overflow-y-auto' }">
    <template #header>
      <h2 class="text-highlighted flex items-center gap-2 font-semibold"><UIcon name="i-lucide-newspaper" class="size-5" />Actualités</h2>
      <p class="text-muted text-sm">De tes valeurs suivies ; mots-clés modifiables sur leur fiche.</p>
    </template>

    <p v-if="status === 'pending' && !data" class="text-muted p-4">Recherche des actualités…</p>
    <p v-else-if="!data?.length" class="text-muted p-4">Aucune actualité : suis une valeur pour voir les siennes ici.</p>
    <NewsList v-else :items="data" />

    <template #footer>
      <p class="text-dimmed text-xs">Via Google Actualités. De l’information, pas un conseil d’investissement.</p>
    </template>
  </UCard>
</template>
