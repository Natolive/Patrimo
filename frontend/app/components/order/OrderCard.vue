<script setup lang="ts">
import type { TradeSide } from '@patrimo/shared'

// Encart « Passer un ordre » de la fiche d'une valeur ; `?side=sell` dans l'adresse présélectionne la vente.
defineProps<{ symbol: string, price: number }>()
const route = useRoute()
const side = computed<TradeSide>(() => (route.query.side === 'sell' ? 'sell' : 'buy'))
const { bump } = useDataVersion()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-highlighted flex items-center gap-2 font-semibold"><UIcon name="i-lucide-arrow-left-right" class="size-5" />Passer un ordre</h2>
      <p class="text-muted text-sm">Enregistre un achat ou une vente fait chez ton courtier.</p>
    </template>
    <OrderForm :key="side" :asset="symbol" :side="side" :price="price" @saved="bump" />
  </UCard>
</template>
