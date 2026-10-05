<script setup lang="ts">
import { purchaseSchema, TRADE_SIDE_LABELS, type PurchaseDto, type PurchaseInput, type SavePurchaseDto, type TradeSide } from '@patrimo/shared'
import type { FormFieldConfig } from '~/types/form'

// Formulaire d'opération (achat ou vente) : page Opérations, et fenêtre d'ordre avec la valeur déjà choisie (`asset`).
const props = defineProps<{ asset?: string, side?: TradeSide, price?: number }>()
const emit = defineEmits<{ saved: [purchase: PurchaseDto] }>()

const api = useApi()
const toast = useToast()

// Date locale du navigateur (et non UTC : juste après minuit, ce serait encore la veille).
const today = () => new Date().toLocaleDateString('en-CA')
const decimal = (n?: number) => (n === undefined ? '' : String(Math.round(n * 1000) / 1000).replace('.', ','))
const initial = (): PurchaseInput => ({ side: props.side ?? 'buy', asset: props.asset ?? '', boughtAt: today(), quantity: '', unitPrice: decimal(props.price), fees: '0' })
const state = ref<PurchaseInput>(initial())
// Côté choisi : jamais vide (le schéma met « buy » par défaut).
const side = computed({ get: () => state.value.side ?? 'buy', set: (v: TradeSide) => (state.value.side = v) })

const fields = computed<FormFieldConfig<PurchaseInput>[]>(() => [
  ...(props.asset
    ? []
    : [{ name: 'asset' as const, label: 'Valeur', placeholder: 'FR0000120073 ou CW8', icon: 'i-lucide-search', help: 'Code ISIN (sur l’avis d’opéré de ton courtier) ou mnémonique.' }]),
  { name: 'boughtAt', label: 'Date', type: 'date', half: true },
  { name: 'quantity', label: 'Quantité', inputmode: 'decimal', placeholder: '10', half: true },
  { name: 'unitPrice', label: 'Prix unitaire (€)', inputmode: 'decimal', placeholder: '171,585', half: true, help: props.price ? 'Prérempli au dernier cours.' : undefined },
  { name: 'fees', label: 'Frais (€)', inputmode: 'decimal', placeholder: '1,99', help: 'Courtage, TTF…', half: true },
])

async function save(dto: SavePurchaseDto) {
  let purchase: PurchaseDto
  try {
    purchase = await api<PurchaseDto>('/purchases', { method: 'POST', body: dto })
  } catch (e) {
    toast.add({ title: `${TRADE_SIDE_LABELS[dto.side]} impossible`, description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  toast.add({
    title: `${TRADE_SIDE_LABELS[purchase.side]} enregistré${purchase.side === 'sell' ? 'e' : ''}`,
    description: `${quantity(purchase.quantity)} × ${purchase.name}`,
    color: purchase.side === 'buy' ? 'success' : 'error',
    icon: purchase.side === 'buy' ? 'i-lucide-arrow-down-to-line' : 'i-lucide-arrow-up-from-line',
  })
  state.value = { ...initial(), side: purchase.side }
  emit('saved', purchase)
}
</script>

<template>
  <div class="space-y-6">
    <OrderSideToggle v-model="side" />
    <FormBuilder
      v-model:state="state"
      :schema="purchaseSchema"
      :fields="fields"
      :submit="save"
      :submit-label="side === 'buy' ? 'Enregistrer l’achat' : 'Enregistrer la vente'"
      :submit-color="side === 'buy' ? 'success' : 'error'"
    />
  </div>
</template>
