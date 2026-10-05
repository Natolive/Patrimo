import { suggestNewsQuery } from '@src/news/domain/suggest-news-query.js';

describe('suggestNewsQuery', () => {
  it('follows the market of an ETF rather than the fund', () => {
    expect(suggestNewsQuery('Amundi PEA Nasdaq-100 UCITS ETF Acc')).toContain('Nasdaq');
    expect(suggestNewsQuery('Amundi PEA S&P 500 ESG UCITS ETF')).toContain('S&P 500');
    expect(suggestNewsQuery('Amundi CAC 40 UCITS ETF')).toBe('"CAC 40"');
    expect(suggestNewsQuery('Amundi PEA Émergent (MSCI Emerging) ESG Transition UCITS ETF Acc')).toContain('marchés émergents');
    expect(suggestNewsQuery('Amundi PEA MSCI Europe UCITS ETF Acc')).toContain('Bourses européennes');
    expect(suggestNewsQuery('Amundi PEA Monde (MSCI World) UCITS ETF')).toContain('MSCI World');
    expect(suggestNewsQuery('Amundi PEA Japan Topix UCITS ETF')).toBe('Amundi PEA Japan Topix UCITS ETF');
  });

  it('follows the company of a stock, without its legal form', () => {
    expect(suggestNewsQuery('LVMH Moët Hennessy - Louis Vuitton, Société Européenne')).toBe('LVMH Moët Hennessy');
    expect(suggestNewsQuery("L'Air Liquide S.A.")).toBe("L'Air Liquide");
    expect(suggestNewsQuery('TotalEnergies SE')).toBe('TotalEnergies');
    expect(suggestNewsQuery('Airbus SE')).toBe('Airbus');
  });
});
