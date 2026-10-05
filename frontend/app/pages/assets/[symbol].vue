<script setup lang="ts">
import { TRADE_SIDE_LABELS, type AssetDto, type TrendPeriod } from '@pea/shared'

const route = useRoute()
const symbol = computed(() => String(route.params.symbol))
const api = useApi()
const { data, error, refresh } = await useAsyncData(`asset:${symbol.value}`, () => api<AssetDto>(`/portfolio/${encodeURIComponent(symbol.value)}`))
useHead({ title: () => `${data.value?.name ?? symbol.value} · PEA` })

const range = ref<RangeLabel>('1A')
const points = computed(() => inRange(data.value?.points ?? [], range.value))
const currency = computed(() => data.value?.currency ?? 'EUR')
const markers = computed(() =>
  (data.value?.purchases ?? []).map((p) => ({ date: p.boughtAt, label: `${TRADE_SIDE_LABELS[p.side]} ${quantity(p.quantity)} × ${unitMoney(p.unitPrice, p.currency)}` })),
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
          <p class="text-highlighted text-3xl font-semibold">{{ unitMoney(data.price, currency) }}</p>
          <p class="font-medium tabular-nums" :class="gainClass(data.dayChangeRate)">{{ percent(data.dayChangeRate) }} aujourd’hui</p>
        </div>
      </div>

      <div v-if="data.position" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Valorisation" :value="money(data.position.value, currency)" :hint="`${percent(data.position.weight, false)} du portefeuille`" />
        <StatTile
          label="Plus ou moins-value"
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
            <h2 class="text-highlighted font-semibold">Cours et moyennes mobiles</h2>
            <UTabs v-model="range" :items="RANGES.map((r) => ({ label: r.label, value: r.label }))" :content="false" size="xs" />
          </div>
        </template>
        <ChartLine
          :label="`Cours de ${data.name} avec ses moyennes mobiles 50 et 200 séances${data.position ? ' et tes achats' : ''}`"
          :dates="points.map((p) => p.date)"
          :series="[
            { key: 'close', label: 'Cours', color: 'var(--color-chart-1)', values: points.map((p) => p.close) },
            { key: 'sma50', label: 'MM 50 séances', color: 'var(--color-chart-2)', values: points.map((p) => p.sma50) },
            { key: 'sma200', label: 'MM 200 séances', color: 'var(--color-chart-3)', values: points.map((p) => p.sma200) },
          ]"
          :markers="markers"
          :reference="data.position ? { value: data.position.averageCost, label: 'PRU' } : undefined"
          :format="(v) => money(v, currency)"
        />
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

      <NewsCard v-if="data.watchId" :watch-id="data.watchId" />

      <UCard v-if="data.purchases.length" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <h2 class="text-highlighted font-semibold">Mes opérations</h2>
        </template>
        <UTable
          :data="data.purchases"
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
          <template #side-cell="{ row }">{{ TRADE_SIDE_LABELS[row.original.side] }}</template>
          <template #quantity-cell="{ row }">{{ quantity(row.original.quantity) }}</template>
          <template #unitPrice-cell="{ row }">{{ unitMoney(row.original.unitPrice, currency) }}</template>
          <template #fees-cell="{ row }">{{ money(row.original.fees, currency) }}</template>
          <template #total-cell="{ row }">{{ money(row.original.total, currency) }}</template>
        </UTable>
      </UCard>
    </template>
  </div>
</template>
