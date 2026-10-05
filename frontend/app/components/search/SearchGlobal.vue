<script setup lang="ts">
import type { AssetSuggestionDto } from '@patrimo/shared'
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'

// Recherche de n'importe quelle action ou ETF (⌘K / Ctrl+K) ; valider ouvre sa fiche, où l'encart permet d'acheter, vendre ou suivre.
const api = useApi()
const { open } = useSearch()
defineShortcuts({ meta_k: () => (open.value = !open.value) })

const term = ref('')
const results = ref<AssetSuggestionDto[]>([])
const loading = ref(false)

// Résultats pendant la frappe, 300 ms après la dernière touche ; une réponse dépassée par une frappe plus récente est ignorée.
let timer: ReturnType<typeof setTimeout> | undefined
let latest = ''
watch(term, (q) => {
  clearTimeout(timer)
  if (q.trim().length < 2) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  timer = setTimeout(async () => {
    latest = q
    const found = await api<AssetSuggestionDto[]>('/markets/search', { query: { q } }).catch(() => [])
    if (latest !== q) return
    results.value = found
    loading.value = false
  }, 300)
})

async function show(asset: AssetSuggestionDto) {
  open.value = false
  await navigateTo(`/assets/${encodeURIComponent(asset.symbol)}`)
}

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [
  {
    id: 'assets',
    label: 'Valeurs',
    ignoreFilter: true,
    items: results.value.map((r) => ({
      id: r.symbol,
      label: r.name,
      // Symbole et place sur une seconde ligne : ils distinguent les cotations d'une même valeur (Paris, Francfort…).
      description: `${r.symbol} · ${r.exchange} · ${r.type === 'etf' ? 'ETF' : 'Action'}`,
      icon: r.type === 'etf' ? 'i-lucide-layers' : 'i-lucide-building-2',
      onSelect: () => show(r),
    })),
  },
])

watch(open, (o) => {
  if (o) return
  term.value = ''
  results.value = []
})
</script>

<template>
  <div>
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-search"
      aria-label="Rechercher une valeur"
      class="text-muted w-9 justify-center sm:w-64 sm:justify-start"
      :ui="{ label: 'hidden sm:inline' }"
      label="Rechercher une valeur…"
      @click="open = true"
    >
      <template #trailing>
        <span class="ms-auto hidden gap-0.5 sm:flex"><UKbd value="meta" /><UKbd value="K" /></span>
      </template>
    </UButton>

    <UModal v-model:open="open" title="Rechercher une valeur" description="Action ou ETF, par nom, code ISIN ou mnémonique" :ui="{ content: 'sm:max-w-xl', header: 'sr-only' }">
      <template #content>
        <UCommandPalette
          v-model:search-term="term"
          :groups="groups"
          :loading="loading"
          placeholder="Nom, code ISIN ou mnémonique (ex. LVMH, FR0000120073, CW8)"
          :close="true"
          class="h-96"
          @update:open="(o: boolean) => !o && (open = false)"
        >
          <template #empty>
            <p class="text-muted p-6 text-center text-sm">{{ term.trim().length < 2 ? 'Saisis au moins 2 caractères.' : loading ? 'Recherche…' : 'Aucune action ni ETF ne correspond.' }}</p>
          </template>
        </UCommandPalette>
      </template>
    </UModal>
  </div>
</template>
