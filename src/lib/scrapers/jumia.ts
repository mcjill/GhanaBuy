import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import type { SearchRequest, ScrapingResult, Product } from './types';

// Plain HTTP + cheerio scraper. Do not use a headless browser here: this runs
// inside serverless API routes, which ship no Chromium binary.

const BASE_URL = 'https://www.jumia.com.gh';
const REQUEST_TIMEOUT_MS = 10000;

export function cleanPrice(priceText: string): number {
  if (!priceText) return 0;
  // Jumia shows ranges like "GH₵ 1,200 - GH₵ 1,500"; keep the lowest price
  const firstPrice = priceText.split('-')[0];
  const cleaned = firstPrice.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function isWithinBudget(price: number, minBudget?: number, maxBudget?: number): boolean {
  if (minBudget !== undefined && price < minBudget) return false;
  if (maxBudget !== undefined && price > maxBudget) return false;
  return true;
}

export function parseJumiaProducts(
  html: string,
  minBudget?: number,
  maxBudget?: number
): Product[] {
  const $ = cheerio.load(html);
  const products: Product[] = [];

  $('article.prd').each((_, element) => {
    const $el = $(element);

    const title = ($el.find('[data-name]').attr('data-name') || $el.find('h3.name').text()).trim();
    const price = cleanPrice($el.find('div.prc').first().text());
    if (!title || price === 0 || !isWithinBudget(price, minBudget, maxBudget)) return;

    const href = $el.find('a.core').attr('href') || '';
    if (!href) return;
    const productUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    const $img = $el.find('img.img').first();
    const imageUrl = $img.attr('data-src') || $img.attr('src') || '';

    products.push({
      id: uuidv4(),
      title,
      price,
      currency: 'GHS',
      productUrl,
      imageUrl: imageUrl.startsWith('http') ? imageUrl : '',
      store: 'Jumia',
      rating: null,
      reviews: null,
      availability: true,
    });
  });

  return products;
}

class JumiaScraper {
  async scrape({ query, minBudget, maxBudget }: SearchRequest): Promise<ScrapingResult> {
    const searchUrl = `${BASE_URL}/catalog/?q=${encodeURIComponent(query)}`;

    try {
      console.log(`[Jumia] Scraping: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Jumia responded with HTTP ${response.status}`);
      }

      const products = parseJumiaProducts(await response.text(), minBudget, maxBudget);
      console.log(`[Jumia] Found ${products.length} products`);

      return { success: true, products, error: null };
    } catch (error) {
      console.error('[Jumia] Scraping error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Jumia scraping failed',
      };
    }
  }
}

export const jumiaScraper = new JumiaScraper();
