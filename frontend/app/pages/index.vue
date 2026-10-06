<script setup lang="ts">
import type { PortfolioDto, PositionDto } from '@patrimo/shared'
import type { TableColumn } from '@nuxt/ui'

useHead({ title: 'Tableau de bord' })

const api = useApi()
const { data, error, refresh, status } = await useAsyncData('portfolio', () => api<PortfolioDto>('/portfolio'))

const range = ref<RangeLabel>('Tout')
const history = computed(() => inRange(data.value?.history ?? [], range.value))

const columns: TableColumn<PositionDto>[] = [
  { accessorKey: 'name', header: 'Valeur' },
  { accessorKey: 'quantity', header: 'Quantité', meta: { class: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' } } },
  { accessorKey: 'averageCost', header: 'PRU', meta: { class: { th: 'hidden lg:table-cell text-right', td: 'hidden lg:table-cell text-right' } } },
  { accessorKey: 'price', header: 'Cours', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'value', header: 'Valorisation', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'gain', header: '+/- value', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'weight', header: 'Poids', meta: { class: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' } } },
  { id: 'trend', header: 'Tendance', meta: { class: { th: 'hidden sm:table-cell', td: 'hidden sm:table-cell' } } },
]
</script>

<template>
  <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <div class="space-y-6">
      <div>
        <h1 class="text-highlighted text-2xl font-bold tracking-tight">Mon portefeuille</h1>
        <p class="text-muted mt-1">Cours différés, mis à jour toutes les 10 minutes.</p>
      </div>

      <MarketClock />

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Portefeuille indisponible"
        :description="apiErrorMessage(error)"
        :actions="[{ label: 'Réessayer', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <UCard v-else-if="data && !data.positions.length" class="text-center">
        <UIcon name="i-lucide-wallet" class="text-muted mx-auto size-10" />
        <p class="text-highlighted mt-4 font-semibold">Ton portefeuille est vide</p>
        <p class="text-muted mt-1">Ajoute tes achats pour suivre leur valeur et leur tendance.</p>
        <p v-if="data.realizedGain" class="mt-2 font-medium tabular-nums" :class="gainClass(data.realizedGain)">{{ signedMoney(data.realizedGain) }} réalisés par tes ventes</p>
        <p v-if="data.dividends" class="mt-1 font-medium tabular-nums" :class="gainClass(data.dividends)">{{ signedMoney(data.dividends) }} de dividendes perçus</p>
        <UButton label="Ajouter une opération" icon="i-lucide-plus" to="/purchases" class="mt-6" />
      </UCard>

      <template v-else-if="data">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard class="sm:col-span-2" :ui="{ body: 'p-4 sm:p-5' }">
            <p class="text-muted text-sm">Valorisation</p>
            <p class="text-highlighted mt-1 text-5xl font-semibold tracking-tight">{{ money(data.value) }}</p>
            <p class="mt-2 font-medium tabular-nums" :class="gainClass(data.gain)">
              {{ signedMoney(data.gain) }} ({{ percent(data.gainRate) }}) depuis tes achats
            </p>
          </UCard>
          <StatTile
            label="Investi, frais compris"
            :value="money(data.invested)"
            :hint="data.dividends ? `${money(data.dividends)} de dividendes perçus` : data.realizedGain ? undefined : 'Coût des titres détenus'"
            :delta="data.realizedGain ? `${signedMoney(data.realizedGain)} réalisés par tes ventes` : undefined"
            :delta-value="data.realizedGain"
          />
          <StatTile
            label="Variation du jour"
            :value="signedMoney(data.dayChange)"
            :delta="percent(data.dayChangeRate)"
            :delta-value="data.dayChange"
          />
        </div>

        <UCard :class="{ 'opacity-60': status === 'pending' }">
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-highlighted font-semibold">Évolution du portefeuille</h2>
              <UTabs v-model="range" :items="RANGES.map((r) => ({ label: r.label, value: r.label }))" :content="false" size="xs" />
            </div>
          </template>
          <ChartLine
            v-if="history.length"
            label="Valorisation du portefeuille comparée au montant investi"
            :dates="history.map((p) => p.date)"
            :series="[
              { key: 'value', label: 'Valorisation', color: 'var(--color-chart-1)', values: history.map((p) => p.value) },
              { key: 'invested', label: 'Investi', color: 'var(--color-chart-2)', values: history.map((p) => p.invested) },
            ]"
            :format="(v) => money(v)"
          />
        </UCard>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-highlighted font-semibold">Positions</h2>
              <UButton label="Voir le détail" trailing-icon="i-lucide-arrow-right" color="neutral" variant="ghost" size="sm" to="/positions" />
            </div>
          </template>
          <UTable :data="data.positions" :columns="columns" class="tabular-nums">
            <template #name-cell="{ row }">
              <NuxtLink :to="`/assets/${encodeURIComponent(row.original.symbol)}`" class="group block max-w-56">
                <span class="text-highlighted block truncate font-medium group-hover:text-primary">{{ row.original.name }}</span>
                <span class="text-muted text-xs">{{ row.original.symbol }}</span>
              </NuxtLink>
            </template>
            <template #quantity-cell="{ row }">{{ quantity(row.original.quantity) }}</template>
            <template #averageCost-cell="{ row }">{{ unitMoney(row.original.averageCost, row.original.currency) }}</template>
            <template #price-cell="{ row }">
              <span class="block">{{ unitMoney(row.original.price, row.original.currency) }}</span>
              <span class="text-xs" :class="gainClass(row.original.dayChangeRate)">{{ percent(row.original.dayChangeRate) }}</span>
            </template>
            <template #value-cell="{ row }">{{ money(row.original.value, row.original.currency) }}</template>
            <template #gain-cell="{ row }">
              <span class="block font-medium" :class="gainClass(row.original.gain)">{{ signedMoney(row.original.gain, row.original.currency) }}</span>
              <span class="text-xs" :class="gainClass(row.original.gain)">{{ percent(row.original.gainRate) }}</span>
            </template>
            <template #weight-cell="{ row }">{{ percent(row.original.weight, false) }}</template>
            <template #trend-cell="{ row }"><TrendBadge :signal="row.original.trend.signal" /></template>
          </UTable>
        </UCard>
      </template>
    </div>

    <!-- Bandeau latéral sur grand écran (reste visible au défilement), sous le tableau de bord sinon. -->
    <aside class="xl:sticky xl:top-22">
      <NewsFeed />
    </aside>
  </div>
</template>
