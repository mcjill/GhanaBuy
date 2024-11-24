import puppeteer from 'puppeteer';
import { Product, ScrapingResult } from './types';
import { BaseScraper } from './base-scraper';

export class CompuGhanaScraper extends BaseScraper {
  protected store = 'CompuGhana' as const;
  
  protected selectors = {
    productGrid: '.products-container',
    productItem: '.product-item',
    title: '.product-name a',
    price: '.price',
    image: '.product-img img',
    link: '.product-name a'
  };

  protected getSearchUrl(query: string): string {
    return `https://compughana.com/search?controller=search&s=${encodeURIComponent(query)}`;
  }

  protected async extractProducts(page: puppeteer.Page): Promise<Product[]> {
    // Wait for product grid
    await page.waitForSelector(this.selectors.productGrid, { timeout: 5000 });

    // Extract products
    return await page.evaluate((selectors) => {
      const items = document.querySelectorAll(selectors.productItem);
      return Array.from(items).map((item) => {
        const titleElement = item.querySelector(selectors.title);
        const priceElement = item.querySelector(selectors.price);
        const imageElement = item.querySelector(selectors.image);
        const linkElement = item.querySelector(selectors.link);
        
        // Extract price value and clean it
        const priceText = priceElement?.textContent?.trim() || '';
        const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));

        return {
          title: titleElement?.textContent?.trim() || '',
          price: priceValue || 0,
          currency: 'GHS',
          url: linkElement?.getAttribute('href') || '',
          image: imageElement?.getAttribute('src') || '',
          store: this.store,
          availability: !item.querySelector('.out-of-stock'),
          timestamp: new Date(),
        };
      });
    }, this.selectors);
  }

  protected async scrapeInternal(searchQuery: string): Promise<ScrapingResult> {
    const browser = await puppeteer.launch({
      headless: 'new',
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport for consistent results
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to search page
      const searchUrl = this.getSearchUrl(searchQuery);
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });

      const products = await this.extractProducts(page);

      return {
        products: products.filter(p => p.title && p.price > 0), // Filter out invalid products
      };

    } catch (error) {
      console.error('Error scraping CompuGhana:', error);
      return {
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      await browser.close();
    }
  }
}

// Create singleton instance
export const compuGhanaScraper = new CompuGhanaScraper();
