<script setup lang="ts">
// Graphique boursier (bibliothèque lightweight-charts) : bougies, volumes, zoom à la molette ou au pincement, glisser pour se déplacer.
// Les temps arrivent à l'heure de la place comptée comme UTC : on les affiche donc en UTC.
// `push` (exposé) applique une cotation en direct : la bougie en cours bouge, ou une nouvelle s'ouvre.
import type { CandleDto, PriceTickDto, TradeSide } from '@patrimo/shared'
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'

export interface CandleOverlay {
  key: string
  label: string
  color: string
  points: { time: number, value: number }[]
}

const props = defineProps<{
  candles: CandleDto[]
  // Durée d'une bougie et décalage de la place sur UTC, en secondes (pour placer une cotation en direct).
  step: number
  offset: number
  intraday: boolean
  currency: string
  label: string
  // Début de la zone affichée au changement de période (sinon tout) ; les cotations en direct ne la touchent pas.
  from?: number
  overlays?: CandleOverlay[]
  markers?: { time: number, label: string, side: TradeSide }[]
  reference?: { value: number, label: string }
}>()

// Hausse/baisse : vert de `--color-chart-1`, rouge de Tailwind (red-600) ; le canevas ne lit pas les variables CSS.
const UP = '#16a34a'
const DOWN = '#dc2626'
// Repères des opérations, couleurs de SIDE_COLOR : achat sous la bougie, vente au-dessus, dividende en point bleu.
const MARKER = {
  buy: { color: UP, position: 'belowBar', shape: 'arrowUp' },
  sell: { color: DOWN, position: 'aboveBar', shape: 'arrowDown' },
  dividend: { color: '#2563eb', position: 'belowBar', shape: 'circle' },
} as const satisfies Record<TradeSide, object>

const root = ref<HTMLElement>()
let chart: IChartApi | undefined
let candleSeries: ISeriesApi<'Candlestick'> | undefined
let volumeSeries: ISeriesApi<'Histogram'> | undefined
let lines: ISeriesApi<'Line'>[] = []
let markerPlugin: ISeriesMarkersPluginApi<Time> | undefined
let priceLine: IPriceLine | undefined

// Bougies affichées : celles chargées, plus le direct ; `dayVolume` précédent pour le volume échangé entre deux cotations.
const bars = shallowRef<CandleDto[]>([])
let dayVolume: number | undefined
const hovered = ref<CandleDto>()
const shown = computed(() => hovered.value ?? bars.value.at(-1))

const timeLabel = (time: number) =>
  new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: props.intraday ? undefined : 'numeric',
    hour: props.intraday ? '2-digit' : undefined,
    minute: props.intraday ? '2-digit' : undefined,
  }).format(time * 1000)
const volume = (v: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)

// Le canevas ne lit pas les variables CSS : `var(--color-chart-2)` est résolue sur la page.
const cssColor = (color: string) => (color.startsWith('var(') ? getComputedStyle(root.value!).getPropertyValue(color.slice(4, -1)).trim() : color)
const t = (time: number) => time as UTCTimestamp
const toCandle = (c: CandleDto) => ({ time: t(c.time), open: c.open, high: c.high, low: c.low, close: c.close })
const toVolume = (c: CandleDto) => ({ time: t(c.time), value: c.volume, color: c.close >= c.open ? `${UP}55` : `${DOWN}55` })

function drawCandles() {
  if (!chart || !candleSeries || !volumeSeries) return
  bars.value = props.candles
  dayVolume = undefined
  chart.applyOptions({ timeScale: { timeVisible: props.intraday, secondsVisible: false } })
  candleSeries.setData(props.candles.map(toCandle))
  volumeSeries.setData(props.candles.map(toVolume))
  drawExtras()
}

// Moyennes mobiles, repères et PRU : redessinés seuls quand les données de la page sont relues (le direct reste).
function drawExtras() {
  if (!chart || !candleSeries) return
  for (const line of lines) chart.removeSeries(line)
  lines = (props.overlays ?? []).map((o) => {
    const line = chart!.addSeries(LineSeries, { color: cssColor(o.color), lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false })
    line.setData(o.points.map((p) => ({ time: t(p.time), value: p.value })))
    return line
  })

  // Repère posé sur la première bougie à partir de sa date (opération un jour sans cotation).
  markerPlugin!.setMarkers(
    (props.markers ?? []).flatMap((m) => {
      const candle = bars.value.find((c) => c.time >= m.time)
      return candle ? [{ time: t(candle.time), ...MARKER[m.side], text: m.label }] : []
    }),
  )

  if (priceLine) candleSeries.removePriceLine(priceLine)
  priceLine = props.reference
    ? candleSeries.createPriceLine({ price: props.reference.value, color: '#64748b', lineWidth: 1, lineStyle: LineStyle.Dashed, title: props.reference.label })
    : undefined
}

