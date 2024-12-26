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
  private readonly navigationTimeout = 60000;
  private readonly rotatingUserAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomUserAgent(): string {
    return this.rotatingUserAgents[Math.floor(Math.random() * this.rotatingUserAgents.length)];
  }

  private getSearchUrl(query: string): string {
    return `${this.baseUrl}/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  }

  private async configurePage(page: Page, retryCount: number): Promise<void> {
    await page.setDefaultNavigationTimeout(this.navigationTimeout);
    
    // Randomize viewport size
    const width = 1920 + Math.floor(Math.random() * 100);
    const height = 1080 + Math.floor(Math.random() * 100);
    await page.setViewport({ width, height });

    // Get random user agent
    const userAgent = this.getRandomUserAgent();
    await page.setUserAgent(userAgent);

    // Randomize accept-language
    const languages = ['en-US,en;q=0.9', 'en-GB,en;q=0.8,en;q=0.7', 'en;q=0.8,en-US;q=0.6'];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];

    // Set cookies to appear more like a real browser
    await page.setCookie({
      name: 'visited',
      value: 'true',
      domain: 'compughana.com',
      path: '/',
    });

    // Add more realistic headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': randomLang,
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });

    // Add random delay based on retry count
    const baseDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    const randomDelay = Math.floor(Math.random() * 2000); // Random delay up to 2 seconds
    await this.delay(baseDelay + randomDelay);
  }

  private async interceptRequests(page: Page): Promise<void> {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Block analytics and tracking
      if (url.includes('google-analytics.com') || 
          url.includes('analytics') || 
          url.includes('tracking') ||
          url.includes('facebook.com') ||
          url.includes('doubleclick.net')) {
        request.abort();
        return;
      }

      // Block unnecessary resources
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
        return;
      }

      // Add referrer for main document requests
      if (resourceType === 'document') {
        const headers = request.headers();
        headers['Referer'] = 'https://compughana.com/';
        request.continue({ headers });
        return;
      }

      request.continue();
    });
  }

  private async getSearchResults(page: Page, minBudget?: number, maxBudget?: number): Promise<RawProduct[]> {
    try {
      await Promise.race([
        page.waitForSelector('.products-grid, .products.list.items.product-items', { timeout: 20000 }),
        page.waitForSelector('.message.notice', { timeout: 20000 })
      ]);

      const noResults = await page.$('.message.notice');
      if (noResults) {
        const message = await page.evaluate(el => el.textContent, noResults);
        if (message?.includes('Your search returned no results')) {
          return [];
        }
      }

      return await page.evaluate((minBudget, maxBudget) => {
        const items = document.querySelectorAll('.product-item, .item.product.product-item');
        
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
            const productUrl = linkEl?.href || '';
            const imageUrl = imgEl?.getAttribute('data-src') || 
                           imgEl?.getAttribute('data-original') || 
                           imgEl?.getAttribute('data-lazy') ||
                           imgEl?.src || '';

            if (minBudget !== undefined && maxBudget !== undefined) {
              if (price < minBudget || price > maxBudget) {
                return null;
              }
            }

            if (title && !isNaN(price) && price > 0 && productUrl) {
              return {
                title,
                price,
                priceFormatted,
                productUrl,
                imageUrl: imageUrl || '/placeholder.png'
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        }).filter(Boolean);
      }, minBudget, maxBudget);
    } catch (error) {
      console.error(`[CompuGhanaScraper] Error getting search results:`, error);
      return [];
    }
  }

  private calculateRelevancyScore(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();

    // Check for exact match first
    if (titleLower.includes(queryLower)) {
      return 1.0;
    }

    // Split into words and check individual matches
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    const titleWords = titleLower.split(' ').filter(word => word.length > 2);
    
    // Count exact word matches
    const exactWordMatches = queryWords.filter(queryWord => 
      titleWords.some(titleWord => titleWord === queryWord)
    ).length;

    // Calculate base score from exact word matches
    let score = exactWordMatches / queryWords.length;

    // Boost score for partial matches of longer words (e.g., "macbook" in "macbookpro")
    const partialMatches = queryWords.filter(queryWord => 
      titleWords.some(titleWord => 
        titleWord.includes(queryWord) || queryWord.includes(titleWord)
      )
    ).length;
    
    score = Math.max(score, partialMatches / queryWords.length * 0.8);

    // Category-specific adjustments
    const categoryKeywords = {
      laptop: ['macbook', 'laptop', 'notebook', 'thinkpad', 'dell', 'hp', 'lenovo'],
      phone: ['iphone', 'samsung', 'phone', 'mobile', 'smartphone'],
      printer: ['printer', 'scanner', 'copier', 'mfp'],
      accessory: ['case', 'cover', 'charger', 'adapter', 'cable']
    };

    // Detect query category
    let queryCategory = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        queryCategory = category;
        break;
      }
    }

    // Detect product category
    let productCategory = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        productCategory = category;
        break;
      }
    }

    // Penalize if categories don't match
    if (queryCategory && productCategory && queryCategory !== productCategory) {
      score *= 0.1; // Heavy penalty for category mismatch
    }

    // Additional penalties for specific cases
    if (queryLower.includes('macbook') && !titleLower.includes('macbook')) {
      score *= 0.1; // Heavy penalty for non-Macbook products when searching for Macbook
    }

    // Penalize accessories when not specifically searching for them
    const isAccessory = categoryKeywords.accessory.some(keyword => titleLower.includes(keyword));
    const searchingForAccessory = categoryKeywords.accessory.some(keyword => queryLower.includes(keyword));
    if (isAccessory && !searchingForAccessory) {
      score *= 0.3;
    }

    return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
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
            '--window-size=1920,1080',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars'
          ],
          ignoreHTTPSErrors: true
        });

        // Add random delay before creating page
        await this.delay(Math.random() * 1000);

        const page = await browser.newPage();
        
        // Mask automation
        await page.evaluateOnNewDocument(() => {
          // Overwrite the automation flag
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
          // Overwrite permissions
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters: any) => (
            parameters.name === 'notifications' ?
              Promise.resolve({ state: Notification.permission }) :
              originalQuery(parameters)
          );
        });

        await this.configurePage(page, retryCount);
        await this.interceptRequests(page);

        const searchUrl = this.getSearchUrl(query);
        console.log(`[CompuGhanaScraper] Accessing search URL: ${searchUrl}`);

        // Add random delay before navigation
        await this.delay(500 + Math.random() * 1000);

        const response = await page.goto(searchUrl, { 
          waitUntil: 'networkidle0',
          timeout: this.navigationTimeout 
        });

        if (!response?.ok()) {
          throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        // Add random delay before scraping
        await this.delay(1000 + Math.random() * 2000);

        const rawProducts = await this.getSearchResults(page, minBudget, maxBudget);
        
        const products: Product[] = rawProducts
          .map(raw => {
            const relevancyScore = this.calculateRelevancyScore(raw.title, query);
            if (relevancyScore < 0.3) return null;

            return {
              id: `compughana-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: raw.title,
              price: raw.price,
              priceFormatted: raw.priceFormatted,
              productUrl: raw.productUrl,
              imageUrl: raw.imageUrl,
              store: this.store,
              currency: this.currency,
              rating: null,
              reviews: null,
              availability: true,
              metadata: {
                relevancyScore,
                searchQuery: query,
                priceFormatted: raw.priceFormatted
              }
            };
          })
          .filter((product): product is Product => product !== null)
          .sort((a, b) => b.relevancyScore - a.relevancyScore);

        await browser.close();
        browser = null;

        return {
          success: true,
          products,
          error: null
        };

      } catch (error) {
        console.error(`[CompuGhanaScraper] Error during attempt ${retryCount + 1}:`, error);
        
        if (browser) {
          await browser.close();
          browser = null;
        }

        retryCount++;
        if (retryCount === this.maxRetries) {
          return {
            success: false,
            products: [],
            error: `Failed after ${this.maxRetries} attempts: ${error.message}`
          };
        }

        // Exponential backoff with some randomness
        const backoffTime = Math.pow(2, retryCount) * 1000 + (Math.random() * 1000);
        await this.delay(backoffTime);
      }
    }

    return {
      success: false,
      products: [],
      error: 'Unknown error occurred'
    };
  }
}

export const compuGhanaScraper = new CompuGhanaScraper();
