<script setup lang="ts">
import { purchaseSchema, TRADE_SIDE_LABELS, type PurchaseDto, type PurchaseInput, type SavePurchaseDto, type TradeSide } from '@patrimo/shared'
import type { FormFieldConfig } from '~/types/form'

// Formulaire d'opération (achat, vente ou dividende) : page Opérations, et fenêtre d'ordre avec la valeur déjà choisie (`asset`) ;
// `purchase` : correction d'une opération existante (prérempli avec elle).
const props = defineProps<{ asset?: string, side?: TradeSide, price?: number, purchase?: PurchaseDto }>()
const emit = defineEmits<{ saved: [purchase: PurchaseDto] }>()

const api = useApi()
const toast = useToast()

// Date locale du navigateur (et non UTC : juste après minuit, ce serait encore la veille).
const today = () => new Date().toLocaleDateString('en-CA')
const decimal = (n?: number) => (n === undefined ? '' : String(Math.round(n * 1000) / 1000).replace('.', ','))
const initial = (): PurchaseInput => {
  const p = props.purchase
  if (p) return { side: p.side, asset: p.symbol, boughtAt: p.boughtAt, quantity: decimal(p.quantity), unitPrice: decimal(p.unitPrice), fees: decimal(p.fees) }
  return { side: props.side ?? 'buy', asset: props.asset ?? '', boughtAt: today(), quantity: '', unitPrice: decimal(props.price), fees: '0' }
}
const state = ref<PurchaseInput>(initial())
// Côté choisi : jamais vide (le schéma met « buy » par défaut) ; le dernier cours prérempli n'est pas un montant de dividende.
const side = computed({
  get: () => state.value.side ?? 'buy',
  set: (v: TradeSide) => {
    if (!props.purchase && (v === 'dividend') !== (side.value === 'dividend')) state.value.unitPrice = v === 'dividend' ? '' : decimal(props.price)
    state.value.side = v
  },
})
const dividend = computed(() => side.value === 'dividend')
const SUBMIT_LABELS: Record<TradeSide, string> = { buy: 'Enregistrer l’achat', sell: 'Enregistrer la vente', dividend: 'Enregistrer le dividende' }

const fields = computed<FormFieldConfig<PurchaseInput>[]>(() => [
  ...(props.asset
    ? []
    : [{ name: 'asset' as const, label: 'Valeur', placeholder: 'FR0000120073 ou CW8', icon: 'i-lucide-search', help: 'Code ISIN (sur l’avis d’opéré de ton courtier) ou mnémonique.' }]),
  { name: 'boughtAt', label: 'Date', type: 'date', half: true },
  { name: 'quantity', label: dividend.value ? 'Titres détenus' : 'Quantité', inputmode: 'decimal', placeholder: '10', half: true },
  dividend.value
    ? { name: 'unitPrice', label: 'Par titre (€)', inputmode: 'decimal', placeholder: '3,30', half: true, help: 'Dividende brut par titre.' }
    : { name: 'unitPrice', label: 'Prix unitaire (€)', inputmode: 'decimal', placeholder: '171,585', half: true, help: props.price ? 'Prérempli au dernier cours.' : undefined },
  dividend.value
    ? { name: 'fees', label: 'Retenues (€)', inputmode: 'decimal', placeholder: '0', help: 'Impôts et prélèvements retenus, 0 s’il n’y en a pas.', half: true }
    : { name: 'fees', label: 'Frais (€)', inputmode: 'decimal', placeholder: '1,99', help: 'Courtage, TTF…', half: true },
])

async function save(dto: SavePurchaseDto) {
  let purchase: PurchaseDto
  try {
    purchase = props.purchase
      ? await api<PurchaseDto>(`/purchases/${props.purchase.id}`, { method: 'PUT', body: dto })
      : await api<PurchaseDto>('/purchases', { method: 'POST', body: dto })
  } catch (e) {
    toast.add({ title: `${TRADE_SIDE_LABELS[dto.side]} impossible`, description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  toast.add({
    title: `${TRADE_SIDE_LABELS[purchase.side]} ${props.purchase ? 'modifié' : 'enregistré'}${purchase.side === 'sell' ? 'e' : ''}`,
    description: `${quantity(purchase.quantity)} × ${purchase.name}`,
    color: SIDE_COLOR[purchase.side],
    icon: SIDE_ICON[purchase.side],
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
      :submit-label="purchase ? 'Enregistrer les modifications' : SUBMIT_LABELS[side]"
      :submit-color="SIDE_COLOR[side]"
    />
  </div>
</template>
