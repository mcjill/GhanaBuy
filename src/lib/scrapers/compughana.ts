import puppeteer, { Browser, Page } from 'puppeteer';
import { BaseScraper } from './base-scraper';
import type { Product, ScrapingResult, SearchRequest } from './types';

interface RawProduct {
  title: string;
  price: number;
  priceFormatted: string;
  productUrl: string;
  imageUrl: string;
}

export class CompuGhanaScraper extends BaseScraper {
  private readonly baseUrl: string = 'https://compughana.com';
  private readonly store: string = 'CompuGhana';
  private readonly currency: string = 'GHS';
  private readonly maxRetries = 3;
  private readonly navigationTimeout = 60000; // Increased to 60s

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  }

  private async configurePage(page: Page): Promise<void> {
    await page.setDefaultNavigationTimeout(this.navigationTimeout);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"'
    });
  }

  private async getSearchResults(page: Page, minBudget?: number, maxBudget?: number): Promise<RawProduct[]> {
    try {
      // Wait for either products or no results message
      await Promise.race([
        page.waitForSelector('.products-grid, .products.list.items.product-items', { timeout: 20000 }),
        page.waitForSelector('.message.notice', { timeout: 20000 })
      ]);

      // Check for no results message
      const noResults = await page.$('.message.notice');
      if (noResults) {
        const message = await page.evaluate(el => el.textContent, noResults);
        if (message?.includes('Your search returned no results')) {
          console.log('[CompuGhanaScraper] No results found');
          return [];
        }
      }

      // Get all product items
      const products = await page.evaluate((minBudget, maxBudget) => {
        const items = document.querySelectorAll('.product-item, .item.product.product-item');
        console.log(`[CompuGhanaScraper Browser] Found ${items.length} product items`);
        
        return Array.from(items).map(item => {
          try {
            const titleEl = item.querySelector('.product-item-link, .product.name.product-item-name a');
            const priceEl = item.querySelector('.price-wrapper .price, .special-price .price, .normal-price .price');
            const linkEl = item.querySelector('a.product-item-link, a.product-item-photo');
            const imgEl = item.querySelector('.product-image-photo, img.photo.image');

            const title = titleEl?.textContent?.trim() || '';
            const priceFormatted = priceEl?.textContent?.trim() || '';
            const priceText = priceFormatted.replace(/[^\d.]/g, '');
            const price = parseFloat(priceText);

            console.log(`[CompuGhanaScraper Browser] Processing product:`, {
              title: title.substring(0, 50),
              priceFormatted,
              priceText,
              price,
              minBudget,
              maxBudget
            });

            const productUrl = linkEl?.href || '';
            
            // Try multiple image sources
            let imageUrl = '';
            if (imgEl) {
              // Try data-src first as it often contains the higher quality image
              imageUrl = imgEl.getAttribute('data-src') || 
                        imgEl.getAttribute('data-original') || 
                        imgEl.getAttribute('data-lazy') ||
                        imgEl.src || '';
                        
              // Log image finding attempt
              console.log(`[CompuGhanaScraper Browser] Image URL:`, {
                dataSrc: imgEl.getAttribute('data-src'),
                dataOriginal: imgEl.getAttribute('data-original'),
                dataLazy: imgEl.getAttribute('data-lazy'),
                src: imgEl.src,
                final: imageUrl
              });
            }

            // Only filter by price if both min and max are provided
            if (minBudget !== undefined && maxBudget !== undefined) {
              if (price < minBudget || price > maxBudget) {
                console.log(`[CompuGhanaScraper Browser] Price ${price} outside range ${minBudget}-${maxBudget}`);
                return null;
              }
            }

            if (title && !isNaN(price) && price > 0 && productUrl) {
              const product = {
                title,
                price,
                priceFormatted,
                productUrl,
                imageUrl: imageUrl || '/placeholder.png' // Fallback to placeholder if no image found
              };
              console.log(`[CompuGhanaScraper Browser] Valid product:`, {
                title: product.title.substring(0, 50),
                price: product.price,
                hasImage: !!product.imageUrl
              });
              return product;
            }
            console.log(`[CompuGhanaScraper Browser] Invalid product:`, { title, price, hasUrl: !!productUrl });
            return null;
          } catch (error) {
            console.error(`[CompuGhanaScraper Browser] Error processing item:`, error);
            return null;
          }
        }).filter(product => product !== null);
      }, minBudget, maxBudget);

      console.log(`[CompuGhanaScraper] Found ${products.length} products after filtering`);
      return products;
    } catch (error) {
      console.error(`[CompuGhanaScraper] Error getting search results:`, error);
      return [];
    }
  }

  private calculateRelevancyScore(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    const matchedWords = queryWords.filter(word => titleLower.includes(word));
    const score = matchedWords.length / queryWords.length;

    // Penalize if it's not the right product category
    if (!titleLower.includes('iphone') && queryWords.includes('iphone')) {
      return score * 0.1; // Heavy penalty for non-iPhone products when searching for iPhone
    }

    // Penalize if it's an accessory
    if (titleLower.includes('case') || titleLower.includes('screen') || titleLower.includes('protector')) {
      return score * 0.3;
    }

    return score;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    const { query, minBudget, maxBudget } = request;
    let browser: Browser | null = null;
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
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
        await this.configurePage(page);

        const searchUrl = this.getSearchUrl(query);
        console.log(`[CompuGhanaScraper] Accessing search URL: ${searchUrl}`);

        const response = await page.goto(searchUrl, { 
          waitUntil: 'networkidle0',
          timeout: this.navigationTimeout 
        });

        if (!response?.ok()) {
          throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        // Add a small delay to ensure dynamic content is loaded
        await this.delay(2000);

        const rawProducts = await this.getSearchResults(page, minBudget, maxBudget);
        
        await browser.close();
        browser = null;

        if (rawProducts.length === 0) {
          console.log('[CompuGhanaScraper] No products found');
          return { success: true, products: [], error: null };
        }

        // Process and filter products
        const products = rawProducts
          .map(item => ({
            id: `compughana-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            price: item.price,
            currency: this.currency,
            productUrl: item.productUrl,
            imageUrl: item.imageUrl,
            store: this.store,
            rating: null,
            reviews: null,
            availability: true,
            metadata: {
              relevancyScore: this.calculateRelevancyScore(item.title, query)
            }
          }))
          .filter(product => {
            const score = product.metadata.relevancyScore;
            return score >= 0.5; // Only keep products with at least 50% relevancy
          })
          .sort((a, b) => (b.metadata.relevancyScore || 0) - (a.metadata.relevancyScore || 0));

        console.log(`[CompuGhanaScraper] Successfully processed ${products.length} products`);
        return { success: true, products, error: null };

      } catch (error) {
        console.error(`[CompuGhanaScraper] Error during attempt ${retryCount + 1}:`, error);
        if (browser) {
          await browser.close();
          browser = null;
        }
        
        retryCount++;
        if (retryCount < this.maxRetries) {
          console.log(`[CompuGhanaScraper] Retrying... (${retryCount}/${this.maxRetries})`);
          await this.delay(2000 * retryCount); // Exponential backoff
        }
      }
    }

    return { 
      success: false, 
      products: [], 
      error: `Failed after ${this.maxRetries} attempts` 
    };
  }
}

// Export the scraper instance
export const compuGhanaScraper = new CompuGhanaScraper();
