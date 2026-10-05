import type { LoginDto, SignupDto, UserDto } from '@pea/shared'

export const useAuth = () => {
  // undefined : session pas encore vérifiée ; null : pas connecté.
  const user = useState<UserDto | null | undefined>('auth:user', () => undefined)
  const api = useApi()

  async function fetchUser() {
    user.value = await api<UserDto>('/auth/me').catch(() => null)
  }

  async function login(credentials: LoginDto) {
    user.value = await api<UserDto>('/auth/login', { method: 'POST', body: credentials })
  }

  // Crée le compte et connecte.
  async function signup(dto: SignupDto) {
    user.value = await api<UserDto>('/auth/signup', { method: 'POST', body: dto })
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, fetchUser, login, signup, logout }
}
