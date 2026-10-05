<script setup lang="ts">
// Courbes sur un axe de dates (une séance = un pas), avec réticule et infobulle au survol ou aux flèches du clavier.
// `markers` : points posés sur la première série (achats) ; `reference` : ligne horizontale (prix de revient).
export interface ChartSeries {
  key: string
  label: string
  color: string
  values: (number | null)[]
}

const props = defineProps<{
  dates: string[]
  series: ChartSeries[]
  format: (value: number) => string
  markers?: { date: string, label: string }[]
  reference?: { value: number, label: string }
  label: string
}>()

const HEIGHT = 280
const PAD = { top: 12, right: 12, bottom: 28, left: 64 }

const root = ref<HTMLElement>()
const width = ref(600)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => (width.value = entry!.contentRect.width))
  observer.observe(root.value!)
})
onBeforeUnmount(() => observer?.disconnect())

// Graduations rondes (1, 2, 2,5 ou 5 × 10ⁿ) qui encadrent les valeurs.
const ticks = computed(() => {
  const values = props.series.flatMap((s) => s.values).filter((v): v is number => v !== null)
  if (props.reference) values.push(props.reference.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const raw = (max - min || Math.abs(max) || 1) / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!
  const result = []
  for (let v = Math.floor(min / step) * step; ; v += step) {
    result.push(Number(v.toFixed(10)))
    if (v >= max) break
  }
  return result
})

const innerWidth = computed(() => Math.max(width.value - PAD.left - PAD.right, 1))
const x = (i: number) => PAD.left + (props.dates.length > 1 ? (i / (props.dates.length - 1)) * innerWidth.value : innerWidth.value / 2)
const y = (v: number) => {
  const lo = ticks.value[0]!
  const hi = ticks.value.at(-1)!
  return PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (HEIGHT - PAD.top - PAD.bottom)
}

// Trait interrompu là où la série n'a pas de valeur (moyenne mobile pas encore calculable).
const path = (values: (number | null)[]) =>
  values.reduce((d, v, i) => (v === null ? d : `${d}${d && values[i - 1] != null ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`), '')

// Repère posé sur la première séance à partir de sa date (achat un jour sans cotation) ; avant la période affichée, rien.
const markerPoints = computed(() =>
  (props.markers ?? []).flatMap((m) => {
    if (!props.dates[0] || m.date < props.dates[0]) return []
    const i = props.dates.findIndex((d) => d >= m.date)
    const v = props.series[0]?.values[i]
    return i < 0 || v == null ? [] : [{ ...m, i, cx: x(i), cy: y(v) }]
  }),
)

const xTicks = computed(() => {
  const n = props.dates.length
  const count = Math.min(n, Math.max(2, Math.floor(innerWidth.value / 110)))
  return Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / Math.max(count - 1, 1)))
})

const active = ref<number | null>(null)
function onPointer(e: PointerEvent) {
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  const ratio = (e.clientX - rect.left - PAD.left) / innerWidth.value
  active.value = Math.min(props.dates.length - 1, Math.max(0, Math.round(ratio * (props.dates.length - 1))))
}
function onKey(e: KeyboardEvent) {
  const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
  if (!step) return
  e.preventDefault()
  active.value = Math.min(props.dates.length - 1, Math.max(0, (active.value ?? props.dates.length - 1) + step))
}

const tooltip = computed(() => {
  const i = active.value
  if (i === null) return null
  const left = x(i)
  return {
    left,
    flip: left > width.value / 2,
    date: longDate(props.dates[i]!),
    rows: props.series.flatMap((s) => (s.values[i] == null ? [] : [{ ...s, value: props.format(s.values[i]!) }])),
    markers: markerPoints.value.filter((m) => m.i === i),
  }
})
</script>

<template>
  <figure ref="root" class="relative">
    <figcaption class="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
      <span v-for="s in series" :key="s.key" class="flex items-center gap-2">
        <span class="h-0.5 w-4 rounded-full" :style="{ background: s.color }" />{{ s.label }}
      </span>
      <span v-if="reference" class="flex items-center gap-2"><span class="h-px w-4 bg-(--ui-text-muted)" />{{ reference.label }}</span>
      <span v-if="markerPoints.length" class="flex items-center gap-2">
        <span class="size-2.5 rounded-full border-2 border-(--ui-bg) bg-(--ui-text-highlighted) ring-1 ring-(--ui-text-highlighted)" />Achats
      </span>
    </figcaption>

    <svg
      :width="width"
      :height="HEIGHT"
      class="block touch-none overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      role="img"
      :aria-label="label"
      tabindex="0"
      @pointermove="onPointer"
      @pointerleave="active = null"
      @blur="active = null"
      @keydown="onKey"
    >
      <g class="text-xs tabular-nums" fill="var(--ui-text-muted)">
        <template v-for="t in ticks" :key="t">
          <line :x1="PAD.left" :x2="width - PAD.right" :y1="y(t)" :y2="y(t)" stroke="var(--ui-border)" />
          <text :x="PAD.left - 8" :y="y(t)" text-anchor="end" dominant-baseline="middle">{{ format(t) }}</text>
        </template>
        <text v-for="i in xTicks" :key="i" :x="x(i)" :y="HEIGHT - 6" :text-anchor="i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle'">
          {{ shortDate(dates[i]!) }}
        </text>
      </g>

      <g v-if="reference">
        <line :x1="PAD.left" :x2="width - PAD.right" :y1="y(reference.value)" :y2="y(reference.value)" stroke="var(--ui-text-muted)" />
        <text :x="width - PAD.right" :y="y(reference.value) - 6" text-anchor="end" class="text-xs" fill="var(--ui-text-toned)">{{ reference.label }} {{ format(reference.value) }}</text>
      </g>

      <path
        v-for="s in [...series].reverse()"
        :key="s.key"
        :d="path(s.values)"
        fill="none"
        :stroke="s.color"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <circle v-for="m in markerPoints" :key="`${m.date}-${m.label}`" :cx="m.cx" :cy="m.cy" r="5" fill="var(--ui-text-highlighted)" stroke="var(--ui-bg)" stroke-width="2" />

      <g v-if="active !== null">
        <line :x1="x(active)" :x2="x(active)" :y1="PAD.top" :y2="HEIGHT - PAD.bottom" stroke="var(--ui-text-dimmed)" />
        <template v-for="s in series" :key="s.key">
          <circle v-if="s.values[active] != null" :cx="x(active)" :cy="y(s.values[active]!)" r="4" :fill="s.color" stroke="var(--ui-bg)" stroke-width="2" />
        </template>
      </g>
    </svg>

    <div
      v-if="tooltip"
      class="pointer-events-none absolute top-8 z-10 min-w-44 rounded-md border border-default bg-default p-3 text-sm shadow-lg"
      :style="tooltip.flip ? { right: `${width - tooltip.left + 12}px` } : { left: `${tooltip.left + 12}px` }"
    >
      <p class="text-muted mb-2">{{ tooltip.date }}</p>
      <p v-for="row in tooltip.rows" :key="row.key" class="flex items-center gap-2">
        <span class="h-0.5 w-3 rounded-full" :style="{ background: row.color }" />
        <span class="text-highlighted font-semibold tabular-nums">{{ row.value }}</span>
        <span class="text-muted">{{ row.label }}</span>
      </p>
      <p v-for="m in tooltip.markers" :key="m.label" class="text-highlighted mt-2 flex items-center gap-2 font-medium">
        <UIcon name="i-lucide-shopping-cart" class="size-4" />{{ m.label }}
      </p>
    </div>
  </figure>
</template>
