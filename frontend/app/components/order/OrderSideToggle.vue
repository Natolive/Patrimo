<script setup lang="ts">
import { TRADE_SIDE_LABELS, TRADE_SIDES, type TradeSide } from '@patrimo/shared'

// Sens de l'opération : Achat en vert, Vente en rouge, Dividende en bleu.
const side = defineModel<TradeSide>({ required: true })
</script>

<template>
  <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Sens de l’opération">
    <UButton
      v-for="s in TRADE_SIDES"
      :key="s"
      :label="TRADE_SIDE_LABELS[s]"
      :icon="SIDE_ICON[s]"
      :color="SIDE_COLOR[s]"
      :variant="side === s ? 'solid' : 'outline'"
      role="radio"
      :aria-checked="side === s"
      size="lg"
      block
      @click="side = s"
    />
  </div>
</template>
