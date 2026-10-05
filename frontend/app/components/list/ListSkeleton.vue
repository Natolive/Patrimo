<script setup lang="ts">
// Lignes fantômes pendant le chargement d'une page : même hauteur que les lignes du tableau, colonnes de largeurs variées.
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div class="divide-default divide-y" role="status" aria-label="Chargement…">
    <div v-for="i in rows" :key="i" class="flex items-center gap-6 px-4 py-4">
      <USkeleton class="h-4 w-16 shrink-0" />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <USkeleton class="h-4 w-3/5 max-w-56" />
        <USkeleton class="h-3 w-16" />
      </div>
      <USkeleton class="hidden h-4 w-14 shrink-0 md:block" />
      <USkeleton class="h-4 w-20 shrink-0" />
      <USkeleton class="size-6 shrink-0 rounded-md" />
    </div>
  </div>
</template>
