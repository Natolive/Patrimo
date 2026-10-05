<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <h1 class="text-highlighted text-2xl font-bold tracking-tight">Bonjour {{ user?.firstName }}</h1>
  </div>
</template>
