<script setup lang="ts">
import { updateWatchSchema, type UpdateWatchDto, type UpdateWatchInput, type WatchNewsDto } from '@patrimo/shared'
import type { FormFieldConfig } from '~/types/form'

// Actualités d'une valeur suivie, cherchées sur ses mots-clés (modifiables).
const props = defineProps<{ watchId: string }>()

const api = useApi()
const toast = useToast()
const { data, status, refresh } = useAsyncData(`news:${props.watchId}`, () => api<WatchNewsDto>(`/watches/${props.watchId}/news`), { lazy: true })

const editing = ref(false)
const state = ref<UpdateWatchInput>({ newsQuery: '' })
const fields: FormFieldConfig<UpdateWatchInput>[] = [
  {
    name: 'newsQuery',
    label: 'Mots-clés',
    icon: 'i-lucide-search',
    help: 'OR pour l’un ou l’autre, guillemets pour une expression exacte. Vide = revenir à la suggestion.',
  },
]

function edit() {
  state.value = { newsQuery: data.value?.suggested ? '' : (data.value?.query ?? '') }
  editing.value = true
}

async function save(dto: UpdateWatchDto) {
  try {
    await api(`/watches/${props.watchId}`, { method: 'PATCH', body: dto })
  } catch (e) {
    toast.add({ title: 'Enregistrement impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  editing.value = false
  toast.add({ title: 'Mots-clés enregistrés', color: 'success', icon: 'i-lucide-check' })
  await refresh()
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 xl:max-h-[calc(100dvh-16rem)] xl:overflow-y-auto' }">
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-highlighted flex items-center gap-2 font-semibold"><UIcon name="i-lucide-newspaper" class="size-5" />Actualités</h2>
          <p v-if="data" class="text-muted truncate text-sm">
            {{ data.query }}<span v-if="data.suggested"> · suggestion</span>
          </p>
        </div>
        <UButton v-if="!editing" icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" aria-label="Modifier les mots-clés" @click="edit" />
      </div>
    </template>

    <div v-if="editing" class="border-default border-b p-4">
      <FormBuilder v-model:state="state" :schema="updateWatchSchema" :fields="fields" :submit="save" submit-label="Enregistrer les mots-clés" />
      <UButton label="Annuler" color="neutral" variant="ghost" class="mt-2" @click="editing = false" />
    </div>

    <p v-if="status === 'pending' && !data" class="text-muted p-4">Recherche des actualités…</p>
    <p v-else-if="!data?.items.length" class="text-muted p-4">Aucun article sur ces mots-clés depuis 14 jours : essaie des mots plus larges.</p>
    <NewsList v-else :items="data.items" />
    <template #footer>
      <p class="text-dimmed text-xs">Via Google Actualités. De l’information, pas un conseil d’investissement.</p>
    </template>
  </UCard>
</template>
