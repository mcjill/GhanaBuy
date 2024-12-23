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
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set longer timeout for navigation
      await page.setDefaultNavigationTimeout(60000);
      
      console.log(`[JijiScraper] Navigating to: ${searchUrl}`);
      
      // Navigate to search page with longer timeout
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      console.log('[JijiScraper] Page loaded, waiting for content');
      
      // Wait for either products or no results message
      try {
        await Promise.race([
          page.waitForSelector('.masonry-wall', { timeout: 45000 }),
          page.waitForSelector('.b-list-advert__gallery__item', { timeout: 45000 }),
          page.waitForSelector('.qa-no-results', { timeout: 45000 })
        ]);
      } catch (error) {
        console.log('[JijiScraper] Timeout waiting for results, checking page content...');
      }

      // Check if no results found
      const noResults = await page.$('.qa-no-results');
      if (noResults) {
        console.log('[JijiScraper] No results found');
        return {
          success: true,
          products: [],
          error: null
        };
      }

      // Extract product data with retry mechanism
      let retryCount = 0;
      let products = [];
      
      while (retryCount < 3 && products.length === 0) {
        products = await page.evaluate((store, currency) => {
          const items: any[] = [];
          const productCards = document.querySelectorAll('.b-list-advert__gallery__item');
          
          console.log(`[JijiScraper] Found ${productCards.length} product cards`);

          productCards.forEach((card) => {
            try {
              const titleElement = card.querySelector('.b-advert-title-inner');
              const priceElement = card.querySelector('.qa-advert-price');
              const linkElement = card.querySelector('a.b-list-advert-base');
              const imageElement = card.querySelector('img[data-nuxt-pic]');

              if (titleElement && priceElement && linkElement) {
                const title = titleElement.textContent?.trim();
                const priceText = priceElement.textContent?.trim();
                const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;
                const productUrl = linkElement.getAttribute('href');
                const imageUrl = imageElement?.getAttribute('data-src') || imageElement?.getAttribute('src');

                if (title && price && productUrl) {
                  items.push({
                    id: crypto.randomUUID(),
                    title,
                    price,
                    currency,
                    productUrl: productUrl.startsWith('http') ? productUrl : `${window.location.origin}${productUrl}`,
                    imageUrl: imageUrl || '',
                    store,
                    rating: null,
                    reviews: null,
                    availability: true
                  });
                }
              }
            } catch (error) {
              console.error('[JijiScraper] Error processing product card:', error);
            }
          });
          return items;
        }, this.store, this.currency);

        if (products.length === 0 && retryCount < 2) {
          console.log(`[JijiScraper] No products found, retrying... (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        } else {
          break;
        }
      }

      console.log(`[JijiScraper] Successfully extracted ${products.length} products`);

      return {
        success: true,
        products,
        error: null
      };

    } catch (error) {
      console.error('[JijiScraper] Error:', error);
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
