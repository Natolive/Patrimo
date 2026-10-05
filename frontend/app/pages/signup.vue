<script setup lang="ts">
import { PASSWORD_MIN, signupSchema, type SignupDto } from '@pea/shared'
import type { FormFieldConfig } from '~/types/form'

definePageMeta({ layout: 'auth', guest: true })
useHead({ title: 'Créer un compte · PEA' })

const state = ref<SignupDto>({ lastName: '', firstName: '', email: '', password: '' })
const fields: FormFieldConfig<SignupDto>[] = [
  { name: 'firstName', label: 'Prénom', autocomplete: 'given-name', half: true },
  { name: 'lastName', label: 'Nom', autocomplete: 'family-name', half: true },
  { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', icon: 'i-lucide-mail' },
  { name: 'password', label: 'Mot de passe', type: 'password', autocomplete: 'new-password', help: `${PASSWORD_MIN} caractères minimum.` },
]

const toast = useToast()
const { signup } = useAuth()

async function onSignup(data: SignupDto) {
  try {
    await signup(data)
  } catch (e) {
    toast.add({ title: 'Création du compte impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  await navigateTo('/')
}
</script>

<template>
  <div>
    <h1 class="text-highlighted text-3xl font-bold tracking-tight">Créer un compte</h1>

    <FormBuilder v-model:state="state" :schema="signupSchema" :fields="fields" :submit="onSignup" submit-label="Créer mon compte" class="mt-10" />

    <p class="text-muted mt-8 text-sm">
      Déjà un compte ?
      <ULink to="/login" class="text-primary font-medium">Se connecter</ULink>
    </p>
  </div>
</template>
