import puppeteer, { Browser, Page } from 'puppeteer';
import { Product, Scraper, SearchRequest, ScrapingResult } from './types';

interface RawProduct {
  title: string;
  price: number;
  priceFormatted: string;
  productUrl: string;
  imageUrl: string;
  category?: string;
}

export class TelefonikaScraper implements Scraper {
  readonly name = 'Telefonika';
  readonly baseUrl = 'https://telefonika.com';
  private readonly currency = 'GHS';
  private readonly maxRetries = 3;
  private readonly navigationTimeout = 60000;

  // Product categories and their keywords
  private readonly categoryKeywords: Record<string, string[]> = {
    'air-condition': ['air condition', 'air conditioner', 'ac', 'hvac'],
    'phone': ['phone', 'iphone', 'samsung', 'android'],
    'laptop': ['laptop', 'macbook', 'notebook'],
    'accessory': ['case', 'cover', 'protector', 'charger', 'cable', 'airpod', 'earbud', 'headphone']
  };

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  private detectCategory(title: string, query: string): string | null {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();

    // First try to match the query to a category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        // If we found a category from the query, verify the title matches it
        if (keywords.some(keyword => titleLower.includes(keyword))) {
          return category;
        }
      }
    }

    // If no category matched the query, try to detect category from title
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }

    return null;
  }

  protected calculateRelevancyScore(title: string, query: string, category: string | null): number {
    const titleLower = title.toLowerCase();
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    // If category doesn't match the query's intended category, return 0
    const queryCategory = Object.entries(this.categoryKeywords)
      .find(([_, keywords]) => keywords.some(keyword => query.toLowerCase().includes(keyword)))?.[0];
    
    if (queryCategory && category !== queryCategory) {
      return 0;
    }

    // Calculate word match score
    const matchedWords = queryWords.filter(word => titleLower.includes(word));
    let score = matchedWords.length / queryWords.length;

    // Exact phrase matching bonus
    if (titleLower.includes(query.toLowerCase())) {
      score *= 1.5;
    }

    // Penalize accessories when not specifically searching for them
    if (category === 'accessory' && !queryWords.some(word => 
      this.categoryKeywords.accessory.some(keyword => word.includes(keyword)))) {
      score *= 0.1;
    }

    // Penalize if the title contains irrelevant category keywords
    const otherCategories = Object.entries(this.categoryKeywords)
      .filter(([cat, _]) => cat !== category)
      .flatMap(([_, keywords]) => keywords);
    
    if (otherCategories.some(keyword => titleLower.includes(keyword))) {
      score *= 0.5;
    }

    return Math.min(score, 1);
  }

  private getSearchUrl(query: string): string {
    // Clean and normalize the search query
    const cleanQuery = query.trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize spaces
    return `${this.baseUrl}/?s=${encodeURIComponent(cleanQuery)}&post_type=product`;
  }

  private async getSearchResults(page: Page, minBudget: number, maxBudget: number): Promise<RawProduct[]> {
    await Promise.race([
      page.waitForSelector('.products.wd-products, .products.elements-grid', { timeout: this.navigationTimeout }),
      page.waitForSelector('.woocommerce-info, .no-products-found, .no-results', { timeout: this.navigationTimeout })
    ]);

    return await page.evaluate((minBudget, maxBudget) => {
      const items = document.querySelectorAll('.products.wd-products .product-grid-item, .product.type-product');
      console.log(`[TelefonikaScraper Browser] Found ${items.length} product items`);
      
      return Array.from(items).map(item => {
        try {
          const titleEl = item.querySelector('.wd-entities-title, .product-title');
          const priceEl = item.querySelector('.price .woocommerce-Price-amount');
          const linkEl = item.querySelector('a.product-image-link');
          const imgEl = item.querySelector('img');
          const categoryEl = item.querySelector('.product-categories');

          if (!titleEl || !priceEl || !linkEl) {
            console.log('[TelefonikaScraper Browser] Missing required elements');
            return null;
          }

          const title = titleEl.textContent?.trim() || '';
          const priceText = priceEl.textContent?.replace(/[^0-9.]/g, '') || '';
          const price = parseFloat(priceText);
          const productUrl = linkEl.href || '';
          const imageUrl = imgEl?.getAttribute('data-src') || imgEl?.src || '';
          const category = categoryEl?.textContent?.trim() || '';

          if (!title || !price || !productUrl) return null;
          if (minBudget && price < minBudget) return null;
          if (maxBudget && price > maxBudget) return null;

          return {
            title,
            price,
            priceFormatted: priceEl.textContent?.trim() || '',
            productUrl,
            imageUrl: imageUrl || '/placeholder.png',
            category
          };
        } catch (error) {
          console.error('[TelefonikaScraper Browser] Error processing item:', error);
          return null;
        }
      }).filter(Boolean);
    }, minBudget, maxBudget);
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
        console.log(`[TelefonikaScraper] Accessing search URL: ${searchUrl}`);

        const response = await page.goto(searchUrl, { 
          waitUntil: 'networkidle0',
          timeout: this.navigationTimeout 
        });

        if (!response?.ok()) {
          throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        const rawProducts = await this.getSearchResults(page, minBudget, maxBudget);
        
        // Process and filter products
        const products = rawProducts
          .map(item => {
            const category = this.detectCategory(item.title, query);
            const relevancyScore = this.calculateRelevancyScore(item.title, query, category);
            
            if (relevancyScore < 0.3) return null;

            return {
              id: `telefonika-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: item.title,
              price: item.price,
              currency: this.currency,
              productUrl: item.productUrl,
              imageUrl: item.imageUrl,
              store: this.name,
              rating: null,
              reviews: null,
              availability: true,
              metadata: {
                relevancyScore,
                searchQuery: query,
                category: item.category
              }
            };
          })
          .filter((product): product is Product => product !== null)
          .sort((a, b) => (b.metadata?.relevancyScore || 0) - (a.metadata?.relevancyScore || 0));

        await browser.close();
        browser = null;

        return {
          success: true,
          products,
          error: null
        };

      } catch (error) {
        console.error(`[TelefonikaScraper] Error during scraping (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (browser) {
          await browser.close();
          browser = null;
        }

        if (retryCount === this.maxRetries) {
          return {
            success: false,
            products: [],
            error: `Failed after ${this.maxRetries} attempts: ${error.message}`
          };
        }

        // Exponential backoff
        await this.delay(Math.pow(2, retryCount) * 1000);
      }
    }

    return {
      success: false,
      products: [],
      error: 'Unknown error occurred'
    };
  }
}

export const telefonikaScraper = new TelefonikaScraper();
