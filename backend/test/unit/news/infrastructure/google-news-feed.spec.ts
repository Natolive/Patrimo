import { GoogleNewsFeed } from '@src/news/infrastructure/google-news-feed.js';

// Flux rejoué : même forme que celui de Google Actualités.
const item = (title: string, link: string, date: string, source = 'Boursorama') =>
  `<item><title>${title} - ${source}</title><link>${link}</link><pubDate>${date}</pubDate><source url="https://www.${source.toLowerCase().replace(' ', '')}.fr">${source}</source></item>`;
const rss = (...items: string[]) => `<?xml version="1.0"?><rss><channel>${items.join('')}</channel></rss>`;
const respond = (body: string, status = 200) => {
  const fetch = vi.fn().mockImplementation(async () => new Response(body, { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

describe('GoogleNewsFeed', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the latest French articles first, without the source in the title, and caches them', async () => {
    const fetch = respond(
      rss(
        item('Le Nasdaq &amp; la Fed', 'https://news.google.com/a', 'Fri, 02 Oct 2026 21:16:01 GMT'),
        item('L&#39;emploi US', 'https://news.google.com/b', 'Mon, 05 Oct 2026 08:00:00 GMT', 'Les Echos'),
        item('L&#39;emploi US', 'https://news.google.com/b2', 'Mon, 05 Oct 2026 09:00:00 GMT', 'Les Echos'),
        // Ignorés : lien non https, date illisible.
        item('Piège', 'javascript:alert(1)', 'Mon, 05 Oct 2026 08:00:00 GMT'),
        item('Sans date', 'https://news.google.com/c', 'hier'),
      ),
    );
    const feed = new GoogleNewsFeed();
    const items = await feed.search('Nasdaq OR Fed', 0);
    expect(items).toEqual([
      { title: "L'emploi US", url: 'https://news.google.com/b', source: 'Les Echos', sourceDomain: 'lesechos.fr', publishedAt: new Date('2026-10-05T08:00:00Z') },
      { title: 'Le Nasdaq & la Fed', url: 'https://news.google.com/a', source: 'Boursorama', sourceDomain: 'boursorama.fr', publishedAt: new Date('2026-10-02T21:16:01Z') },
    ]);
    expect(fetch.mock.calls[0][0]).toContain('q=Nasdaq%20OR%20Fed%20when%3A14d');
    expect(fetch.mock.calls[0][0]).toContain('hl=fr');
    expect(await feed.search('Nasdaq OR Fed', 1000)).toBe(items);
    expect(fetch).toHaveBeenCalledTimes(1);
    await feed.search('Nasdaq OR Fed', 31 * 60 * 1000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps a title without source suffix or source', async () => {
    respond(rss('<item><title>Brève</title><link>https://news.google.com/d</link><pubDate>Mon, 05 Oct 2026 08:00:00 GMT</pubDate></item>'));
    expect(await new GoogleNewsFeed().search('x')).toMatchObject([{ title: 'Brève', source: '', sourceDomain: '' }]);
  });

  it('gives no news when Google fails or is unreachable', async () => {
    respond('', 503);
    expect(await new GoogleNewsFeed().search('x')).toEqual([]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await new GoogleNewsFeed().search('x')).toEqual([]);
  });
});
