<script setup lang="ts">
import type { TrendSignal } from '@patrimo/shared'

const props = defineProps<{ signal: TrendSignal | null }>()

const badge = computed(() => ({
  up: { label: 'Haussière', color: 'success', icon: 'i-lucide-trending-up' },
  down: { label: 'Baissière', color: 'error', icon: 'i-lucide-trending-down' },
  neutral: { label: 'Neutre', color: 'neutral', icon: 'i-lucide-move-right' },
} as const)[props.signal ?? 'neutral'])
</script>

<template>
  <UBadge v-if="signal" :label="badge.label" :color="badge.color" :icon="badge.icon" variant="subtle" />
  <span v-else class="text-muted text-sm">Historique court</span>
</template>
