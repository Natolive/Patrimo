<script setup lang="ts">
import type { FeedItemDto } from '@pea/shared'

// Fil de l'accueil (bandeau latéral) : actualités de toutes les valeurs suivies, avec les valeurs que chacune concerne.
// Pas de photo d'article (le flux n'en donne pas) : logo de l'éditeur à la place.
const api = useApi()
const { data, status } = useAsyncData('news-feed', () => api<FeedItemDto[]>('/watches/news'), { lazy: true })

// Nom court pour l'étiquette : « Amundi PEA Monde (MSCI World) UCITS ETF » → « PEA Monde (MSCI World) ».
const shortName = (name: string) => name.replace(/^Amundi\s+/i, '').replace(/\s+UCITS.*$/i, '').split(/,| - /)[0]
const logo = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 xl:max-h-[calc(100dvh-14rem)] xl:overflow-y-auto' }">
    <template #header>
      <h2 class="text-highlighted flex items-center gap-2 font-semibold"><UIcon name="i-lucide-newspaper" class="size-5" />Actualités</h2>
      <p class="text-muted text-sm">De tes valeurs suivies ; mots-clés modifiables sur leur fiche.</p>
    </template>

    <p v-if="status === 'pending' && !data" class="text-muted p-4">Recherche des actualités…</p>
    <p v-else-if="!data?.length" class="text-muted p-4">Aucune actualité : suis une valeur pour voir les siennes ici.</p>
    <ul v-else class="divide-default divide-y">
      <li v-for="item in data" :key="item.url" class="p-4">
        <p class="text-muted flex items-center gap-2 text-xs">
          <img v-if="item.sourceDomain" :src="logo(item.sourceDomain)" alt="" width="16" height="16" class="size-4 rounded-sm" loading="lazy">
          <UIcon v-else name="i-lucide-newspaper" class="size-4" />
          <span class="truncate">{{ item.source }}</span>
          <span class="shrink-0">· {{ ago(item.publishedAt) }}</span>
        </p>
        <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-highlighted hover:text-primary mt-1.5 line-clamp-3 block text-sm font-medium leading-snug">
          {{ item.title }}
        </a>
        <div class="mt-2 flex flex-wrap gap-1">
          <NuxtLink v-for="asset in item.assets" :key="asset.symbol" :to="`/assets/${encodeURIComponent(asset.symbol)}`">
            <UBadge :label="shortName(asset.name)" color="neutral" variant="subtle" size="sm" />
          </NuxtLink>
        </div>
      </li>
    </ul>

    <template #footer>
      <p class="text-dimmed text-xs">Via Google Actualités. De l’information, pas un conseil d’investissement.</p>
    </template>
  </UCard>
</template>
