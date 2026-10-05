<script setup lang="ts">
import { MARKETS, marketStatus } from '@pea/shared'

// Ouverture d'Euronext Paris (où se traitent les ETF du PEA) et de Wall Street (qui fait bouger les ETF US et Monde),
// en heure locale du navigateur ; recalculée chaque minute.
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => (now.value = new Date()), 60_000)))
onBeforeUnmount(() => clearInterval(timer))

const time = (date: Date) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
const dayKey = (date: Date) => date.toDateString()

// « aujourd'hui » omis, « demain », sinon le jour de la semaine.
function when(date: Date) {
  if (dayKey(date) === dayKey(now.value)) return ''
  const tomorrow = new Date(now.value)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dayKey(date) === dayKey(tomorrow)) return 'demain '
  return `${new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date)} `
}

function countdown(date: Date) {
  const minutes = Math.max(1, Math.round((date.getTime() - now.value.getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ${String(minutes % 60).padStart(2, '0')}`
  return `${Math.round(hours / 24)} j`
}

const markets = computed(() =>
  Object.values(MARKETS).map((market) => {
    const { open, nextChange } = marketStatus(market, now.value)
    return {
      name: market.name,
      open,
      detail: open ? `ferme à ${time(nextChange)}` : `ouvre ${when(nextChange)}à ${time(nextChange)}`,
      countdown: countdown(nextChange),
    }
  }),
)
</script>

<template>
  <ul class="flex flex-wrap gap-2" aria-label="Ouverture des marchés">
    <li v-for="m in markets" :key="m.name" class="border-default bg-default flex items-center gap-2 rounded-full border py-1 ps-1.5 pe-3 text-sm">
      <UBadge :label="m.open ? 'Ouvert' : 'Fermé'" :color="m.open ? 'success' : 'neutral'" :icon="m.open ? 'i-lucide-circle-play' : 'i-lucide-circle-pause'" variant="subtle" class="rounded-full" />
      <span class="text-highlighted font-medium">{{ m.name }}</span>
      <span class="text-muted">{{ m.detail }} · dans {{ m.countdown }}</span>
    </li>
  </ul>
</template>
