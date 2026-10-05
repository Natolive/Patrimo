<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()
const toast = useToast()

async function onLogout() {
  try {
    await logout()
  } catch (e) {
    toast.add({ title: 'Déconnexion impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  await navigateTo('/login')
}

const nav = [
  { label: 'Tableau de bord', icon: 'i-lucide-chart-line', to: '/' },
  { label: 'Opérations', icon: 'i-lucide-receipt-euro', to: '/purchases' },
  { label: 'Suivi', icon: 'i-lucide-eye', to: '/watchlist' },
]

const fullName = computed(() => `${user.value?.firstName ?? ''} ${user.value?.lastName ?? ''}`.trim())

const menu = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: fullName.value, description: user.value?.email }],
  [{ label: 'Se déconnecter', icon: 'i-lucide-log-out', color: 'error', onSelect: onLogout }],
])
</script>

<template>
  <div class="min-h-dvh">
    <header class="bg-default/75 border-default sticky top-0 z-40 border-b backdrop-blur-lg">
      <div class="mx-auto flex h-16 max-w-[96rem] items-center justify-between gap-2 px-4 sm:px-6">
        <div class="flex items-center gap-4 sm:gap-8">
          <NuxtLink to="/" class="rounded-md text-xl focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Patrimo, tableau de bord"><BrandLogo /></NuxtLink>
          <UNavigationMenu :items="nav" />
        </div>
        <UDropdownMenu :items="menu">
          <UButton :label="fullName" icon="i-lucide-circle-user-round" color="neutral" variant="ghost" :ui="{ label: 'hidden sm:inline' }" aria-label="Mon compte" />
        </UDropdownMenu>
      </div>
    </header>
    <main class="mx-auto max-w-[96rem] px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
