// Montants, quantités, taux et dates à la française.
export const money = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value)

export const signedMoney = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, signDisplay: 'exceptZero' }).format(value)

export const quantity = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(value)

// 0.1234 → « +12,34 % » ; `signed: false` pour un taux sans sens de variation (poids, volatilité).
export const percent = (rate: number, signed = true) =>
  new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: signed ? 'exceptZero' : 'auto' }).format(rate)

export const longDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))

export const shortDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(date))

// Couleur d'un gain ou d'une perte, toujours affichée avec son signe.
export const gainClass = (value: number) => (value > 0 ? 'text-success' : value < 0 ? 'text-error' : 'text-muted')
