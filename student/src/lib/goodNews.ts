import { POSITIVE_NEWS } from '../data/news';

export interface NewsItem { src: string; text: string; }

// rss2json converts RSS to clean JSON and handles CORS — no proxy needed
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?count=15&rss_url=';

const FEEDS = [
  { url: 'https://www.goodnewsnetwork.org/feed/', src: 'Good News Network' },
  { url: 'https://positive.news/feed/',           src: 'Positive.News'     },
  { url: 'https://www.happynews.com/feed/',       src: 'Happy News'        },
];

let cachedNews: NewsItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // refresh every 30 min

export interface GoodNewsResult { items: NewsItem[]; live: boolean; }

/** Returns live headlines when a feed responds, otherwise the built-in list with live=false. */
export async function fetchGoodNews(): Promise<GoodNewsResult> {
  const items = await fetchLiveOrFallback();
  return { items, live: items !== POSITIVE_NEWS };
}

async function fetchLiveOrFallback(): Promise<NewsItem[]> {
  if (cachedNews && Date.now() - cacheTime < CACHE_TTL) return cachedNews;

  for (const feed of FEEDS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) continue;

      const items: NewsItem[] = data.items
        .map((item: any) => ({
          src: feed.src,
          text: (item.title as string)
            ?.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#\d+;/g, '')
            .replace(/\s+/g, ' ')
            .trim() ?? '',
        }))
        .filter((n: NewsItem) => n.text.length > 20);

      if (items.length >= 5) {
        cachedNews = items;
        cacheTime = Date.now();
        return items;
      }
    } catch {
      // try next feed
    }
  }

  return POSITIVE_NEWS;
}
