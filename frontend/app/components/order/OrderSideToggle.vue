<script setup lang="ts">
import { TRADE_SIDE_LABELS, type TradeSide } from '@patrimo/shared'

// Sens de l'ordre : Achat en vert, Vente en rouge.
const side = defineModel<TradeSide>({ required: true })
</script>

<template>
  <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Sens de l’opération">
    <UButton
      v-for="s in (['buy', 'sell'] as const)"
      :key="s"
      :label="TRADE_SIDE_LABELS[s]"
      :icon="s === 'buy' ? 'i-lucide-arrow-down-to-line' : 'i-lucide-arrow-up-from-line'"
      :color="s === 'buy' ? 'success' : 'error'"
      :variant="side === s ? 'solid' : 'outline'"
      role="radio"
      :aria-checked="side === s"
      size="lg"
      block
      @click="side = s"
    />
  </div>
</template>
