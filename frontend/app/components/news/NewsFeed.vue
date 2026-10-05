<script setup lang="ts">
import type { FeedItemDto } from '@pea/shared'

// Fil de l'accueil en carrousel : actualités de toutes les valeurs suivies, avec les valeurs que chacune concerne.
// Pas de photo d'article (le flux n'en donne pas) : logo de l'éditeur à la place.
const api = useApi()
const { data, status } = useAsyncData('news-feed', () => api<FeedItemDto[]>('/watches/news'), { lazy: true })

// Nom court pour l'étiquette : « Amundi PEA Monde (MSCI World) UCITS ETF » → « PEA Monde (MSCI World) ».
const shortName = (name: string) => name.replace(/^Amundi\s+/i, '').replace(/\s+UCITS.*$/i, '').split(/,| - /)[0]
const logo = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-highlighted font-semibold">Actualités de tes valeurs</h2>
      <p class="text-muted text-sm">Mots-clés modifiables sur la fiche de chaque valeur.</p>
    </template>

    <p v-if="status === 'pending' && !data" class="text-muted">Recherche des actualités…</p>
    <p v-else-if="!data?.length" class="text-muted">Aucune actualité : suis une valeur pour voir les siennes ici.</p>
    <UCarousel
      v-else
      v-slot="{ item }"
      :items="data"
      arrows
      dots
      :prev="{ color: 'neutral', variant: 'outline' }"
      :next="{ color: 'neutral', variant: 'outline' }"
      :ui="{ item: 'flex basis-full sm:basis-1/2 lg:basis-1/3', container: 'items-stretch py-1', dots: '-bottom-6', prev: 'sm:-start-4', next: 'sm:-end-4' }"
      class="mb-8 px-1"
    >
      <article class="border-default bg-default flex w-full flex-col rounded-lg border p-4">
        <p class="text-muted flex items-center gap-2 text-sm">
          <img v-if="item.sourceDomain" :src="logo(item.sourceDomain)" alt="" width="20" height="20" class="size-5 rounded-sm" loading="lazy">
          <UIcon v-else name="i-lucide-newspaper" class="size-5" />
          <span class="truncate">{{ item.source }}</span>
          <span class="shrink-0">· {{ ago(item.publishedAt) }}</span>
        </p>
        <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-highlighted hover:text-primary mt-3 line-clamp-3 font-semibold leading-snug">
          {{ item.title }}
        </a>
        <div class="mt-auto flex flex-wrap gap-1.5 pt-4">
          <NuxtLink v-for="asset in item.assets" :key="asset.symbol" :to="`/assets/${encodeURIComponent(asset.symbol)}`">
            <UBadge :label="shortName(asset.name)" color="neutral" variant="subtle" size="sm" class="hover:ring-primary" />
          </NuxtLink>
        </div>
      </article>
    </UCarousel>

    <template #footer>
      <p class="text-dimmed text-xs">Via Google Actualités. De l’information, pas un conseil d’investissement.</p>
    </template>
  </UCard>
</template>
