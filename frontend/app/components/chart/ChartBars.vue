<script setup lang="ts">
// Barres horizontales classées, une ligne par élément (nom à gauche, valeur au bout de la barre).
// `diverging` : barres de part et d'autre de zéro, gain en vert et perte en rouge, toujours signées ; sinon une seule couleur (part d'un tout).
export interface BarRow {
  key: string
  label: string
  sub?: string
  value: number
  to?: string
}

const props = defineProps<{ rows: BarRow[], format: (value: number) => string, diverging?: boolean, label: string }>()

const max = computed(() => Math.max(...props.rows.map((r) => Math.abs(r.value)), Number.EPSILON))
// Part de la demi-largeur (divergent) ou de la largeur (simple), au moins 2 % pour qu'une petite valeur reste visible.
const size = (value: number) => `${Math.max(2, (Math.abs(value) / max.value) * 100)}%`
</script>

<template>
  <ul class="space-y-1.5" :aria-label="label">
    <li v-for="(row, i) in rows" :key="row.key" class="cascade grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,13rem)_1fr]" :style="{ '--i': i }">
      <NuxtLink v-if="row.to" :to="row.to" class="group min-w-0 text-sm">
        <span class="text-highlighted group-hover:text-primary block truncate font-medium">{{ row.label }}</span>
        <span v-if="row.sub" class="text-muted block text-xs">{{ row.sub }}</span>
      </NuxtLink>
      <span v-else class="min-w-0 text-sm">
        <span class="text-highlighted block truncate font-medium">{{ row.label }}</span>
        <span v-if="row.sub" class="text-muted block text-xs">{{ row.sub }}</span>
      </span>

      <div v-if="diverging" class="grid grid-cols-2 items-center">
        <div class="flex justify-end border-e border-(--ui-border-accented) pe-px">
          <span v-if="row.value < 0" class="text-muted me-2 self-center text-xs tabular-nums">{{ format(row.value) }}</span>
          <span v-if="row.value < 0" class="bar h-5 rounded-s-[4px] bg-(--ui-error)" :style="{ width: size(row.value) }" />
        </div>
        <div class="flex items-center ps-px">
          <span v-if="row.value >= 0" class="bar h-5 rounded-e-[4px] bg-(--ui-success)" :style="{ width: size(row.value) }" />
          <span v-if="row.value >= 0" class="text-muted ms-2 text-xs tabular-nums">{{ format(row.value) }}</span>
        </div>
      </div>
      <div v-else class="flex items-center">
        <span class="bar h-5 rounded-e-[4px] bg-(--color-chart-1)" :style="{ width: size(row.value) }" />
        <span class="text-muted ms-2 shrink-0 text-xs tabular-nums">{{ format(row.value) }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
/* Barre qui pousse depuis sa base à l'affichage. */
.bar {
  max-width: calc(100% - 4.5rem);
  transform-origin: left;
  animation: grow .5s cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(min(var(--i, 0), 12) * 30ms);
}
.rounded-s-\[4px\] { transform-origin: right; }
@keyframes grow {
  from { transform: scaleX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .bar { animation: none; }
}
</style>
