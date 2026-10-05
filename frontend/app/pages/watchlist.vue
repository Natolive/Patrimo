<script setup lang="ts">
import type { WatchDto } from '@patrimo/shared'
import type { TableColumn } from '@nuxt/ui'

useHead({ title: 'Suivi' })

const api = useApi()
const toast = useToast()
const { openSearch } = useSearch()
// Chargées page par page au défilement (les cours ne sont demandés que pour la page).
const { items: watches, total, loading, error, done, loadMore, reset } = usePaginatedList<WatchDto>('/watches')

const link = (w: WatchDto) => `/assets/${encodeURIComponent(w.symbol)}`

// Arrêt du suivi confirmé dans une modale qui dit ce qui part.
const removing = ref<WatchDto>()
async function unfollow() {
  const watch = removing.value!
  try {
    await api(`/watches/${watch.id}`, { method: 'DELETE' })
  } catch (e) {
    toast.add({ title: 'Arrêt du suivi impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  removing.value = undefined
  toast.add({ title: 'Suivi arrêté', description: watch.name, color: 'success', icon: 'i-lucide-check' })
  await reset()
}

const shown = {
  md: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' },
  lg: { th: 'hidden lg:table-cell text-right', td: 'hidden lg:table-cell text-right' },
}
const columns: TableColumn<WatchDto>[] = [
  { accessorKey: 'name', header: 'Valeur' },
  { accessorKey: 'price', header: 'Cours', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { id: '1m', header: '1 mois', meta: { class: shown.md } },
  { id: '1y', header: '1 an', meta: { class: shown.md } },
  { id: 'fromHigh52', header: 'Vs plus haut', meta: { class: shown.lg } },
  { id: 'trend', header: 'Tendance', meta: { class: { th: 'hidden sm:table-cell', td: 'hidden sm:table-cell' } } },
  { id: 'actions', header: '', meta: { class: { td: 'text-right' } } },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-highlighted text-2xl font-bold tracking-tight">Suivi</h1>
        <p class="text-muted mt-1">
          {{ total ?? '…' }} valeur{{ (total ?? 0) > 1 ? 's' : '' }} suivie{{ (total ?? 0) > 1 ? 's' : '' }} : cours, tendance et actualités.
          Les valeurs achetées y sont ajoutées automatiquement.
        </p>
      </div>
      <UButton label="Rechercher une valeur" icon="i-lucide-search" color="neutral" variant="outline" @click="openSearch">
        <template #trailing><span class="hidden gap-0.5 sm:flex"><UKbd value="meta" /><UKbd value="K" /></span></template>
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UCard v-if="done && !watches.length" variant="soft" class="m-4 text-center">
        <UIcon name="i-lucide-eye" class="text-muted mx-auto size-10" />
        <p class="text-highlighted mt-4 font-semibold">Aucune valeur suivie</p>
        <p class="text-muted mt-1">Cherche une action ou un ETF, puis « Suivre » sur sa fiche pour garder un œil dessus avant d’acheter.</p>
        <UButton label="Rechercher une valeur" icon="i-lucide-search" class="mt-6" @click="openSearch" />
      </UCard>
      <!-- Tableau affiché dès la première page ; avant, seulement les lignes fantômes. -->
      <UTable v-else-if="watches.length" :data="watches" :columns="columns" class="tabular-nums">
        <template #name-cell="{ row }">
          <NuxtLink :to="link(row.original)" class="group block max-w-36 sm:max-w-72">
            <span class="text-highlighted group-hover:text-primary block truncate font-medium">{{ row.original.name }}</span>
            <span class="text-muted text-xs">{{ row.original.symbol }}</span>
          </NuxtLink>
        </template>
        <template #price-cell="{ row }">
          <span class="block">{{ unitMoney(row.original.price, row.original.currency) }}</span>
          <span class="text-xs" :class="gainClass(row.original.dayChangeRate)">{{ percent(row.original.dayChangeRate) }}</span>
        </template>
        <template v-for="period in ['1m', '1y'] as const" :key="period" #[`${period}-cell`]="{ row }">
          <span v-if="row.original.trend.performance[period] !== null" :class="gainClass(row.original.trend.performance[period]!)">
            {{ percent(row.original.trend.performance[period]!) }}
          </span>
          <span v-else class="text-dimmed">—</span>
        </template>
        <template #fromHigh52-cell="{ row }">
          <span :class="gainClass(row.original.trend.fromHigh52)">{{ percent(row.original.trend.fromHigh52) }}</span>
        </template>
        <template #trend-cell="{ row }"><TrendBadge :signal="row.original.trend.signal" /></template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UTooltip text="Acheter"><UButton icon="i-lucide-arrow-down-to-line" color="success" variant="soft" size="sm" :aria-label="`Acheter ${row.original.name}`" :to="`${link(row.original)}?side=buy`" /></UTooltip>
            <UTooltip text="Vendre"><UButton icon="i-lucide-arrow-up-from-line" color="error" variant="soft" size="sm" :aria-label="`Vendre ${row.original.name}`" :to="`${link(row.original)}?side=sell`" /></UTooltip>
            <UTooltip text="Ne plus suivre"><UButton icon="i-lucide-eye-off" color="neutral" variant="ghost" size="sm" :aria-label="`Ne plus suivre ${row.original.name}`" @click="removing = row.original" /></UTooltip>
          </div>
        </template>
      </UTable>
      <ListSkeleton v-if="loading" :rows="watches.length ? 3 : 8" />
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Cours indisponibles"
        :description="apiErrorMessage(error)"
        :actions="[{ label: 'Réessayer', color: 'error', variant: 'outline', onClick: () => loadMore() }]"
        class="m-4 w-auto"
      />
      <ListSentinel :active="!loading && !done && !error" @visible="loadMore" />
    </UCard>

    <UModal :open="!!removing" title="Ne plus suivre cette valeur ?" @update:open="(open) => !open && (removing = undefined)">
      <template #body>
        <p v-if="removing">{{ removing.name }} disparaît de ta liste de suivi et de tes actualités. Tes opérations éventuelles restent dans ton portefeuille.</p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="removing = undefined" />
          <UButton label="Ne plus suivre" color="error" icon="i-lucide-eye-off" loading-auto @click="unfollow" />
        </div>
      </template>
    </UModal>
  </div>
</template>
