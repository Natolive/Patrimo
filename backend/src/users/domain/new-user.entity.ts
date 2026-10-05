import type { User } from './user.entity.js';

// 2FA désactivée à la création (valeurs par défaut de la base).
type TwoFactor = 'totpSecret' | 'twoFactorEnabledAt' | 'recoveryCodeHashes';
export type NewUser = Omit<User, 'id' | 'createdAt' | TwoFactor> & Partial<Pick<User, TwoFactor>>;
