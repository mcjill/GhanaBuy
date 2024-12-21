import { Product, ScrapingResult, SearchRequest } from './types';
import * as puppeteer from 'puppeteer';

export class JijiScraper {
  private readonly store = 'Jiji Ghana' as const;
  private readonly baseUrl = 'https://jiji.com.gh';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[JijiScraper] Starting search for: ${request.query}`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to search page and wait for content to load
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      
      // Wait for the masonry wall to load (this is where products are displayed)
      await page.waitForSelector('.masonry-wall', { timeout: 30000 });
      
      // Give a little time for dynamic content to load
      await page.waitForTimeout(2000);

      // Extract product data
      const products = await page.evaluate(() => {
        const items: Product[] = [];
        const productCards = document.querySelectorAll('.b-list-advert__gallery__item');

        productCards.forEach((card) => {
          const titleElement = card.querySelector('.b-advert-title-inner');
          const priceElement = card.querySelector('.qa-advert-price');
          const linkElement = card.querySelector('a.b-list-advert-base');
          const imageElement = card.querySelector('img[data-nuxt-pic]');

          if (titleElement && priceElement && linkElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;
            const productUrl = linkElement.getAttribute('href');
            const imageUrl = imageElement?.getAttribute('src');

            if (title && price > 0) {
              items.push({
                id: productUrl?.split('/').pop()?.split('.')[0] || crypto.randomUUID(),
                title,
                price,
                currency: 'GHS',
                productUrl: productUrl ? `https://jiji.com.gh${productUrl}` : '',
                imageUrl: imageUrl || '',
                store: 'Jiji Ghana',
                rating: null,
                reviews: null
              });
            }
          }
        });

        return items;
      });

      console.log(`[JijiScraper] Found ${products.length} products`);
      return {
        success: true,
        products: products.sort((a, b) => a.price - b.price),
        error: null
      };

    } catch (error) {
      console.error('Error scraping Jiji:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const jijiScraper = new JijiScraper();
