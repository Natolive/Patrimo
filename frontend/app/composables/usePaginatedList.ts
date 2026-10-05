import type { PageDto } from '@patrimo/shared'

// Liste chargée page par page au défilement (`ListSentinel` appelle `loadMore`) ; `reset()` recharge depuis le début
// après un ajout ou une suppression. Une réponse arrivée après un `reset` est ignorée.
export function usePaginatedList<T>(path: string, query: () => Record<string, string> = () => ({}), pageSize = 20) {
  const api = useApi()
  const items = ref([]) as Ref<T[]>
  const total = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<unknown>(null)
  const done = computed(() => total.value !== null && items.value.length >= total.value)
  let generation = 0

  async function loadMore() {
    if (loading.value || done.value) return
    const current = generation
    loading.value = true
    error.value = null
    try {
      const page = await api<PageDto<T>>(path, { query: { ...query(), offset: items.value.length, limit: pageSize } })
      if (current !== generation) return
      items.value = [...items.value, ...page.items]
      total.value = page.total
    } catch (e) {
      if (current === generation) error.value = e
    } finally {
      if (current === generation) loading.value = false
    }
  }

  async function reset() {
    generation++
    items.value = []
    total.value = null
    loading.value = false
    error.value = null
    await loadMore()
  }

  void loadMore()
  // Opération ou suivi ajouté ailleurs (fenêtre d'ordre) : la liste repart de la première page.
  watch(useDataVersion().version, () => reset())
  return { items, total, loading, error, done, loadMore, reset }
}
