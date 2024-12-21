import { Product, ScrapingResult, SearchRequest } from './types';
import * as puppeteer from 'puppeteer';

export class AliExpressScraper {
  private readonly store = 'AliExpress' as const;
  private readonly baseUrl = 'https://www.aliexpress.com';

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      console.log(`[AliExpressScraper] Starting search for: ${request.query}`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Go to search page with additional parameters
      const searchUrl = `${this.baseUrl}/wholesale/${encodeURIComponent(request.query.replace(/\s+/g, '-'))}.html?SearchText=${encodeURIComponent(request.query)}&SortType=total_tranpro_desc`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Wait for product grid with increased timeout
      await page.waitForSelector('.list--gallery--C2f2tvm', { timeout: 15000 });

      // Extract products
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('.list--gallery--C2f2tvm .search-card-item');
        const results: any[] = [];

        items.forEach((item) => {
          try {
            // Get price
            const priceElement = item.querySelector('.price-current');
            const priceText = priceElement?.textContent?.replace(/[^0-9.]/g, '') || '0';
            const price = parseFloat(priceText);

            if (price > 0) {
              // Get other product details
              const titleElement = item.querySelector('.multi--titleText--nXeOvyr');
              const title = titleElement?.textContent?.trim() || '';
              const linkElement = item.querySelector('a');
              const productUrl = linkElement?.getAttribute('href') || '';
              const imageElement = item.querySelector('img.product-img');
              const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
              
              // Get rating and reviews if available
              const ratingElement = item.querySelector('.rating-star');
              const rating = ratingElement ? parseFloat(ratingElement.getAttribute('title')?.split(' ')[1] || '0') : null;
              
              const reviewsElement = item.querySelector('.rating-review');
              const reviews = reviewsElement ? parseInt(reviewsElement.textContent?.replace(/[^0-9]/g, '') || '0') : null;

              results.push({
                id: productUrl.split('/item/')[1]?.split('.')[0] || crypto.randomUUID(),
                title,
                price,
                currency: 'USD',
                productUrl: productUrl.startsWith('http') ? productUrl : `https:${productUrl}`,
                imageUrl: imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`,
                store: 'AliExpress',
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

      console.log(`[AliExpressScraper] Found ${products.length} products`);
      return {
        success: true,
        products,
        error: null
      };

    } catch (error) {
      console.error('Error scraping AliExpress:', error);
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

export const aliExpressScraper = new AliExpressScraper();
