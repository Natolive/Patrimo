<script setup lang="ts">
import {
  changePasswordSchema,
  disableTwoFactorSchema,
  enableTwoFactorSchema,
  PASSWORD_MIN,
  updateProfileSchema,
  type ChangePasswordDto,
  type DisableTwoFactorDto,
  type DisableTwoFactorInput,
  type EnableTwoFactorDto,
  type RecoveryCodesDto,
  type TwoFactorSetupDto,
  type UpdateProfileDto,
} from '@patrimo/shared'
import type { FormFieldConfig } from '~/types/form'

useHead({ title: 'Mon profil' })

const api = useApi()
const toast = useToast()
const { user, updateProfile, fetchUser } = useAuth()
const fail = (title: string, e: unknown) => toast.add({ title, description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })

// Informations
const profile = ref<UpdateProfileDto>({ firstName: user.value?.firstName ?? '', lastName: user.value?.lastName ?? '' })
const profileFields: FormFieldConfig<UpdateProfileDto>[] = [
  { name: 'firstName', label: 'Prénom', autocomplete: 'given-name', half: true },
  { name: 'lastName', label: 'Nom', autocomplete: 'family-name', half: true },
]
async function saveProfile(dto: UpdateProfileDto) {
  try {
    await updateProfile(dto)
  } catch (e) {
    return fail('Enregistrement impossible', e)
  }
  toast.add({ title: 'Profil enregistré', color: 'success', icon: 'i-lucide-check' })
}

// Mot de passe
const emptyPassword = (): ChangePasswordDto => ({ currentPassword: '', password: '' })
const password = ref<ChangePasswordDto>(emptyPassword())
const passwordFields: FormFieldConfig<ChangePasswordDto>[] = [
  { name: 'currentPassword', label: 'Mot de passe actuel', type: 'password', autocomplete: 'current-password' },
  { name: 'password', label: 'Nouveau mot de passe', type: 'password', autocomplete: 'new-password', help: `${PASSWORD_MIN} caractères minimum.` },
]
async function savePassword(dto: ChangePasswordDto) {
  try {
    await api('/auth/me/password', { method: 'POST', body: dto })
  } catch (e) {
    return fail('Changement impossible', e)
  }
  password.value = emptyPassword()
  toast.add({ title: 'Mot de passe changé', description: 'Tes autres appareils ont été déconnectés.', color: 'success', icon: 'i-lucide-check' })
}

// Double authentification : clé à scanner, premier code, puis codes de secours affichés une seule fois.
const setup = ref<TwoFactorSetupDto>()
const recoveryCodes = ref<string[]>()
const code = ref<EnableTwoFactorDto>({ code: '' })
const codeFields: FormFieldConfig<EnableTwoFactorDto>[] = [
  { name: 'code', label: 'Code affiché par l’application', autocomplete: 'one-time-code', inputmode: 'numeric', placeholder: '123 456', icon: 'i-lucide-shield-check' },
]

async function startSetup() {
  try {
    setup.value = await api<TwoFactorSetupDto>('/auth/me/2fa/setup', { method: 'POST' })
  } catch (e) {
    fail('Activation impossible', e)
  }
}

async function enable(dto: EnableTwoFactorDto) {
  try {
    recoveryCodes.value = (await api<RecoveryCodesDto>('/auth/me/2fa/enable', { method: 'POST', body: dto })).recoveryCodes
  } catch (e) {
    return fail('Code refusé', e)
  }
  setup.value = undefined
  code.value = { code: '' }
  await fetchUser()
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `${what} copié${what.endsWith('s') ? 's' : 'e'}`, color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Copie impossible', description: 'Sélectionne le texte et copie-le à la main.', color: 'error', icon: 'i-lucide-circle-alert' })
  }
}

function download(codes: string[]) {
  const text = `Patrimo — codes de secours (${user.value?.email})\nChaque code ne sert qu'une fois.\n\n${codes.join('\n')}\n`
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  link.download = 'patrimo-codes-de-secours.txt'
  link.click()
  URL.revokeObjectURL(link.href)
}

