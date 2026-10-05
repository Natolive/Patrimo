<script setup lang="ts">
import { purchaseSchema, TRADE_SIDE_LABELS, TRADE_SIDES, type PurchaseDto, type PurchaseInput, type SavePurchaseDto } from '@patrimo/shared'
import type { TableColumn } from '@nuxt/ui'
import type { FormFieldConfig } from '~/types/form'

useHead({ title: 'Opérations' })

const api = useApi()
const toast = useToast()
const { data: purchases, refresh } = await useAsyncData('purchases', () => api<PurchaseDto[]>('/purchases'))

const today = () => new Date().toISOString().slice(0, 10)
const empty = (): PurchaseInput => ({ side: 'buy', asset: '', boughtAt: today(), quantity: '', unitPrice: '', fees: '0' })
const state = ref<PurchaseInput>(empty())
const fields: FormFieldConfig<PurchaseInput>[] = [
  { name: 'side', label: 'Opération', type: 'select', options: TRADE_SIDES.map((value) => ({ value, label: TRADE_SIDE_LABELS[value] })) },
  {
    name: 'asset',
    label: 'Valeur',
    placeholder: 'FR0000120073 ou CW8',
    icon: 'i-lucide-search',
    help: 'Code ISIN (sur l’avis d’opéré de ton courtier) ou mnémonique.',
  },
  { name: 'boughtAt', label: 'Date', type: 'date', half: true },
  { name: 'quantity', label: 'Quantité', inputmode: 'decimal', placeholder: '10', half: true },
  { name: 'unitPrice', label: 'Prix unitaire (€)', inputmode: 'decimal', placeholder: '171,585', half: true },
  { name: 'fees', label: 'Frais (€)', inputmode: 'decimal', placeholder: '1,99', help: 'Courtage, TTF…', half: true },
]

// Dernière opération ajoutée, surlignée dans la liste.
const added = ref<string>()

async function add(dto: SavePurchaseDto) {
  try {
    const purchase = await api<PurchaseDto>('/purchases', { method: 'POST', body: dto })
    added.value = purchase.id
    toast.add({
      title: `${TRADE_SIDE_LABELS[purchase.side]} ajouté${purchase.side === 'sell' ? 'e' : ''}`,
      description: `${quantity(purchase.quantity)} × ${purchase.name}`,
      color: 'success',
      icon: 'i-lucide-check',
    })
  } catch (e) {
    toast.add({ title: 'Ajout impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  state.value = empty()
  await refresh()
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
  await refresh()
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
    <UCard>
      <template #header>
        <h1 class="text-highlighted font-semibold">Ajouter une opération</h1>
      </template>
      <FormBuilder v-model:state="state" :schema="purchaseSchema" :fields="fields" :submit="add" submit-label="Ajouter l’opération" />
    </UCard>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <h2 class="text-highlighted font-semibold">Mes opérations</h2>
      </template>
      <UTable
        :data="purchases ?? []"
        :columns="columns"
        :meta="{ class: { tr: (row) => (row.original.id === added ? 'flash' : '') } }"
        class="tabular-nums" empty="Aucune opération pour l’instant : ajoute ton premier achat avec le formulaire.">
        <template #boughtAt-cell="{ row }">{{ shortDate(row.original.boughtAt) }}</template>
        <template #side-cell="{ row }">
          <UBadge
            :label="TRADE_SIDE_LABELS[row.original.side]"
            :icon="row.original.side === 'buy' ? 'i-lucide-arrow-down-to-line' : 'i-lucide-arrow-up-from-line'"
            :color="row.original.side === 'buy' ? 'primary' : 'neutral'"
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
          <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" :aria-label="`Supprimer l’opération sur ${row.original.name}`" @click="removing = row.original" />
        </template>
      </UTable>
    </UCard>

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
