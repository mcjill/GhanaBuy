import { Product, ScrapingResult, SearchRequest } from './types';
import * as puppeteer from 'puppeteer';

export class AmazonScraper {
  private readonly store = 'Amazon' as const;
  private readonly baseUrl = 'https://www.amazon.com';

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      console.log(`[AmazonScraper] Starting search for: ${request.query}`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1920,1080',
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Go to search page
      const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(request.query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for product grid
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });

      // Extract products
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-component-type="s-search-result"]');
        const results: any[] = [];

        items.forEach((item) => {
          try {
            // Get price
            const wholePart = item.querySelector('.a-price-whole')?.textContent?.trim() || '0';
            const decimalPart = item.querySelector('.a-price-fraction')?.textContent?.trim() || '00';
            const price = parseFloat(`${wholePart}.${decimalPart}`);

            if (price > 0) {
              // Get other product details
              const titleElement = item.querySelector('h2 a.a-link-normal');
              const title = titleElement?.textContent?.trim() || '';
              const productUrl = titleElement?.getAttribute('href') || '';
              const imageElement = item.querySelector('img.s-image');
              const imageUrl = imageElement?.getAttribute('src') || '';
              const rating = parseFloat(item.querySelector('.a-icon-star-small')?.textContent?.split(' ')[0] || '0');
              const reviewsText = item.querySelector('span[aria-label*="stars"]')?.textContent?.match(/\d+/)?.[0] || '0';
              const reviews = parseInt(reviewsText, 10);

              results.push({
                id: productUrl.split('/dp/')[1]?.split('/')[0] || crypto.randomUUID(),
                title,
                price,
                currency: 'USD',
                productUrl: productUrl.startsWith('http') ? productUrl : `https://www.amazon.com${productUrl}`,
                imageUrl,
                store: 'Amazon',
                rating,
                reviews
              });
            }
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });

        return results;
      });

      console.log(`[AmazonScraper] Found ${products.length} products`);
      return {
        success: true,
        products,
        error: null
      };

    } catch (error) {
      console.error('Error scraping Amazon:', error);
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

export const amazonScraper = new AmazonScraper();
