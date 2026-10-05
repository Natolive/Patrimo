<script setup lang="ts">
import type { HealthDto } from '@pea/shared'

const api = useApi()
const { data, error } = await useAsyncData('health', () => api<HealthDto>('/health'))
</script>

<template>
  <UContainer class="py-12">
    <h1 class="text-2xl font-semibold">PEA</h1>
    <p class="mt-4 flex items-center gap-2">
      API
      <UBadge :color="error ? 'error' : 'success'" :label="error ? 'injoignable' : 'ok'" />
      Base
      <UBadge :color="data?.database ? 'success' : 'error'" :label="data?.database ? 'ok' : 'injoignable'" />
    </p>
  </UContainer>
</template>
