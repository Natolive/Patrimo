export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  totpSecret: string | null;
  twoFactorEnabledAt: Date | null;
  recoveryCodeHashes: string[];
  createdAt: Date;
}
