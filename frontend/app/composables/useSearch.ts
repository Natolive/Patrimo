// Ouverture de la recherche globale (⌘K) depuis n'importe où : en-tête, page Suivi…
export const useSearch = () => {
  const open = useState('search:open', () => false)
  return { open, openSearch: () => (open.value = true) }
}
