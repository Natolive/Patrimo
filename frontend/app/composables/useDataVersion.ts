// Compteur partagé : une opération ou un suivi ajouté ailleurs (fenêtre d'ordre, recherche) fait recharger les listes de la page.
export const useDataVersion = () => {
  const version = useState('data:version', () => 0)
  async function bump() {
    version.value++
    await refreshNuxtData()
  }
  return { version, bump }
}
