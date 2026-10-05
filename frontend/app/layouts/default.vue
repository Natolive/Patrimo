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

// Sections : menu en haut sur grand écran, barre d'onglets en bas sur téléphone et tablette (`short` : libellé tenant sous l'icône).
const nav = [
  { label: 'Tableau de bord', short: 'Accueil', icon: 'i-lucide-chart-line', to: '/' },
  { label: 'Positions', short: 'Positions', icon: 'i-lucide-layers', to: '/positions' },
  { label: 'Opérations', short: 'Opérations', icon: 'i-lucide-receipt-euro', to: '/purchases' },
  { label: 'Suivi', short: 'Suivi', icon: 'i-lucide-eye', to: '/watchlist' },
]
const route = useRoute()
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

const fullName = computed(() => `${user.value?.firstName ?? ''} ${user.value?.lastName ?? ''}`.trim())

const menu = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: fullName.value, description: user.value?.email }],
  [{ label: 'Mon profil', icon: 'i-lucide-user-round', to: '/profile' }],
  [{ label: 'Se déconnecter', icon: 'i-lucide-log-out', color: 'error', onSelect: onLogout }],
])
</script>

<template>
  <div class="min-h-dvh">
    <header class="bg-default/75 border-default sticky top-0 z-40 border-b backdrop-blur-lg">
      <div class="mx-auto flex h-16 max-w-[96rem] items-center justify-between gap-2 px-4 sm:px-6">
        <div class="flex items-center gap-4 sm:gap-8">
          <NuxtLink to="/" class="rounded-md text-xl focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Patrimo, tableau de bord"><BrandLogo /></NuxtLink>
          <UNavigationMenu :items="nav" class="hidden lg:flex" />
        </div>
        <UDropdownMenu :items="menu">
          <UButton :label="fullName" icon="i-lucide-circle-user-round" color="neutral" variant="ghost" :ui="{ label: 'hidden sm:inline' }" aria-label="Mon compte" />
        </UDropdownMenu>
      </div>
    </header>
    <!-- Marge basse sous lg : la barre d'onglets ne cache pas la fin de la page. -->
    <main class="mx-auto max-w-[96rem] px-4 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-8">
      <slot />
    </main>

    <!-- Barre d'onglets du téléphone et de la tablette, à portée de pouce ; au-dessus de la zone de geste de l'iPhone. -->
    <nav aria-label="Sections" class="bg-default/90 border-default fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <ul class="mx-auto grid max-w-lg grid-cols-4">
        <li v-for="item in nav" :key="item.to">
          <NuxtLink
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            class="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
            :class="isActive(item.to) ? 'text-primary' : 'text-muted hover:text-highlighted'"
          >
            <UIcon :name="item.icon" class="size-6" />
            {{ item.short }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
