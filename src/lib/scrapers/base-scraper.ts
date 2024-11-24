import puppeteer, { Browser, Page } from 'puppeteer';
import { Product, ScrapingResult } from './types';
import { retry } from '../utils/retry';
import { productCache } from '../cache';

export abstract class BaseScraper {
  protected abstract store: 'CompuGhana' | 'Telefonika' | 'Jumia';
  protected abstract selectors: {
    productGrid: string;
    productItem: string;
    title: string;
    price: string;
    image: string;
    link?: string;
  };

  protected async initializePage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    
    // Set viewport for consistent results
    await page.setViewport({ width: 1280, height: 800 });

    // Add error handling for navigation timeouts
    page.setDefaultNavigationTimeout(30000);

    // Add request interception to block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  protected abstract getSearchUrl(query: string): string;

  protected async extractProducts(page: Page): Promise<Product[]> {
    try {
      // Wait for the product grid with a longer timeout
      await page.waitForSelector(this.selectors.productGrid, { timeout: 10000 });

      return await page.evaluate((selectors) => {
        const items = document.querySelectorAll(selectors.productItem);
        console.log('Found items:', items.length);
        
        return Array.from(items).map((item) => {
          try {
            const titleElement = item.querySelector(selectors.title);
            const priceElement = item.querySelector(selectors.price);
            const imageElement = item.querySelector(selectors.image);
            const linkElement = selectors.link ? item.querySelector(selectors.link) : null;
            
            // Extract price value and clean it
            const priceText = priceElement?.textContent?.trim() || '';
            const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));

            const product = {
              title: titleElement?.textContent?.trim() || '',
              price: priceValue || 0,
              currency: 'GHS',
              url: (linkElement?.getAttribute('href') || titleElement?.getAttribute('href')) || '',
              image: imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '',
              store: selectors.store,
              availability: !item.querySelector('.out-of-stock'),
              timestamp: new Date(),
            };

            console.log('Extracted product:', product);
            return product;
          } catch (error) {
            console.error('Error extracting product:', error);
            return null;
          }
        }).filter(Boolean);
      }, { ...this.selectors, store: this.store });
    } catch (error) {
      console.error(`Error in extractProducts for ${this.store}:`, error);
      return [];
    }
  }

  public async scrape(searchQuery: string): Promise<ScrapingResult> {
    // Check cache first
    const cachedResults = productCache.get(searchQuery, this.store);
    if (cachedResults) {
      console.log(`Using cached results for ${this.store}`);
      return { products: cachedResults };
    }

    let browser: Browser | null = null;

    try {
      console.log(`Starting scrape for ${this.store}`);
      
      browser = await retry(
        () => puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1280,800'
          ]
        }),
        {
          maxAttempts: 3,
          delayMs: 1000,
          shouldRetry: (error) => {
            console.error(`Browser launch error for ${this.store}:`, error);
            return true;
          },
        }
      );

      const page = await this.initializePage(browser);

      // Navigate to search page with retry
      await retry(
        () => page.goto(this.getSearchUrl(searchQuery), {
          waitUntil: 'networkidle0',
          timeout: 30000
        }),
        {
          maxAttempts: 3,
          delayMs: 2000,
          shouldRetry: (error) => {
            const message = error instanceof Error ? error.message : String(error);
            return message.includes('timeout') || message.includes('net::');
          },
        }
      );

      console.log(`Navigation complete for ${this.store}`);

      const products = await this.extractProducts(page);
      const validProducts = products.filter(p => p && p.title && p.price > 0);

      console.log(`Found ${validProducts.length} valid products for ${this.store}`);

      // Cache the results
      if (validProducts.length > 0) {
        productCache.set(searchQuery, this.store, validProducts);
      }

      return { products: validProducts };

    } catch (error) {
      console.error(`Error scraping ${this.store}:`, error);
      return {
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      if (browser) {
        await browser.close().catch(console.error);
      }
    }
  }
}
