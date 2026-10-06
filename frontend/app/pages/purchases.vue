<script setup lang="ts">
import { TRADE_SIDE_LABELS, type PurchaseDto } from '@patrimo/shared'
import type { TableColumn } from '@nuxt/ui'

useHead({ title: 'Opérations' })

const api = useApi()
const toast = useToast()
// Chargées page par page au défilement.
const { items: purchases, loading, error, done, loadMore, reset } = usePaginatedList<PurchaseDto>('/purchases')

// Dernière opération ajoutée, surlignée dans la liste.
const added = ref<string>()
async function onSaved(purchase: PurchaseDto) {
  added.value = purchase.id
  await reset()
}

// Correction dans une modale, avec le formulaire prérempli.
const editing = ref<PurchaseDto>()
async function onEdited(purchase: PurchaseDto) {
  editing.value = undefined
  await onSaved(purchase)
}

// Suppression confirmée dans une modale qui dit ce qui part.
const removing = ref<PurchaseDto>()
async function remove() {
  const purchase = removing.value!
  try {
    await api(`/purchases/${purchase.id}`, { method: 'DELETE' })
  } catch (e) {
    toast.add({ title: 'Suppression impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  removing.value = undefined
  toast.add({ title: 'Opération supprimée', description: purchase.name, color: 'success', icon: 'i-lucide-check' })
  await reset()
}

const columns: TableColumn<PurchaseDto>[] = [
  { accessorKey: 'boughtAt', header: 'Date' },
  { accessorKey: 'side', header: 'Opération' },
  { accessorKey: 'name', header: 'Valeur' },
  { accessorKey: 'quantity', header: 'Quantité', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { accessorKey: 'unitPrice', header: 'Prix unitaire', meta: { class: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' } } },
  { accessorKey: 'fees', header: 'Frais', meta: { class: { th: 'hidden md:table-cell text-right', td: 'hidden md:table-cell text-right' } } },
  { accessorKey: 'total', header: 'Total', meta: { class: { th: 'text-right', td: 'text-right' } } },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
    <!-- Formulaire collé en haut de l'écran pendant le défilement de la liste (grand écran). -->
    <UCard class="lg:sticky lg:top-22">
      <template #header>
        <h1 class="text-highlighted font-semibold">Ajouter une opération</h1>
      </template>
      <OrderForm @saved="onSaved" />
    </UCard>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <h2 class="text-highlighted font-semibold">Mes opérations</h2>
      </template>
      <!-- Tableau affiché dès la première page ; avant, seulement les lignes fantômes. -->
      <UTable
        v-if="purchases.length || done"
        :data="purchases"
        :columns="columns"
        :meta="{ class: { tr: (row) => (row.original.id === added ? 'flash' : '') } }"
        class="tabular-nums"
        empty="Aucune opération pour l’instant : ajoute ton premier achat avec le formulaire."
      >
        <template #boughtAt-cell="{ row }">{{ shortDate(row.original.boughtAt) }}</template>
        <template #side-cell="{ row }">
          <UBadge
            :label="TRADE_SIDE_LABELS[row.original.side]"
            :icon="row.original.side === 'buy' ? 'i-lucide-arrow-down-to-line' : 'i-lucide-arrow-up-from-line'"
            :color="row.original.side === 'buy' ? 'success' : 'error'"
            variant="subtle"
          />
        </template>
        <template #name-cell="{ row }">
          <NuxtLink :to="`/assets/${encodeURIComponent(row.original.symbol)}`" class="group block max-w-56">
            <span class="text-highlighted block truncate font-medium group-hover:text-primary">{{ row.original.name }}</span>
            <span class="text-muted text-xs">{{ row.original.symbol }}</span>
          </NuxtLink>
        </template>
        <template #quantity-cell="{ row }">{{ quantity(row.original.quantity) }}</template>
        <template #unitPrice-cell="{ row }">{{ unitMoney(row.original.unitPrice, row.original.currency) }}</template>
        <template #fees-cell="{ row }">{{ money(row.original.fees, row.original.currency) }}</template>
        <template #total-cell="{ row }"><span class="text-highlighted font-medium">{{ money(row.original.total, row.original.currency) }}</span></template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" :aria-label="`Modifier l’opération sur ${row.original.name}`" @click="editing = row.original" />
            <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" :aria-label="`Supprimer l’opération sur ${row.original.name}`" @click="removing = row.original" />
          </div>
        </template>
      </UTable>
      <ListSkeleton v-if="loading" :rows="purchases.length ? 3 : 8" />
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Opérations indisponibles"
        :description="apiErrorMessage(error)"
        :actions="[{ label: 'Réessayer', color: 'error', variant: 'outline', onClick: () => loadMore() }]"
        class="m-4 w-auto"
      />
      <ListSentinel :active="!loading && !done && !error" @visible="loadMore" />
    </UCard>

    <UModal :open="!!editing" title="Modifier l’opération" @update:open="(open) => !open && (editing = undefined)">
      <template #body>
        <OrderForm v-if="editing" :purchase="editing" @saved="onEdited" />
      </template>
    </UModal>

    <UModal :open="!!removing" title="Supprimer l’opération ?" @update:open="(open) => !open && (removing = undefined)">
      <template #body>
        <p v-if="removing">
          {{ TRADE_SIDE_LABELS[removing.side] }} de {{ quantity(removing.quantity) }} × {{ removing.name }} du {{ longDate(removing.boughtAt) }},
          {{ money(removing.total, removing.currency) }} : elle ne comptera plus dans ton portefeuille.
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="removing = undefined" />
          <UButton label="Supprimer" color="error" icon="i-lucide-trash-2" loading-auto @click="remove" />
        </div>
      </template>
    </UModal>
  </div>
</template>
