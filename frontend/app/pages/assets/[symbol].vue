<script setup lang="ts">
import { TRADE_SIDE_LABELS, type AssetDto, type CandlesDto, type PriceTickDto, type PurchaseDto, type TrendPeriod, type WatchDto } from '@patrimo/shared'

const route = useRoute()
const symbol = computed(() => String(route.params.symbol))
const api = useApi()
const { data, error, refresh } = await useAsyncData(`asset:${symbol.value}`, () => api<AssetDto>(`/portfolio/${encodeURIComponent(symbol.value)}`))
useHead({ title: () => data.value?.name ?? symbol.value })

// Périodes du graphique : 1J à 1M en intraday ; 6M à 5A sur les séances de 5 ans, cadrées sur la période (zoom libre ensuite).
const PERIODS = [
  { label: '1J', range: '1d', step: 300 },
  { label: '5J', range: '5d', step: 900 },
  { label: '1M', range: '1mo', step: 3600 },
  { label: '6M', range: '5y', step: 86_400, months: 6 },
  { label: '1A', range: '5y', step: 86_400, months: 12 },
  { label: '5A', range: '5y', step: 86_400 },
] as const
const period = ref<(typeof PERIODS)[number]['label']>('1J')
const current = computed(() => PERIODS.find((p) => p.label === period.value)!)
const { data: series } = useAsyncData(
  () => `candles:${symbol.value}:${current.value.range}`,
  () => api<CandlesDto>(`/markets/candles/${encodeURIComponent(symbol.value)}`, { query: { range: current.value.range } }),
  { lazy: true },
)
const from = computed(() => {
  const last = series.value?.candles.at(-1)
  if (!('months' in current.value) || !last) return undefined
  const date = new Date(last.time * 1000)
  date.setUTCMonth(date.getUTCMonth() - current.value.months)
  return date.getTime() / 1000
})
// Moyennes mobiles (calculées sur les séances) : seulement sur les périodes en séances.
const overlays = computed(() => {
  if (current.value.range !== '5y' || !data.value) return []
  const line = (key: 'sma50' | 'sma200') =>
    data.value!.points.flatMap((p) => (p[key] === null ? [] : [{ time: Date.parse(p.date) / 1000, value: p[key]! }]))
  return [
    { key: 'sma50', label: 'MM 50 séances', color: 'var(--color-chart-2)', points: line('sma50') },
    { key: 'sma200', label: 'MM 200 séances', color: 'var(--color-chart-3)', points: line('sma200') },
  ]
})

// Direct : la dernière cotation met à jour l'en-tête et la bougie en cours ; les tuiles (valorisation…) sont relues.
const chart = ref<{ push: (tick: PriceTickDto) => void }>()
const live = ref<PriceTickDto>()
watch(symbol, () => (live.value = undefined))
useLivePrices(() => [symbol.value], (tick) => {
  live.value = tick
  chart.value?.push(tick)
})
useLiveRefresh(() => [symbol.value], refresh)
const price = computed(() => live.value?.price ?? data.value?.price ?? 0)
const dayChangeRate = computed(() => live.value?.changeRate ?? data.value?.dayChangeRate ?? 0)

