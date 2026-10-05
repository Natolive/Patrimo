// Ouverture des places qui comptent pour le PEA, calculée sans API : horaires de la séance, fuseau de la place
// (heure d'été comprise) et jours fériés. Partagé pour être testé côté back.
// ponytail: séances raccourcies ignorées (Euronext 24 et 31 décembre à 14 h 05, Wall Street veilles de fêtes à 13 h) ; à ajouter si gênant.

export interface Market {
  name: string
  timeZone: string
  // Heure locale de la place, « HH:MM ».
  opens: string
  closes: string
  holidays: (year: number) => string[]
}

export interface MarketStatus {
  open: boolean
  // Prochain changement : fermeture si ouverte, ouverture sinon.
  nextChange: Date
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

// Dimanche de Pâques (algorithme de Meeus, calendrier grégorien).
function easter(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((8 * b + 13) / 25)) / 3) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  return new Date(Date.UTC(year, month - 1, ((h + l - 7 * m + 114) % 31) + 1))
}
const shift = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000).toISOString().slice(0, 10)

// n-ième jour de la semaine du mois (n = -1 : le dernier) ; weekday 0 = dimanche.
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
    return iso(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7)
  }
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const last = new Date(Date.UTC(year, month - 1, lastDay)).getUTCDay()
  return iso(year, month, lastDay - ((last - weekday + 7) % 7))
}

// Fête américaine tombant un week-end : vendredi si samedi, lundi si dimanche.
function observed(year: number, month: number, day: number): string {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return shift(new Date(Date.UTC(year, month - 1, day)), weekday === 6 ? -1 : weekday === 0 ? 1 : 0)
}

export const MARKETS = {
  paris: {
    name: 'Euronext Paris',
    timeZone: 'Europe/Paris',
    opens: '09:00',
    closes: '17:30',
    holidays: (y) => [iso(y, 1, 1), shift(easter(y), -2), shift(easter(y), 1), iso(y, 5, 1), iso(y, 12, 25), iso(y, 12, 26)],
  },
  newYork: {
    name: 'Wall Street',
    timeZone: 'America/New_York',
    opens: '09:30',
    closes: '16:00',
    holidays: (y) => [
      // Nouvel An un samedi : pas rattrapé le vendredi 31 décembre (règle du NYSE).
      ...(new Date(Date.UTC(y, 0, 1)).getUTCDay() === 6 ? [] : [observed(y, 1, 1)]),
      nthWeekday(y, 1, 1, 3), // Martin Luther King
      nthWeekday(y, 2, 1, 3), // Presidents' Day
      shift(easter(y), -2), // Vendredi saint
      nthWeekday(y, 5, 1, -1), // Memorial Day
      observed(y, 6, 19), // Juneteenth
      observed(y, 7, 4),
      nthWeekday(y, 9, 1, 1), // Labor Day
      nthWeekday(y, 11, 4, 4), // Thanksgiving
      observed(y, 12, 25),
    ],
  },
} satisfies Record<string, Market>

// Écart du fuseau à UTC à cet instant, en millisecondes.
function offset(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(instant)
      .map((p) => [p.type, Number(p.value)]),
  )
  return Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!) - instant
}

// Instant d'une heure locale de la place (date AAAA-MM-JJ, heure HH:MM).
function zoned(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  return new Date(guess - offset(guess - offset(guess, timeZone), timeZone))
}

export function marketStatus(market: Market, now = new Date()): MarketStatus {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: market.timeZone }).format(now)
  for (let day = 0; day < 15; day++) {
    const date = shift(new Date(`${today}T00:00:00Z`), day)
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    if (weekday === 0 || weekday === 6 || market.holidays(Number(date.slice(0, 4))).includes(date)) continue
    const opens = zoned(date, market.opens, market.timeZone)
    const closes = zoned(date, market.closes, market.timeZone)
    if (now < opens) return { open: false, nextChange: opens }
    if (now < closes) return { open: true, nextChange: closes }
  }
  throw new Error(`Aucune séance dans les 15 jours pour ${market.name}`)
}
