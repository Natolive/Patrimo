// Ouverture des places qui comptent pour un portefeuille européen, calculée sans API : horaires de la séance, fuseau de la place
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

// Places asiatiques de l'ETF Émergents : jours fériés lunaires et fixés chaque année, donc séance lue chez Yahoo
// (via l'indice de la place) plutôt que calculée ; pause de midi ajoutée ici, Yahoo ne la donne pas.
export interface AsianMarket {
  key: string
  name: string
  // Indice suivi chez Yahoo pour connaître la séance.
  symbol: string
  timeZone: string
  lunch?: [string, string]
}

export const ASIAN_MARKETS: AsianMarket[] = [
  { key: 'shanghai', name: 'Shanghai', symbol: '000001.SS', timeZone: 'Asia/Shanghai', lunch: ['11:30', '13:00'] },
  { key: 'hongKong', name: 'Hong Kong', symbol: '^HSI', timeZone: 'Asia/Hong_Kong', lunch: ['12:00', '13:00'] },
  { key: 'taipei', name: 'Taïwan', symbol: '^TWII', timeZone: 'Asia/Taipei' },
  { key: 'mumbai', name: 'Bombay', symbol: '^BSESN', timeZone: 'Asia/Kolkata' },
  { key: 'seoul', name: 'Séoul', symbol: '^KS11', timeZone: 'Asia/Seoul' },
]

// Séance donnée par Yahoo : la prochaine ou celle en cours, sinon la dernière (jour férié, week-end).
export interface MarketSessionDto {
  key: string
  start: string
  end: string
  // Date locale (AAAA-MM-JJ) de la dernière séance cotée.
  lastSession: string
}

export interface SessionStatus {
  state: 'open' | 'lunch' | 'closed'
  // null : séance passée et prochaine inconnue (jour férié possible) ; `guess` donne alors l'ouverture habituelle.
  nextChange: Date | null
  guess: Date | null
  lastSession: string
}

export function sessionStatus(market: AsianMarket, session: MarketSessionDto, now = new Date()): SessionStatus {
  const start = new Date(session.start)
  const end = new Date(session.end)
  const { lastSession } = session
  if (now < start) return { state: 'closed', nextChange: start, guess: null, lastSession }
  if (now < end) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: market.timeZone }).format(start)
    const [lunchStart, lunchEnd] = market.lunch?.map((t) => zoned(day, t, market.timeZone)) ?? []
    if (lunchStart && lunchEnd && now >= lunchStart && now < lunchEnd) return { state: 'lunch', nextChange: lunchEnd, guess: null, lastSession }
    return { state: 'open', nextChange: lunchStart && now < lunchStart ? lunchStart : end, guess: null, lastSession }
  }
  // Séance passée : ouverture habituelle le jour de semaine suivant, à confirmer (Yahoo ne connaît pas encore la suivante).
  const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: market.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(start)
  let day = new Intl.DateTimeFormat('en-CA', { timeZone: market.timeZone }).format(now)
  let guess = zoned(day, hhmm, market.timeZone)
  while (guess <= now || [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())) {
    day = shift(new Date(`${day}T00:00:00Z`), 1)
    guess = zoned(day, hhmm, market.timeZone)
  }
  return { state: 'closed', nextChange: null, guess, lastSession }
}
