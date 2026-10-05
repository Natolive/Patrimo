// Mots-clés par défaut : pour un ETF, son marché (ce qui fait bouger l'indice, pas le fonds) ; pour une action, l'entreprise.
// Premier motif reconnu dans le nom de l'ETF ; ordre du plus précis au plus large.
const MARKETS: [RegExp, string][] = [
  [/nasdaq/i, 'Nasdaq OR "Wall Street" OR Fed'],
  [/s&p|sp ?500/i, '"S&P 500" OR "Wall Street" OR Fed'],
  [/cac/i, '"CAC 40"'],
  // Pas « Chine » ou « Inde » seuls : ils ramènent aussi le sport et la politique.
  [/[ée]merg/i, '"marchés émergents" OR "actions émergentes" OR "Bourse de Shanghai"'],
  [/europe|stoxx|euro/i, '"Bourses européennes" OR "Stoxx 600" OR BCE'],
  [/world|monde|acwi|global/i, '"marchés mondiaux" OR "Wall Street" OR "MSCI World"'],
];
const LEGAL_FORMS = /\b(S\.?A\.?|S\.?E\.?|SCA|Soci[ée]t[ée] Europ[ée]enne|plc|N\.?V\.?|AG|Inc\.?)$/i;

export function suggestNewsQuery(name: string): string {
  if (/\b(ETF|UCITS)\b/i.test(name)) return MARKETS.find(([pattern]) => pattern.test(name))?.[1] ?? name;
  // « LVMH Moët Hennessy - Louis Vuitton, Société Européenne » → « LVMH Moët Hennessy ».
  return name.split(/,| - /)[0].trim().replace(LEGAL_FORMS, '').trim();
}
