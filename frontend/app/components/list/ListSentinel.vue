<script setup lang="ts">
// Repère placé sous une liste : émet `visible` quand il approche de l'écran (300 px avant) et que `active` est vrai.
// Réobservé à chaque réactivation : si la page chargée ne remplit pas l'écran, la suivante part aussitôt.
const props = defineProps<{ active: boolean }>()
const emit = defineEmits<{ visible: [] }>()
const el = ref<HTMLElement>()
let observer: IntersectionObserver | undefined

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && props.active && emit('visible'), { rootMargin: '300px' })
  observer.observe(el.value!)
})
watch(() => props.active, (active) => {
  if (!active || !observer || !el.value) return
  observer.unobserve(el.value)
  observer.observe(el.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="el" aria-hidden="true" class="h-px" />
</template>
