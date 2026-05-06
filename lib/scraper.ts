import { load } from 'cheerio';

export async function scrapeUrl(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const html = await res.text();
  const $ = load(html);

  // Remove noise elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove();
  $('[class*="nav"], [class*="footer"], [class*="header"], [class*="sidebar"], [class*="menu"]').remove();
  $('[class*="ad-"], [class*="-ad"], [id*="ad-"], [class*="cookie"], [class*="popup"]').remove();

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    url;

  // Prefer semantic content containers
  const container =
    $('article, main, [role="main"], .content, .post-content, .article-body').first();

  const source = container.length ? container : $('body');

  const blocks = source
    .find('h1, h2, h3, h4, h5, p, li, blockquote, pre, td, th')
    .map((_, el) => {
      const tag = el.tagName?.toLowerCase() ?? '';
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length < 15) return null;
      // Add markdown-style headers for structure
      if (['h1', 'h2', 'h3'].includes(tag)) return `\n## ${text}\n`;
      if (['h4', 'h5'].includes(tag)) return `\n### ${text}\n`;
      return text;
    })
    .get()
    .filter(Boolean)
    .join('\n');

  if (!blocks.trim()) throw new Error('No readable content found at this URL');

  return { title: title.trim(), text: blocks.trim() };
}
