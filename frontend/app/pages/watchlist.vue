<script setup lang="ts">
import { watchSchema, type SaveWatchDto, type WatchDto } from '@pea/shared'
import type { TableColumn } from '@nuxt/ui'
import type { FormFieldConfig } from '~/types/form'

useHead({ title: 'Suivi · PEA' })

const api = useApi()
const toast = useToast()
const { data: watches, error, refresh } = await useAsyncData('watches', () => api<WatchDto[]>('/watches'))

const state = ref<SaveWatchDto>({ asset: '' })
const fields: FormFieldConfig<SaveWatchDto>[] = [
  { name: 'asset', label: 'Valeur', placeholder: 'FR0000121014 ou MC', icon: 'i-lucide-search', help: 'Code ISIN ou mnémonique d’une action ou d’un ETF.' },
]

async function follow(dto: SaveWatchDto) {
  try {
    const watch = await api<WatchDto>('/watches', { method: 'POST', body: dto })
    toast.add({ title: 'Valeur suivie', description: watch.name, color: 'success', icon: 'i-lucide-check' })
  } catch (e) {
    toast.add({ title: 'Suivi impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  state.value = { asset: '' }
  await refresh()
}

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
  await refresh()
}

const right = { th: 'text-right', td: 'text-right' }
const columns: TableColumn<WatchDto>[] = [
  { accessorKey: 'name', header: 'Valeur' },
  { accessorKey: 'price', header: 'Cours', meta: { class: right } },
  { id: '1m', header: '1 mois', meta: { class: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' } } },
  { id: '1y', header: '1 an', meta: { class: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' } } },
  { id: 'fromHigh52', header: 'Vs plus haut', meta: { class: { th: 'hidden lg:table-cell text-right', td: 'hidden lg:table-cell text-right' } } },
  { id: 'trend', header: 'Tendance', meta: { class: { th: 'hidden sm:table-cell', td: 'hidden sm:table-cell' } } },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
    <UCard>
      <template #header>
        <h1 class="text-highlighted font-semibold">Suivre une valeur</h1>
      </template>
      <p class="text-muted mb-6 text-sm">Garde un œil sur une action ou un ETF avant d’acheter : cours, tendance et moyennes mobiles.</p>
      <FormBuilder v-model:state="state" :schema="watchSchema" :fields="fields" :submit="follow" submit-label="Suivre" />
    </UCard>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <h2 class="text-highlighted font-semibold">Valeurs suivies</h2>
      </template>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Cours indisponibles"
        :description="apiErrorMessage(error)"
        class="m-4 w-auto"
      />
      <UTable v-else :data="watches ?? []" :columns="columns" class="tabular-nums" empty="Aucune valeur suivie : ajoute-en une avec son code ISIN.">
        <template #name-cell="{ row }">
          <NuxtLink :to="`/assets/${encodeURIComponent(row.original.symbol)}`" class="group block max-w-56">
            <span class="text-highlighted block truncate font-medium group-hover:text-primary">{{ row.original.name }}</span>
            <span class="text-muted text-xs">{{ row.original.symbol }}</span>
          </NuxtLink>
        </template>
        <template #price-cell="{ row }">
          <span class="block">{{ money(row.original.price, row.original.currency) }}</span>
          <span class="text-xs" :class="gainClass(row.original.dayChangeRate)">{{ percent(row.original.dayChangeRate) }}</span>
        </template>
        <template v-for="period in ['1m', '1y'] as const" :key="period" #[`${period}-cell`]="{ row }">
          <span v-if="row.original.trend.performance[period] !== null" :class="gainClass(row.original.trend.performance[period]!)">
            {{ percent(row.original.trend.performance[period]!) }}
          </span>
          <span v-else class="text-muted">—</span>
        </template>
        <template #fromHigh52-cell="{ row }">
          <span :class="gainClass(row.original.trend.fromHigh52)">{{ percent(row.original.trend.fromHigh52) }}</span>
        </template>
        <template #trend-cell="{ row }"><TrendBadge :signal="row.original.trend.signal" /></template>
        <template #actions-cell="{ row }">
          <UButton icon="i-lucide-eye-off" color="neutral" variant="ghost" :aria-label="`Ne plus suivre ${row.original.name}`" @click="removing = row.original" />
        </template>
      </UTable>
    </UCard>

    <UModal :open="!!removing" title="Ne plus suivre cette valeur ?" @update:open="(open) => !open && (removing = undefined)">
      <template #body>
        <p v-if="removing">{{ removing.name }} disparaît de ta liste de suivi. Tes achats éventuels restent dans ton portefeuille.</p>
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
