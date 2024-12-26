import type { Product, ScrapingResult, SearchRequest } from './types';
import * as puppeteer from 'puppeteer';

export class JijiScraper {
  private readonly baseUrl: string = 'https://jiji.com.gh';
  private readonly store: string = 'Jiji';
  private readonly currency: string = 'GHS';
  private readonly maxRetries: number = 3;

  private calculateRelevancyScore(title: string, query: string): number {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const titleWords = title.toLowerCase().split(/\s+/);
    let matchCount = 0;

    for (const term of searchTerms) {
      if (titleWords.some(word => word.includes(term))) {
        matchCount++;
      }
    }

    return matchCount / searchTerms.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getSearchUrl(query: string, minBudget?: number, maxBudget?: number): string {
    const searchParams = new URLSearchParams();
    searchParams.append('query', query);
    searchParams.append('sort_by', 'date_desc'); // Sort by newest first
    
    if (minBudget) {
      searchParams.append('price_min', minBudget.toString());
    }
    if (maxBudget) {
      searchParams.append('price_max', maxBudget.toString());
    }
    
    return `${this.baseUrl}/search?${searchParams.toString()}`;
  }

  private parseTimestamp(timeText: string): Date | null {
    try {
      if (timeText.includes('just now')) {
        return new Date();
      }
      
      const minutesMatch = timeText.match(/(\d+)\s*minutes?\s*ago/);
      if (minutesMatch) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - parseInt(minutesMatch[1]));
        return date;
      }

      const hoursMatch = timeText.match(/(\d+)\s*hours?\s*ago/);
      if (hoursMatch) {
        const date = new Date();
        date.setHours(date.getHours() - parseInt(hoursMatch[1]));
        return date;
      }

      const daysMatch = timeText.match(/(\d+)\s*days?\s*ago/);
      if (daysMatch) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(daysMatch[1]));
        return date;
      }

      // For specific dates like "Dec 25"
      const dateMatch = timeText.match(/([A-Za-z]+)\s+(\d+)/);
      if (dateMatch) {
        const date = new Date();
        const month = new Date(Date.parse(`${dateMatch[1]} 1, 2000`)).getMonth();
        date.setMonth(month);
        date.setDate(parseInt(dateMatch[2]));
        return date;
      }

      return null;
    } catch (error) {
      console.error('Error parsing timestamp:', error);
      return null;
    }
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private deduplicateProducts(products: any[]): any[] {
    const seen = new Map();
    
    return products.filter(product => {
      // Create a unique key based on normalized title and price
      const normalizedTitle = this.normalizeTitle(product.title);
      const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      const key = `${normalizedTitle}-${price}`;
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.set(key, true);
      return true;
    });
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    const { query, minBudget, maxBudget } = request;
    let browser: puppeteer.Browser | null = null;
    let retries = this.maxRetries;

    while (retries > 0) {
      try {
        console.log(`[JijiScraper] Starting search for: ${query}`);
        console.log(`[JijiScraper] Budget range: ${minBudget || 0} - ${maxBudget || 'unlimited'} GHS`);
        console.log(`[JijiScraper] Attempt ${this.maxRetries - retries + 1} of ${this.maxRetries}`);
        
        browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        });
        
        const page = await browser.newPage();
        
        // Set a more realistic viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set a more realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set extra headers to look more like a real browser
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"'
        });

        // Enable JavaScript and cookies
        await page.setJavaScriptEnabled(true);
        
        // Navigate to search URL with price range parameters
        const searchUrl = this.getSearchUrl(query, minBudget, maxBudget);
        console.log(`[JijiScraper] Accessing URL: ${searchUrl}`);
        
        // Navigate with a longer timeout
        await page.goto(searchUrl, { 
          waitUntil: 'networkidle2',  
          timeout: 60000  
        });

        // Initial delay before starting to look for elements
        await this.delay(3000);

        // Wait for any of these selectors to appear
        const selectors = [
          '.b-list-advert__item-wrapper',
          '.qa-advert-list-item',
          '.b-advert-list-item',
          '.js-advert-list-item'
        ];

        let productContainer = null;
        for (const selector of selectors) {
          try {
            productContainer = await page.waitForSelector(selector, { 
              timeout: 10000,
              visible: true 
            });
            if (productContainer) {
              console.log(`[JijiScraper] Found products with selector: ${selector}`);
              break;
            }
          } catch (error) {
            console.log(`[JijiScraper] Selector ${selector} not found, trying next...`);
            continue;
          }
        }

        if (!productContainer) {
          throw new Error('No product listings found on page');
        }

        // Scroll down a bit to trigger lazy loading
        await page.evaluate(() => {
          window.scrollBy(0, 500);
        });
        await this.delay(2000);

        // Get all product links and their timestamps
        const products = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll([
            '.b-list-advert__item-wrapper',
            '.qa-advert-list-item',
            '.b-advert-list-item',
            '.js-advert-list-item'
          ].join(', ')));

          return items.map(item => {
            const titleEl = item.querySelector('.qa-advert-title, .b-advert-title-inner, .b-advert-title, h3');
            const priceEl = item.querySelector('.qa-advert-price, .b-advert-price-inner, .b-advert-price, .price');
            const linkEl = item.querySelector('a');
            const imageEl = item.querySelector('img');
            const timeEl = item.querySelector('.b-list-advert__item-time, .qa-advert-time, time');

            return {
              title: titleEl?.textContent?.trim() || '',
              price: priceEl?.textContent?.trim() || '',
              link: linkEl?.href || '',
              image: imageEl?.src || '',
              timestamp: timeEl?.textContent?.trim() || ''
            };
          });
        });

        // Deduplicate products
        const uniqueProducts = this.deduplicateProducts(products);

        // Close browser
        await browser.close();
        browser = null;

        // Process and return products
        const processedProducts = uniqueProducts
          .map(item => ({
            id: `jiji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            price: parseFloat(item.price.replace(/[^0-9.]/g, '')),
            currency: this.currency,
            productUrl: item.link,
            imageUrl: item.image,
            store: this.store,
            rating: null,
            metadata: {
              relevancyScore: this.calculateRelevancyScore(item.title, query),
              timestamp: this.parseTimestamp(item.timestamp)
            }
          }))
          .filter(product => {
            if (!product.price) return false;
            if (minBudget && product.price < minBudget) return false;
            if (maxBudget && product.price > maxBudget) return false;
            return true;
          });

        console.log(`[JijiScraper] Found ${processedProducts.length} products`);
        return {
          success: true,
          products: processedProducts
        };

      } catch (error) {
        console.error('[JijiScraper] Error:', error);
        retries--;
        if (browser) {
          await browser.close();
          browser = null;
        }
        if (retries === 0) {
          return {
            success: false,
            error: 'Failed to scrape Jiji after multiple retries',
            products: []
          };
        }
        // Add increasing delay between retries
        await this.delay(2000 * (3 - retries));
      }
    }

    return {
      success: false,
      error: 'Failed to scrape Jiji',
      products: []
    };
  }
}

export const jijiScraper = new JijiScraper();
