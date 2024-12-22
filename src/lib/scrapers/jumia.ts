import { Product, ScrapingResult, SearchRequest } from './types';
import * as puppeteer from 'puppeteer';

export class JumiaScraper {
  private readonly store = 'Jumia' as const;
  private readonly baseUrl = 'https://www.jumia.com.gh';
  private readonly currency = 'GHS';

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalog/?q=${encodeURIComponent(query)}`;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      const searchUrl = this.getSearchUrl(request.query);
      console.log(`[JumiaScraper] Starting search for: ${request.query}`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to search page
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      
      // Wait for product grid
      await page.waitForSelector('article.prd');

      // Extract product data
      const products = await page.evaluate((currency) => {
        const items: Product[] = [];
        const productElements = document.querySelectorAll('article.prd');

        productElements.forEach((element) => {
          const titleElement = element.querySelector('.name');
          const priceElement = element.querySelector('.prc');
          const linkElement = element.querySelector('a.core');
          const imageElement = element.querySelector('img.img');

          if (titleElement && priceElement && linkElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;
            const productUrl = linkElement.getAttribute('href');
            const imageUrl = imageElement?.getAttribute('data-src');

            if (title && price > 0) {
              // Ensure URLs are absolute
              let finalProductUrl = productUrl;
              let finalImageUrl = imageUrl;

              if (finalProductUrl && !finalProductUrl.startsWith('http')) {
                finalProductUrl = `https://jumia.com.gh${finalProductUrl.startsWith('/') ? '' : '/'}${finalProductUrl}`;
              }
              if (finalImageUrl && !finalImageUrl.startsWith('http')) {
                finalImageUrl = `https:${finalImageUrl.startsWith('//') ? '' : '//'}${finalImageUrl}`;
              }

              // Generate a simple ID from the product URL or a timestamp
              const productId = finalProductUrl ? 
                `jumia-${finalProductUrl.split('/').pop()?.split('.')[0]}` : 
                `jumia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              items.push({
                id: productId,
                title,
                price,
                currency,
                productUrl: finalProductUrl,
                imageUrl: finalImageUrl,
                store: 'Jumia',
                rating: null,
                reviews: null
              });
            }
          }
        });

        return items;
      }, this.currency);

      console.log(`[JumiaScraper] Found ${products.length} products`);
      return {
        success: true,
        products: products.sort((a, b) => a.price - b.price),
        error: null
      };

    } catch (error) {
      console.error('Error scraping Jumia:', error);
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

export const jumiaScraper = new JumiaScraper();
