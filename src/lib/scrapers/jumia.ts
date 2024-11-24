import puppeteer from 'puppeteer';
import { Product, ScrapingResult } from './types';
import { BaseScraper } from './base-scraper';

export class JumiaScraper extends BaseScraper {
  protected store = 'Jumia' as const;
  
  protected selectors = {
    productGrid: '.products-grid',
    productItem: '.prd._fb',
    title: '.name',
    price: '.prc',
    image: '.img-c img',
    link: 'a.core'
  };

  protected getSearchUrl(query: string): string {
    return `https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`;
  }

  protected async initializePage(browser: puppeteer.Browser): Promise<puppeteer.Page> {
    const page = await super.initializePage(browser);
    
    // Add user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    return page;
  }

  async scrape(searchQuery: string): Promise<ScrapingResult> {
    const browser = await puppeteer.launch({
      headless: 'new',
    });

    try {
      const page = await this.initializePage(browser);
      
      // Set viewport for consistent results
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate to search page
      const searchUrl = this.getSearchUrl(searchQuery);
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });

      // Wait for product grid
      await page.waitForSelector(this.selectors.productGrid, { timeout: 5000 });

      // Extract products
      const products = await page.evaluate((selectors) => {
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
            store: 'Jumia' as const,
            availability: !item.querySelector('.out-of-stock'),
            timestamp: new Date(),
          };
        });
      }, this.selectors);

      return {
        products: products.filter(p => p.title && p.price > 0),
      };

    } catch (error) {
      console.error('Error scraping Jumia:', error);
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
export const jumiaScraper = new JumiaScraper();
