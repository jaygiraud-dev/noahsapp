import { POSITIVE_NEWS } from '../data/news';

export interface NewsItem { src: string; text: string; }

// CORS proxy for web — allorigins proxies any public URL
const PROXY = 'https://api.allorigins.win/raw?url=';

const FEEDS = [
  { url: 'https://www.goodnewsnetwork.org/feed/', src: 'Good News Network' },
  { url: 'https://positive.news/feed/', src: 'Positive.News' },
];

function parseRSSTitles(xml: string, src: string): NewsItem[] {
  const items: NewsItem[] = [];
  // Match <item> blocks, then extract <title> inside each
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(xml)) !== null && items.length < 15) {
    const block = itemMatch[0];
    // CDATA or plain title
    const cdataMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
    const plainMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const raw = cdataMatch?.[1] ?? plainMatch?.[1] ?? '';
    const title = raw
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .trim();
    if (title.length > 15) items.push({ src, text: title });
  }
  return items;
}

let cachedNews: NewsItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchGoodNews(): Promise<NewsItem[]> {
  if (cachedNews && Date.now() - cacheTime < CACHE_TTL) return cachedNews;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    for (const feed of FEEDS) {
      try {
        const res = await fetch(`${PROXY}${encodeURIComponent(feed.url)}`, {
          signal: controller.signal,
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const items = parseRSSTitles(xml, feed.src);
        if (items.length >= 5) {
          cachedNews = items;
          cacheTime = Date.now();
          return items;
        }
      } catch {
        // try next feed
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return POSITIVE_NEWS;
}