const currency = computed(() => data.value?.currency ?? 'EUR')
// Tableau « Mes opérations » chargé page par page ; la courbe garde toutes les opérations (repères).
const trades = usePaginatedList<PurchaseDto>('/purchases', () => ({ symbol: symbol.value }))
// Suivre une valeur arrivée depuis la recherche (elle rejoint la page Suivi et le fil d'actualités).
const toast = useToast()
const { bump } = useDataVersion()
async function follow() {
  try {
    const watch = await api<WatchDto>('/watches', { method: 'POST', body: { asset: symbol.value } })
    toast.add({ title: 'Valeur suivie', description: watch.name, color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    toast.add({ title: 'Suivi impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  await bump()
}

const markers = computed(() =>
  (data.value?.purchases ?? []).map((p) => ({
    time: Date.parse(p.boughtAt) / 1000,
    side: p.side,
    label: `${TRADE_SIDE_LABELS[p.side]} ${quantity(p.quantity)} × ${unitMoney(p.unitPrice, p.currency)}`,
  })),
)

const periods: { key: TrendPeriod, label: string }[] = [
  { key: '1m', label: '1 mois' },
  { key: '3m', label: '3 mois' },
  { key: '6m', label: '6 mois' },
  { key: '1y', label: '1 an' },
  { key: 'ytd', label: 'Depuis janvier' },
]

// Lecture en clair des moyennes mobiles, pour qui ne lit pas les graphiques techniques.
const reading = computed(() => {
  const p = data.value
  if (!p) return ''
  const { signal, sma50, sma200 } = p.trend
  if (signal === null || sma50 === null || sma200 === null) return 'Moins de 200 séances de cotation : pas encore assez d’historique pour lire la tendance de fond.'
  const vs200 = percent(p.price / sma200 - 1)
  if (signal === 'up') return `Le cours est ${vs200} au-dessus de sa moyenne sur 200 séances et la moyenne courte (50) reste au-dessus de la longue : la tendance de fond est haussière.`
  if (signal === 'down') return `Le cours est ${vs200} par rapport à sa moyenne sur 200 séances et la moyenne courte (50) est passée sous la longue : la tendance de fond est baissière.`
  return `Le cours (${vs200} par rapport à la moyenne sur 200 séances) et la moyenne sur 50 séances ne vont pas dans le même sens : la tendance hésite, un retournement est possible.`
})
</script>

<template>
  <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
    <div class="space-y-6">
      <UButton label="Retour" icon="i-lucide-arrow-left" color="neutral" variant="link" class="-ml-2.5" @click="$router.back()" />

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Valeur indisponible"
        :description="apiErrorMessage(error)"
        :actions="[{ label: 'Réessayer', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <template v-else-if="data">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-muted flex items-center gap-2 text-sm">
              {{ data.symbol }}
              <UBadge v-if="data.watchId" label="Suivie" icon="i-lucide-eye" color="neutral" variant="subtle" size="sm" />
            </p>
            <h1 class="text-highlighted text-2xl font-bold tracking-tight">{{ data.name }}</h1>
          </div>
          <div class="text-right">
            <p v-tick="price" class="tick-cell text-highlighted text-3xl font-semibold tabular-nums">{{ unitMoney(price, currency) }}</p>
            <p class="font-medium tabular-nums" :class="gainClass(dayChangeRate)">{{ percent(dayChangeRate) }} aujourd’hui</p>
            <UButton v-if="!data.watchId" label="Suivre" icon="i-lucide-eye" color="neutral" variant="outline" class="mt-3" loading-auto @click="follow" />
          </div>
        </div>

        <!-- Encart d'ordre sous l'en-tête sur téléphone et tablette ; à droite sur grand écran. -->
        <OrderCard :symbol="data.symbol" :price="data.price" class="xl:hidden" />

        <div v-if="data.position" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Valorisation" :tick="data.position.value" :value="money(data.position.value, currency)" :hint="`${percent(data.position.weight, false)} du portefeuille`" />
          <StatTile
            label="Plus ou moins-value"
            :tick="data.position.gain"
            :value="signedMoney(data.position.gain, currency)"
            :delta="percent(data.position.gainRate)"
            :delta-value="data.position.gain"
          />
          <StatTile label="Prix de revient unitaire" :value="unitMoney(data.position.averageCost, currency)" hint="Frais compris" />
          <StatTile label="Quantité" :value="quantity(data.position.quantity)" :hint="`${money(data.position.invested, currency)} investis`" />
        </div>

        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-highlighted font-semibold">Cours</h2>
              <UTabs v-model="period" :items="PERIODS.map((p) => ({ label: p.label, value: p.label }))" :content="false" size="xs" />
            </div>
          </template>
          <ChartCandles
            v-if="series?.candles.length"
            ref="chart"
            :label="`Cours de ${data.name} en bougies${current.range === '5y' ? ' avec ses moyennes mobiles 50 et 200 séances' : ''}${data.position ? ' et tes opérations' : ''}`"
            :candles="series.candles"
            :offset="series.offset"
            :step="current.step"
            :intraday="current.range !== '5y'"
            :currency="currency"
            :from="from"
            :overlays="overlays"
            :markers="markers"
            :reference="data.position ? { value: data.position.averageCost, label: 'PRU' } : undefined"
          />
          <p v-else-if="series" class="text-muted py-24 text-center text-sm">Pas de cotation sur cette période.</p>
          <USkeleton v-else class="h-80 sm:h-96" />
        </UCard>

        <div class="grid gap-6 lg:grid-cols-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h2 class="text-highlighted font-semibold">Tendance</h2>
                <TrendBadge :signal="data.trend.signal" />
              </div>
            </template>
            <p class="text-toned">{{ reading }}</p>
            <dl class="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm tabular-nums sm:grid-cols-3">
              <div v-for="p in periods" :key="p.key">
                <dt class="text-muted">{{ p.label }}</dt>
                <dd v-if="data.trend.performance[p.key] !== null" class="font-medium" :class="gainClass(data.trend.performance[p.key]!)">
                  {{ percent(data.trend.performance[p.key]!) }}
                </dd>
                <dd v-else class="text-muted">—</dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-highlighted font-semibold">Sur 52 semaines</h2>
            </template>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm tabular-nums">
              <div>
                <dt class="text-muted">Plus haut</dt>
                <dd class="text-highlighted font-medium">{{ money(data.trend.high52, currency) }}</dd>
              </div>
              <div>
                <dt class="text-muted">Plus bas</dt>
                <dd class="text-highlighted font-medium">{{ money(data.trend.low52, currency) }}</dd>
              </div>
              <div>
                <dt class="text-muted">Écart au plus haut</dt>
                <dd class="font-medium" :class="gainClass(data.trend.fromHigh52)">{{ percent(data.trend.fromHigh52) }}</dd>
              </div>
              <div>
                <dt class="text-muted">Volatilité annualisée</dt>
                <dd class="text-highlighted font-medium">
                  {{ data.trend.volatility === null ? '—' : percent(data.trend.volatility, false) }}
                </dd>
              </div>
            </dl>
            <p class="text-muted mt-4 text-sm">La volatilité mesure l’amplitude habituelle des variations : au-delà de 30 %, le cours bouge fort.</p>
          </UCard>
        </div>

        <UCard v-if="data.purchases.length" :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <h2 class="text-highlighted font-semibold">Mes opérations</h2>
          </template>
          <UTable
            v-if="trades.items.value.length"
            :data="trades.items.value"
            :columns="[
              { accessorKey: 'boughtAt', header: 'Date' },
              { accessorKey: 'side', header: 'Opération' },
              { accessorKey: 'quantity', header: 'Quantité', meta: { class: { th: 'text-right', td: 'text-right' } } },
              { accessorKey: 'unitPrice', header: 'Prix unitaire', meta: { class: { th: 'text-right', td: 'text-right' } } },
              { accessorKey: 'fees', header: 'Frais', meta: { class: { th: 'text-right', td: 'text-right' } } },
              { accessorKey: 'total', header: 'Total', meta: { class: { th: 'text-right', td: 'text-right' } } },
            ]"
            class="tabular-nums"
          >
            <template #boughtAt-cell="{ row }">{{ longDate(row.original.boughtAt) }}</template>
            <template #side-cell="{ row }">
            <UBadge :label="TRADE_SIDE_LABELS[row.original.side]" :color="SIDE_COLOR[row.original.side]" variant="subtle" />
          </template>
            <template #quantity-cell="{ row }">{{ quantity(row.original.quantity) }}</template>
            <template #unitPrice-cell="{ row }">{{ unitMoney(row.original.unitPrice, currency) }}</template>
            <template #fees-cell="{ row }">{{ money(row.original.fees, currency) }}</template>
            <template #total-cell="{ row }">{{ money(row.original.total, currency) }}</template>
          </UTable>
          <ListSkeleton v-if="trades.loading.value" :rows="trades.items.value.length ? 2 : 4" />
          <ListSentinel :active="!trades.loading.value && !trades.done.value && !trades.error.value" @visible="trades.loadMore" />
        </UCard>
      </template>
    </div>

    <!-- Colonne de droite sur grand écran : encart d'ordre, puis actualités si la valeur est suivie ; sous la fiche sinon. -->
    <aside v-if="data" class="space-y-6">
      <OrderCard :symbol="data.symbol" :price="data.price" class="hidden xl:block" />
      <NewsCard v-if="data.watchId" :watch-id="data.watchId" />
    </aside>
  </div>
</template>
