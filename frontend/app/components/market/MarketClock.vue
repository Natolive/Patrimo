<script setup lang="ts">
import { ASIAN_MARKETS, MARKETS, marketStatus, sessionStatus, type MarketSessionDto } from '@patrimo/shared'

// Ouverture des places qui comptent pour un portefeuille européen, en heure locale du navigateur, recalculée chaque minute :
// Euronext Paris et Wall Street calculés sur place ; places asiatiques (ETF Émergents) d'après la séance lue chez Yahoo.
const now = ref(new Date())
const api = useApi()
const { data: sessions, refresh } = useAsyncData('market-sessions', () => api<MarketSessionDto[]>('/markets/sessions'), { lazy: true })
let tick: ReturnType<typeof setInterval> | undefined
let reload: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  tick = setInterval(() => (now.value = new Date()), 60_000)
  // Séances relues comme les cours (10 min) : la suivante est connue de Yahoo une fois la précédente finie.
  reload = setInterval(() => refresh(), 10 * 60_000)
})
onBeforeUnmount(() => {
  clearInterval(tick)
  clearInterval(reload)
})

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

type State = 'open' | 'lunch' | 'closed'
interface Chip { name: string, state: State, detail: string }
const BADGES: Record<State, { label: string, color: 'success' | 'warning' | 'neutral', icon: string }> = {
  open: { label: 'Ouvert', color: 'success', icon: 'i-lucide-circle-play' },
  lunch: { label: 'Pause', color: 'warning', icon: 'i-lucide-coffee' },
  closed: { label: 'Fermé', color: 'neutral', icon: 'i-lucide-circle-pause' },
}

const main = computed<Chip[]>(() =>
  Object.values(MARKETS).map((market) => {
    const { open, nextChange } = marketStatus(market, now.value)
    const verb = open ? `ferme à ${time(nextChange)}` : `ouvre ${when(nextChange)}à ${time(nextChange)}`
    return { name: market.name, state: open ? 'open' : 'closed', detail: `${verb} · dans ${countdown(nextChange)}` }
  }),
)

const asia = computed<Chip[]>(() =>
  (sessions.value ?? []).flatMap((session) => {
    const market = ASIAN_MARKETS.find((m) => m.key === session.key)
    if (!market) return []
    const { state, nextChange, guess, lastSession } = sessionStatus(market, session, now.value)
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: market.timeZone }).format(now.value)
    let detail: string
    if (state === 'lunch') detail = `reprend à ${time(nextChange!)} · dans ${countdown(nextChange!)}`
    else if (state === 'open') detail = `${nextChange! < new Date(session.end) ? 'pause' : 'ferme'} à ${time(nextChange!)} · dans ${countdown(nextChange!)}`
    else if (nextChange) detail = `ouvre ${when(nextChange)}à ${time(nextChange)} · dans ${countdown(nextChange)}`
    // Séance du jour finie : prochaine ouverture habituelle, sous réserve d'un jour férié.
    else if (lastSession === today) detail = `ouvre normalement ${when(guess!)}à ${time(guess!)}`
    else detail = `jour férié · dernière séance le ${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(lastSession))}`
    return [{ name: market.name, state, detail }]
  }),
)
</script>

<template>
  <div class="space-y-2" role="group" aria-label="Ouverture des marchés">
    <ul class="flex flex-wrap gap-2">
      <li v-for="m in main" :key="m.name" class="border-default bg-default flex items-center gap-2 rounded-full border py-1 ps-1.5 pe-3 text-sm">
        <UBadge v-bind="BADGES[m.state]" variant="subtle" class="rounded-full" />
        <span class="text-highlighted font-medium">{{ m.name }}</span>
        <span class="text-muted">{{ m.detail }}</span>
      </li>
    </ul>
    <div v-if="asia.length" class="flex flex-wrap items-center gap-2">
      <span class="text-muted text-xs font-medium">Asie · ETF Émergents</span>
      <ul class="flex flex-wrap gap-2">
        <li v-for="m in asia" :key="m.name" class="border-default bg-default flex items-center gap-2 rounded-full border py-0.5 ps-1 pe-2.5 text-xs">
          <UBadge v-bind="BADGES[m.state]" variant="subtle" size="sm" class="rounded-full" />
          <span class="text-highlighted font-medium">{{ m.name }}</span>
          <span class="text-muted">{{ m.detail }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
