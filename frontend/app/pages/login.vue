<script setup lang="ts">
import { loginSchema, type LoginDto } from '@pea/shared'
import type { FormFieldConfig } from '~/types/form'

definePageMeta({ layout: 'auth', guest: true })
useHead({ title: 'Connexion · PEA' })

const state = ref<LoginDto>({ email: '', password: '', remember: true })
const fields: FormFieldConfig<LoginDto>[] = [
  { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', icon: 'i-lucide-mail' },
  { name: 'password', label: 'Mot de passe', type: 'password', autocomplete: 'current-password' },
  { name: 'remember', label: 'Rester connecté', type: 'checkbox' },
]

const toast = useToast()
const { login } = useAuth()

async function onLogin(data: LoginDto) {
  try {
    await login(data)
  } catch (e) {
    toast.add({ title: 'Connexion impossible', description: apiErrorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
    return
  }
  await navigateTo('/')
}
</script>

<template>
  <div>
    <h1 class="text-highlighted text-3xl font-bold tracking-tight">Connexion</h1>

    <FormBuilder v-model:state="state" :schema="loginSchema" :fields="fields" :submit="onLogin" submit-label="Se connecter" class="mt-10" />
  </div>
</template>
