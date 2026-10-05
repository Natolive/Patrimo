<script setup lang="ts">
import type { FeedItemDto, NewsItemDto } from '@pea/shared'

// Liste d'articles du bandeau latéral (accueil et fiche d'une valeur) : logo de l'éditeur, titre, valeurs concernées si connues.
defineProps<{ items: (NewsItemDto & Partial<Pick<FeedItemDto, 'assets'>>)[] }>()

// Nom court pour l'étiquette : « Amundi PEA Monde (MSCI World) UCITS ETF » → « PEA Monde (MSCI World) ».
const shortName = (name: string) => name.replace(/^Amundi\s+/i, '').replace(/\s+UCITS.*$/i, '').split(/,| - /)[0]
const logo = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
</script>

<template>
  <ul class="divide-default divide-y">
    <li v-for="item in items" :key="item.url" class="p-4">
      <p class="text-muted flex items-center gap-2 text-xs">
        <img v-if="item.sourceDomain" :src="logo(item.sourceDomain)" alt="" width="16" height="16" class="size-4 rounded-sm" loading="lazy">
        <UIcon v-else name="i-lucide-newspaper" class="size-4" />
        <span class="truncate">{{ item.source }}</span>
        <span class="shrink-0">· {{ ago(item.publishedAt) }}</span>
      </p>
      <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-highlighted hover:text-primary mt-1.5 line-clamp-3 block text-sm font-medium leading-snug">
        {{ item.title }}
      </a>
      <div v-if="item.assets?.length" class="mt-2 flex flex-wrap gap-1">
        <NuxtLink v-for="asset in item.assets" :key="asset.symbol" :to="`/assets/${encodeURIComponent(asset.symbol)}`">
          <UBadge :label="shortName(asset.name)" color="neutral" variant="subtle" size="sm" />
        </NuxtLink>
      </div>
    </li>
  </ul>
</template>
