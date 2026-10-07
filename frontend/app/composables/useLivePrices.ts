import type { PriceTickDto } from '@patrimo/shared'

// Cours en direct : une seule connexion WebSocket (`/stream` de l'API) pour tout l'onglet, ouverte au premier écouteur.
// À chaque changement, le serveur reçoit la liste complète des valeurs écoutées par les composants affichés.
interface Listener {
  symbols: () => string[]
  onTick: (tick: PriceTickDto) => void
}
const listeners = new Set<Listener>()
let socket: WebSocket | undefined
const RETRY_MS = 5000

function sync() {
  if (socket?.readyState !== WebSocket.OPEN) return
  const symbols = [...new Set([...listeners].flatMap((l) => l.symbols()))]
  socket.send(JSON.stringify({ event: 'subscribe', data: { symbols } }))
}

// ponytail: la connexion reste ouverte entre deux pages (pas de va-et-vient à chaque navigation) ; la fermer quand plus personne n'écoute si ça compte.
function connect(url: string) {
  if (socket) return
  socket = new WebSocket(url)
  socket.onopen = sync
  socket.onmessage = (e: MessageEvent<string>) => {
    const { event, data } = JSON.parse(e.data) as { event: string, data: PriceTickDto }
    if (event !== 'tick') return
    for (const l of listeners) if (l.symbols().includes(data.symbol)) l.onTick(data)
  }
  // Coupure (serveur redémarré, réseau) : reconnexion tant qu'un composant écoute ; 4401 = plus de session.
  socket.onclose = (e) => {
    socket = undefined
    if (listeners.size && e.code !== 4401) setTimeout(() => listeners.size && connect(url), RETRY_MS)
  }
}

// Appelle `onTick` à chaque cotation d'une des valeurs, tant que le composant est affiché.
// Inscrit dès le setup, pas dans `onMounted` : dans une page qui attend ses données (`await useAsyncData`), un `onMounted`
// enregistré après l'`await` ne part pas lors d'une navigation, et la page arrivée ne se réabonnait jamais. Ici, la nouvelle
// page s'inscrit avant que l'ancienne se retire : l'abonnement ne passe jamais par une liste vide. (SPA : `window` existe.)
export function useLivePrices(symbols: () => string[], onTick: (tick: PriceTickDto) => void) {
  const { public: { apiUrl } } = useRuntimeConfig()
  const listener = { symbols, onTick }
  listeners.add(listener)
  const url = new URL(`${apiUrl}/stream`, location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  connect(url.href)
  sync()
  watch(() => symbols().join(), sync)
  // Fin du composant (démonté, ou navigation annulée avant l'affichage) : il ne compte plus dans l'abonnement.
  onScopeDispose(() => {
    listeners.delete(listener)
    sync()
  })
}

// Données de la page (valorisation, plus-values…) relues quand une de ses valeurs cote, au plus une fois toutes les 5 s.
export function useLiveRefresh(symbols: () => string[], refresh: () => unknown) {
  let timer: ReturnType<typeof setTimeout> | undefined
  useLivePrices(symbols, () => {
    timer ??= setTimeout(() => {
      timer = undefined
      void refresh()
    }, 5000)
  })
  onScopeDispose(() => clearTimeout(timer))
}