// Désactivation, confirmée dans une modale (mot de passe + code).
const disabling = ref(false)
const disableState = ref<DisableTwoFactorInput>({ password: '', code: '' })
const disableFields: FormFieldConfig<DisableTwoFactorInput>[] = [
  { name: 'password', label: 'Mot de passe', type: 'password', autocomplete: 'current-password' },
  { name: 'code', label: 'Code de l’application ou code de secours', autocomplete: 'one-time-code', icon: 'i-lucide-shield-check' },
]
async function disable(dto: DisableTwoFactorDto) {
  try {
    await api('/auth/me/2fa/disable', { method: 'POST', body: dto })
  } catch (e) {
    return fail('Désactivation impossible', e)
  }
  disabling.value = false
  disableState.value = { password: '', code: '' }
  await fetchUser()
  toast.add({ title: 'Double authentification désactivée', color: 'success', icon: 'i-lucide-check' })
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div>
      <h1 class="text-highlighted text-2xl font-bold tracking-tight">Mon profil</h1>
      <p class="text-muted mt-1">Tes informations, ton mot de passe et la sécurité de ton compte.</p>
    </div>

    <UCard>
      <template #header>
        <h2 class="text-highlighted font-semibold">Informations</h2>
      </template>
      <p class="text-muted mb-6 text-sm">
        Email de connexion : <span class="text-highlighted font-medium">{{ user?.email }}</span>
      </p>
      <FormBuilder v-model:state="profile" :schema="updateProfileSchema" :fields="profileFields" :submit="saveProfile" submit-label="Enregistrer le profil" />
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-highlighted font-semibold">Mot de passe</h2>
        <p class="text-muted text-sm">Le changer déconnecte tes autres appareils.</p>
      </template>
      <FormBuilder v-model:state="password" :schema="changePasswordSchema" :fields="passwordFields" :submit="savePassword" submit-label="Changer le mot de passe" />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-highlighted font-semibold">Double authentification</h2>
            <p class="text-muted text-sm">Un code de ton téléphone en plus du mot de passe à chaque connexion.</p>
          </div>
          <UBadge
            :label="user?.twoFactorEnabled ? 'Active' : 'Inactive'"
            :color="user?.twoFactorEnabled ? 'success' : 'neutral'"
            :icon="user?.twoFactorEnabled ? 'i-lucide-shield-check' : 'i-lucide-shield-off'"
            variant="subtle"
          />
        </div>
      </template>

      <!-- Étape 3 : codes de secours, affichés une seule fois. -->
      <div v-if="recoveryCodes" class="space-y-4">
        <UAlert color="warning" variant="subtle" icon="i-lucide-key-round" title="Note tes codes de secours maintenant" description="Ils remplacent ton téléphone si tu le perds. Chacun ne sert qu’une fois, et ils ne seront plus affichés." />
        <ul class="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">
          <li v-for="c in recoveryCodes" :key="c" class="border-default rounded-md border px-3 py-2 text-center tracking-wider">{{ c }}</li>
        </ul>
        <div class="flex flex-wrap gap-2">
          <UButton label="Copier les codes" icon="i-lucide-copy" color="neutral" variant="outline" @click="copy(recoveryCodes.join('\n'), 'Codes')" />
          <UButton label="Télécharger (.txt)" icon="i-lucide-download" color="neutral" variant="outline" @click="download(recoveryCodes)" />
          <UButton label="J’ai noté mes codes" icon="i-lucide-check" @click="recoveryCodes = undefined" />
        </div>
      </div>

      <!-- Étapes 1 et 2 : scanner, puis confirmer avec un premier code. -->
      <div v-else-if="setup" class="grid gap-6 sm:grid-cols-[auto_1fr]">
        <AuthQrCode :value="setup.otpauthUrl" label="QR code de la clé Patrimo pour ton application d’authentification" />
        <div class="space-y-4">
          <ol class="text-toned list-decimal space-y-1 ps-5 text-sm">
            <li>Ouvre ton application d’authentification (Google Authenticator, 1Password, Authy…).</li>
            <li>Scanne le QR code, ou saisis la clé ci-dessous.</li>
            <li>Saisis le code à 6 chiffres qu’elle affiche.</li>
          </ol>
          <div class="flex items-center gap-2">
            <code class="bg-elevated text-highlighted min-w-0 flex-1 truncate rounded-md px-3 py-2 font-mono text-xs">{{ setup.secret }}</code>
            <UButton icon="i-lucide-copy" color="neutral" variant="outline" aria-label="Copier la clé" @click="copy(setup.secret, 'Clé')" />
          </div>
          <FormBuilder v-model:state="code" :schema="enableTwoFactorSchema" :fields="codeFields" :submit="enable" submit-label="Activer" />
          <UButton label="Annuler" color="neutral" variant="ghost" @click="setup = undefined" />
        </div>
      </div>

      <div v-else-if="user?.twoFactorEnabled" class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-toned text-sm">Un code de ton application est demandé à chaque connexion. Garde tes codes de secours en lieu sûr.</p>
        <UButton label="Désactiver" icon="i-lucide-shield-off" color="error" variant="outline" @click="disabling = true" />
      </div>

      <div v-else class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-toned text-sm">Même si ton mot de passe fuite, personne ne pourra se connecter sans ton téléphone.</p>
        <UButton label="Activer la double authentification" icon="i-lucide-shield-plus" loading-auto @click="startSetup" />
      </div>
    </UCard>

    <UModal v-model:open="disabling" title="Désactiver la double authentification ?" description="Ton mot de passe suffira de nouveau pour te connecter.">
      <template #body>
        <FormBuilder v-model:state="disableState" :schema="disableTwoFactorSchema" :fields="disableFields" :submit="disable" submit-label="Désactiver" />
      </template>
    </UModal>
  </div>
</template>
