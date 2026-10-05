// Utilisateur tel que renvoyé par l'API : jamais le hash du mot de passe.
export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  // Double authentification active : un code est demandé à la connexion.
  twoFactorEnabled: boolean
}
