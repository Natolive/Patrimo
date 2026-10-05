import type { LoginDto, LoginResultDto, LoginTwoFactorDto, UpdateProfileDto, UserDto } from '@patrimo/shared'

export const useAuth = () => {
  // undefined : session pas encore vérifiée ; null : pas connecté.
  const user = useState<UserDto | null | undefined>('auth:user', () => undefined)
  const api = useApi()

  async function fetchUser() {
    user.value = await api<UserDto>('/auth/me').catch(() => null)
  }

  // Connecté (renvoie null), ou jeton à renvoyer avec le code 2FA (`loginTwoFactor`).
  async function login(credentials: LoginDto): Promise<string | null> {
    const result = await api<LoginResultDto>('/auth/login', { method: 'POST', body: credentials })
    if (result.challenge) return result.challenge
    user.value = result.user
    return null
  }

  async function loginTwoFactor(dto: LoginTwoFactorDto) {
    user.value = (await api<LoginResultDto>('/auth/login/2fa', { method: 'POST', body: dto })).user
  }

  async function updateProfile(dto: UpdateProfileDto) {
    user.value = await api<UserDto>('/auth/me', { method: 'PATCH', body: dto })
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, fetchUser, login, loginTwoFactor, updateProfile, logout }
}
