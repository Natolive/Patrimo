<script setup lang="ts">
import type { PortfolioDto, PositionDto } from '@patrimo/shared'
import type { TableColumn } from '@nuxt/ui'
import type { BarRow } from '~/components/chart/ChartBars.vue'

useHead({ title: 'Positions' })

const api = useApi()
const { data, error, refresh } = await useAsyncData('portfolio', () => api<PortfolioDto>('/portfolio'))

// Filtres : recherche (nom ou symbole) et vue rapide.
const search = ref('')
const FILTERS = [
  { label: 'Toutes', value: 'all' },
  { label: 'En gain', value: 'gain' },
  { label: 'En perte', value: 'loss' },
  { label: 'Haussières', value: 'up' },
  { label: 'Baissières', value: 'down' },
] as const
const filter = ref<(typeof FILTERS)[number]['value']>('all')

const positions = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (data.value?.positions ?? []).filter((p) => {
    if (q && !`${p.name} ${p.symbol}`.toLowerCase().includes(q)) return false
    if (filter.value === 'gain') return p.gain >= 0
    if (filter.value === 'loss') return p.gain < 0
    if (filter.value === 'up' || filter.value === 'down') return p.trend.signal === filter.value
    return true
  })
})

const link = (p: { symbol: string }) => `/assets/${encodeURIComponent(p.symbol)}`
const weightRows = computed<BarRow[]>(() => (data.value?.positions ?? []).map((p) => ({ key: p.symbol, label: p.name, sub: p.symbol, value: p.weight, to: link(p) })))
const gainRows = computed<BarRow[]>(() =>
  [...(data.value?.positions ?? [])].sort((a, b) => b.gain - a.gain).map((p) => ({ key: p.symbol, label: p.name, sub: p.symbol, value: p.gain, to: link(p) })),
)

// Écart du cours à sa moyenne sur 200 séances (au-dessus = tendance de fond haussière) ; null sans assez d'historique.
const vsSma200 = (p: PositionDto) => (p.trend.sma200 ? p.price / p.trend.sma200 - 1 : null)

// En-tête cliquable (croissant, décroissant, puis tri par défaut), avec une bulle d'aide quand la notion est technique.
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const sortable = (label: string, hint?: string): TableColumn<PositionDto>['header'] => ({ column }) => {
  const dir = column.getIsSorted()
  const button = h(UButton, {
    label,
    color: 'neutral',
    variant: 'ghost',
    class: '-mx-2.5',
    trailingIcon: dir === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : dir === 'desc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-down',
    onClick: () => column.toggleSorting(dir === 'asc'),
  })
  return hint ? h(UTooltip, { text: hint, content: { side: 'top' } }, () => button) : button
}

// Colonnes secondaires masquées sur petit écran ; classes écrites en entier (Tailwind ne génère pas une classe interpolée).
const right = { th: 'text-right', td: 'text-right' }
const shown = {
  sm: { th: 'hidden sm:table-cell', td: 'hidden sm:table-cell' },
  smRight: { th: 'hidden sm:table-cell text-right', td: 'hidden sm:table-cell text-right' },
  md: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' },
  lg: { th: 'hidden lg:table-cell text-right', td: 'hidden lg:table-cell text-right' },
  xl: { th: 'hidden xl:table-cell text-right', td: 'hidden xl:table-cell text-right' },
  '2xl': { th: 'hidden 2xl:table-cell text-right', td: 'hidden 2xl:table-cell text-right' },
}
const columns: TableColumn<PositionDto>[] = [
  { accessorKey: 'name', header: sortable('Valeur') },
  { accessorKey: 'averageCost', header: sortable('PRU', 'Prix de revient unitaire : ce que t’a coûté un titre en moyenne, frais compris.'), meta: { class: shown.md } },
  { accessorKey: 'price', header: sortable('Cours', 'Dernier cours, et sa variation depuis la clôture précédente.'), meta: { class: shown.smRight } },
  { accessorKey: 'value', header: sortable('Valorisation'), meta: { class: right } },
  { accessorKey: 'weight', header: sortable('Poids', 'Part de cette ligne dans la valorisation totale.'), meta: { class: shown.md } },
  { accessorKey: 'gain', header: sortable('+/- latente', 'Gain ou perte si tu vendais au cours actuel : valorisation moins coût d’achat.'), meta: { class: right } },
  { accessorKey: 'realizedGain', header: sortable('Réalisée', 'Gain ou perte déjà encaissé par tes ventes sur cette valeur.'), meta: { class: shown['2xl'] } },
  { accessorKey: 'dividends', header: sortable('Dividendes', 'Dividendes encaissés sur cette valeur, retenues déduites.'), meta: { class: shown['2xl'] } },
  { id: 'trend', accessorFn: (p) => p.trend.signal ?? '', header: sortable('Tendance', 'Haussière : cours et moyenne 50 séances au-dessus de la moyenne 200. Baissière : les deux en dessous.'), meta: { class: shown.sm } },
  { id: 'perf1y', accessorFn: (p) => p.trend.performance['1y'] ?? -Infinity, header: sortable('1 an', 'Variation du cours sur un an.'), meta: { class: shown.lg } },
  { id: 'vsSma200', accessorFn: (p) => vsSma200(p) ?? -Infinity, header: sortable('vs MM200', 'Écart du cours à sa moyenne des 200 dernières séances : au-dessus, la tendance de fond est positive.'), meta: { class: shown.xl } },
  { id: 'volatility', accessorFn: (p) => p.trend.volatility ?? -Infinity, header: sortable('Volatilité', 'Amplitude habituelle des variations sur un an. Au-delà de 30 %, le cours bouge fort.'), meta: { class: shown.xl } },
  { id: 'fromHigh52', accessorFn: (p) => p.trend.fromHigh52, header: sortable('vs + haut', 'Écart au plus haut des 52 dernières semaines.'), meta: { class: shown['2xl'] } },
  { id: 'actions', header: '', meta: { class: { td: 'text-right' } } },
]
const sorting = ref([{ id: 'value', desc: true }])

