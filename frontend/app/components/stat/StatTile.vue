<script setup lang="ts">
// Chiffre clé : libellé, valeur, et variation signée (couleur selon le sens, toujours avec son signe).
defineProps<{ label: string, value: string, delta?: string, deltaValue?: number, hint?: string }>()
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <p class="text-muted text-sm">{{ label }}</p>
    <p class="text-highlighted mt-1 text-2xl font-semibold">{{ value }}</p>
    <p v-if="delta" class="mt-1 text-sm font-medium tabular-nums" :class="gainClass(deltaValue ?? 0)">{{ delta }}</p>
    <p v-if="hint" class="text-muted mt-1 text-sm">{{ hint }}</p>
  </UCard>
</template>