function frame() {
  const last = props.candles.at(-1)
  if (!chart || !last) return
  if (props.from && props.from > props.candles[0]!.time) chart.timeScale().setVisibleRange({ from: t(props.from), to: t(last.time) })
  else chart.timeScale().fitContent()
}

onMounted(() => {
  chart = createChart(root.value!, {
    autoSize: true,
    layout: { background: { color: 'transparent' }, textColor: '#64748b', fontFamily: 'inherit', attributionLogo: false },
    grid: { vertLines: { visible: false }, horzLines: { color: '#e2e8f0' } },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false },
    localization: {
      locale: 'fr-FR',
      priceFormatter: (v: number) => unitMoney(v, props.currency),
      timeFormatter: (time: Time) => timeLabel(time as number),
    },
  })
  candleSeries = chart.addSeries(CandlestickSeries, { upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN })
  volumeSeries = chart.addSeries(HistogramSeries, { priceScaleId: '', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false })
  volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
  markerPlugin = createSeriesMarkers(candleSeries, [])
  chart.subscribeCrosshairMove((p) => {
    hovered.value = p.time === undefined ? undefined : bars.value.find((c) => c.time === p.time)
  })
  drawCandles()
  frame()
})
onBeforeUnmount(() => chart?.remove())

watch(() => props.candles, drawCandles)
watch(() => [props.overlays, props.markers, props.reference], drawExtras)
// Nouvelle période : recadrage ; cotations en direct : la vue (zoom, déplacement) reste.
watch(() => [props.from, props.intraday, props.candles[0]?.time], frame)

function push(tick: PriceTickDto) {
  const last = bars.value.at(-1)
  const time = Math.floor(Date.parse(tick.time) / 1000) + props.offset
  if (!last || time < last.time || !candleSeries || !volumeSeries) return
  const traded = dayVolume === undefined ? 0 : Math.max(tick.dayVolume - dayVolume, 0)
  dayVolume = tick.dayVolume
  const price = tick.price
  // Créneaux calés sur la première bougie (ouverture de séance) : Yahoo date la bougie en cours de sa dernière transaction.
  const first = bars.value[0]!.time
  const slot = (seconds: number) => first + Math.floor((seconds - first) / props.step) * props.step
  const bar: CandleDto =
    slot(time) === slot(last.time)
      ? { ...last, high: Math.max(last.high, price), low: Math.min(last.low, price), close: price, volume: last.volume + traded }
      : { time: slot(time), open: price, high: price, low: price, close: price, volume: traded }
  bars.value = bar.time === last.time ? [...bars.value.slice(0, -1), bar] : [...bars.value, bar]
  candleSeries.update(toCandle(bar))
  volumeSeries.update(toVolume(bar))
}
defineExpose({ push })
</script>

<template>
  <figure>
    <figcaption class="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
      <template v-if="shown">
        <span class="text-muted">{{ timeLabel(shown.time) }}</span>
        <span class="tabular-nums"><span class="text-muted">Ouv.</span> {{ unitMoney(shown.open, currency) }}</span>
        <span class="tabular-nums"><span class="text-muted">Haut</span> {{ unitMoney(shown.high, currency) }}</span>
        <span class="tabular-nums"><span class="text-muted">Bas</span> {{ unitMoney(shown.low, currency) }}</span>
        <span class="tabular-nums font-medium" :class="gainClass(shown.close - shown.open)"><span class="text-muted font-normal">Clôt.</span> {{ unitMoney(shown.close, currency) }}</span>
        <span class="tabular-nums"><span class="text-muted">Vol.</span> {{ volume(shown.volume) }}</span>
      </template>
      <span v-for="o in overlays" :key="o.key" class="text-muted flex items-center gap-2">
        <span class="h-0.5 w-4 rounded-full" :style="{ background: o.color }" />{{ o.label }}
      </span>
      <span v-if="reference" class="text-muted flex items-center gap-2"><span class="w-4 border-t border-dashed border-(--ui-text-muted)" />{{ reference.label }}</span>
    </figcaption>
    <div ref="root" class="h-80 sm:h-96" role="img" :aria-label="label" />
  </figure>
</template>