const lessons = [
  { label: 'Valorisation, coût et plus-value', icon: 'i-lucide-calculator', content: 'La valorisation est ce que vaut la ligne au dernier cours (quantité × cours). Le coût est ce que tu as payé pour les titres encore détenus, frais compris. La plus-value latente est la différence : elle n’est acquise que si tu vends. La plus-value réalisée, elle, est déjà encaissée par tes ventes ; les dividendes sont comptés à part, ils ne changent pas le PRU.' },
  { label: 'PRU (prix de revient unitaire)', icon: 'i-lucide-tag', content: 'Le prix moyen payé par titre, frais compris. Chaque achat le recalcule (moyenne pondérée) ; une vente ne le change pas. Cours au-dessus du PRU = ligne en gain.' },
  { label: 'Poids et contribution', icon: 'i-lucide-chart-bar', content: 'Le poids montre où est ton argent : une ligne à 40 % pèse lourd dans les variations du portefeuille. La contribution montre d’où vient ta plus-value : une petite ligne peut beaucoup rapporter, une grosse peu.' },
  { label: 'Tendance et moyennes mobiles', icon: 'i-lucide-trending-up', content: 'La moyenne mobile 200 séances (environ 10 mois de cotation) lisse le cours pour montrer la tendance de fond ; celle sur 50 séances montre la tendance récente. Quand les deux et le cours vont dans le même sens, la tendance est nette ; sinon elle hésite.' },
  { label: 'Volatilité et plus haut 52 semaines', icon: 'i-lucide-activity', content: 'La volatilité mesure l’amplitude habituelle des variations sur un an : 15 % est calme (grand ETF), 30 % et plus est agité. L’écart au plus haut sur 52 semaines dit si la valeur est proche de son sommet de l’année ou en repli.' },
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-highlighted text-2xl font-bold tracking-tight">Positions</h1>
      <p class="text-muted mt-1">
        {{ data?.positions.length ?? 0 }} ligne{{ (data?.positions.length ?? 0) > 1 ? 's' : '' }} détenue{{ (data?.positions.length ?? 0) > 1 ? 's' : '' }} · cours différés, mis à jour toutes les 10 minutes.
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Positions indisponibles"
      :description="apiErrorMessage(error)"
      :actions="[{ label: 'Réessayer', color: 'error', variant: 'outline', onClick: () => refresh() }]"
    />

    <UCard v-else-if="data && !data.positions.length && !data.closed.length" class="text-center">
      <UIcon name="i-lucide-layers" class="text-muted mx-auto size-10" />
      <p class="text-highlighted mt-4 font-semibold">Aucune position</p>
      <p class="text-muted mt-1">Ajoute tes achats pour voir ici chaque ligne, son poids et sa plus-value.</p>
      <UButton label="Ajouter une opération" icon="i-lucide-plus" to="/purchases" class="mt-6" />
    </UCard>

    <template v-else-if="data">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Valorisation" :value="money(data.value)" :hint="`${data.positions.length} lignes`" />
        <StatTile label="Coût des titres détenus" :value="money(data.invested)" hint="Frais compris" />
        <StatTile label="Plus-value latente" :value="signedMoney(data.gain)" :delta="percent(data.gainRate)" :delta-value="data.gain" />
        <StatTile label="Plus-value réalisée" :value="signedMoney(data.realizedGain)" :delta="data.dividends ? `${signedMoney(data.dividends)} de dividendes` : undefined" :delta-value="data.dividends" :hint="data.closed.length ? `dont ${data.closed.length} ligne${data.closed.length > 1 ? 's' : ''} soldée${data.closed.length > 1 ? 's' : ''}` : 'Par tes ventes'" />
      </div>

      <div v-if="data.positions.length" class="grid gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h2 class="text-highlighted font-semibold">Poids dans le portefeuille</h2>
            <p class="text-muted text-sm">Où est ton argent, de la plus grosse ligne à la plus petite.</p>
          </template>
          <ChartBars label="Poids de chaque ligne dans la valorisation" :rows="weightRows" :format="(v) => percent(v, false)" />
        </UCard>
        <UCard>
          <template #header>
            <h2 class="text-highlighted font-semibold">Contribution à la plus-value</h2>
            <p class="text-muted text-sm">D’où vient ta plus-value latente, ligne par ligne.</p>
          </template>
          <ChartBars label="Plus-value latente de chaque ligne" :rows="gainRows" :format="(v) => signedMoney(v)" diverging />
        </UCard>
      </div>

      <UCard v-if="data.positions.length" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-highlighted font-semibold">Détail des positions</h2>
            <div class="flex flex-wrap items-center gap-2">
              <UInput v-model="search" icon="i-lucide-search" placeholder="Rechercher une valeur" size="sm" class="w-52" aria-label="Rechercher une valeur" />
              <UTabs v-model="filter" :items="[...FILTERS]" :content="false" size="xs" />
            </div>
          </div>
        </template>
        <!-- Téléphone : une carte par ligne (le tableau ne tient pas) ; un appui ouvre la fiche et son encart d'ordre. -->
        <ul class="divide-default divide-y sm:hidden">
          <li v-for="p in positions" :key="p.symbol">
            <NuxtLink :to="link(p)" class="flex items-center justify-between gap-4 px-4 py-3 tabular-nums">
              <span class="min-w-0">
                <span class="text-highlighted block truncate font-medium">{{ p.name }}</span>
                <span class="text-muted text-xs">{{ p.symbol }} · {{ quantity(p.quantity) }} titres · {{ percent(p.weight, false) }}</span>
              </span>
              <span class="shrink-0 text-right">
                <span class="text-highlighted block font-medium">{{ money(p.value, p.currency) }}</span>
                <span class="text-xs" :class="gainClass(p.gain)">{{ signedMoney(p.gain, p.currency) }} ({{ percent(p.gainRate) }})</span>
              </span>
            </NuxtLink>
          </li>
          <li v-if="!positions.length" class="text-muted px-4 py-6 text-center text-sm">Aucune position ne correspond à ces filtres.</li>
        </ul>
        <UTable v-model:sorting="sorting" :data="positions" :columns="columns" class="hidden tabular-nums sm:block" empty="Aucune position ne correspond à ces filtres.">
          <template #name-cell="{ row }">
            <NuxtLink :to="link(row.original)" class="group block max-w-60">
              <span class="text-highlighted group-hover:text-primary block truncate font-medium">{{ row.original.name }}</span>
              <span class="text-muted text-xs">{{ row.original.symbol }} · {{ quantity(row.original.quantity) }} titres</span>
            </NuxtLink>
          </template>
          <template #averageCost-cell="{ row }">{{ unitMoney(row.original.averageCost, row.original.currency) }}</template>
          <template #price-cell="{ row }">
            <span class="block">{{ unitMoney(row.original.price, row.original.currency) }}</span>
            <span class="text-xs" :class="gainClass(row.original.dayChangeRate)">{{ percent(row.original.dayChangeRate) }}</span>
          </template>
          <template #value-cell="{ row }">
            <span class="text-highlighted font-medium">{{ money(row.original.value, row.original.currency) }}</span>
          </template>
          <template #weight-cell="{ row }">
            <div class="ms-auto flex w-28 items-center gap-2">
              <span class="bg-elevated h-1.5 flex-1 overflow-hidden rounded-full"><span class="block h-full rounded-full bg-(--color-chart-1)" :style="{ width: `${row.original.weight * 100}%` }" /></span>
              <span class="w-12 text-right">{{ percent(row.original.weight, false) }}</span>
            </div>
          </template>
          <template #gain-cell="{ row }">
            <span class="block font-medium" :class="gainClass(row.original.gain)">{{ signedMoney(row.original.gain, row.original.currency) }}</span>
            <span class="text-xs" :class="gainClass(row.original.gain)">{{ percent(row.original.gainRate) }}</span>
          </template>
          <template #realizedGain-cell="{ row }">
            <span v-if="row.original.realizedGain" :class="gainClass(row.original.realizedGain)">{{ signedMoney(row.original.realizedGain, row.original.currency) }}</span>
            <span v-else class="text-dimmed">—</span>
          </template>
          <template #trend-cell="{ row }"><TrendBadge :signal="row.original.trend.signal" /></template>
          <template #perf1y-cell="{ row }">
            <span v-if="row.original.trend.performance['1y'] !== null" :class="gainClass(row.original.trend.performance['1y']!)">{{ percent(row.original.trend.performance['1y']!) }}</span>
            <span v-else class="text-dimmed">—</span>
          </template>
          <template #vsSma200-cell="{ row }">
            <span v-if="vsSma200(row.original) !== null" :class="gainClass(vsSma200(row.original)!)">{{ percent(vsSma200(row.original)!) }}</span>
            <span v-else class="text-dimmed">—</span>
          </template>
          <template #volatility-cell="{ row }">
            <span v-if="row.original.trend.volatility !== null" :class="row.original.trend.volatility > 0.3 ? 'text-warning font-medium' : ''">{{ percent(row.original.trend.volatility, false) }}</span>
            <span v-else class="text-dimmed">—</span>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UTooltip text="Acheter"><UButton icon="i-lucide-arrow-down-to-line" color="success" variant="soft" size="sm" :aria-label="`Acheter ${row.original.name}`" :to="`${link(row.original)}?side=buy`" /></UTooltip>
              <UTooltip text="Vendre"><UButton icon="i-lucide-arrow-up-from-line" color="error" variant="soft" size="sm" :aria-label="`Vendre ${row.original.name}`" :to="`${link(row.original)}?side=sell`" /></UTooltip>
            </div>
          </template>
          <template #dividends-cell="{ row }">
            <span v-if="row.original.dividends" :class="gainClass(row.original.dividends)">{{ signedMoney(row.original.dividends, row.original.currency) }}</span>
            <span v-else class="text-dimmed">—</span>
          </template>
          <template #fromHigh52-cell="{ row }">
            <span :class="gainClass(row.original.trend.fromHigh52)">{{ percent(row.original.trend.fromHigh52) }}</span>
          </template>
        </UTable>
      </UCard>

      <UCard v-if="data.closed.length" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <h2 class="text-highlighted font-semibold">Lignes soldées</h2>
          <p class="text-muted text-sm">Valeurs entièrement vendues : il ne reste que leur plus-value réalisée et leurs dividendes.</p>
        </template>
        <ul class="divide-default divide-y">
          <li v-for="c in data.closed" :key="c.symbol" class="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <NuxtLink :to="link(c)" class="group min-w-0">
              <span class="text-highlighted group-hover:text-primary block truncate font-medium">{{ c.name }}</span>
              <span class="text-muted text-xs">{{ c.symbol }}</span>
            </NuxtLink>
            <span class="shrink-0 text-right tabular-nums">
              <span class="block font-medium" :class="gainClass(c.realizedGain)">{{ signedMoney(c.realizedGain, c.currency) }}</span>
              <span v-if="c.dividends" class="text-xs" :class="gainClass(c.dividends)">{{ signedMoney(c.dividends, c.currency) }} de dividendes</span>
            </span>
          </li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-highlighted flex items-center gap-2 font-semibold"><UIcon name="i-lucide-graduation-cap" class="size-5" />Comment lire cette page</h2>
        </template>
        <UAccordion :items="lessons" type="multiple" />
      </UCard>
    </template>
  </div>
</template>
