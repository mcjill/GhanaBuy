import { chromium, Browser, BrowserContext, Page } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SearchRequest, ScrapingResult, Product } from './types';

function cleanPrice(priceText: string): number {
  if (!priceText) return 0;
  // Remove GH₵, commas, and other non-numeric characters
  const cleaned = priceText.replace(/[GH₵,\s]/g, '').replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function isWithinBudget(price: number, minBudget?: number, maxBudget?: number): boolean {
  if (minBudget !== undefined && price < minBudget) return false;
  if (maxBudget !== undefined && price > maxBudget) return false;
  return true;
}

class JumiaPlaywrightScraper {
  private readonly baseUrl = 'https://www.jumia.com.gh';
  private readonly mobileUrl = 'https://www.jumia.com.gh';
  private readonly store = 'Jumia';

  private buildSearchUrl(query: string): string {
    return `${this.baseUrl}/catalog/?q=${encodeURIComponent(query)}`;
  }

  private buildMobileSearchUrl(query: string): string {
    return `${this.mobileUrl}/catalog/?q=${encodeURIComponent(query)}`;
  }

  // Fallback HTTP scraper for when Playwright fails
  private async scrapeWithHTTP(query: string, minBudget?: number, maxBudget?: number): Promise<Product[]> {
    try {
      const searchUrl = this.buildMobileSearchUrl(query);
      console.log(`[Jumia HTTP] Trying mobile site: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const products: Product[] = [];
      
      // Mobile site selectors
      const productElements = $('article, .prd, .product, .item, [data-product]');
      
      productElements.each((index, element) => {
        try {
          const $el = $(element);
          
          // Extract title
          const title = $el.find('h3, .name, .title, .product-name, .prd-name').first().text().trim() ||
                       $el.find('a').first().attr('title') || '';
          
          if (!title || title.toLowerCase().includes('advertisement')) return;
          
          // Extract price
          const priceText = $el.find('.price, .cost, .prd-price, .current-price').first().text().trim();
          const price = cleanPrice(priceText);
          
          if (price === 0 || !isWithinBudget(price, minBudget, maxBudget)) return;
          
          // Extract link
          const link = $el.find('a').first().attr('href') || '';
          const fullLink = link ? (link.startsWith('http') ? link : `${this.mobileUrl}${link}`) : `${this.baseUrl}`;
          
          // Extract image with better handling for Jumia's lazy loading
          let image = '';
          const imgEl = $el.find('img').first();
          
          // Try multiple image attributes in order of preference
          const imageAttrs = ['data-src', 'src', 'data-lazy', 'data-original', 'data-img', 'data-image'];
          for (const attr of imageAttrs) {
            const imgUrl = imgEl.attr(attr);
            if (imgUrl && !imgUrl.includes('data:image') && !imgUrl.includes('placeholder') && !imgUrl.includes('svg')) {
              image = imgUrl;
              break;
            }
          }
          
          // If still no valid image, try to extract from srcset
          if (!image) {
            const srcset = imgEl.attr('srcset');
            if (srcset) {
              const srcsetUrls = srcset.split(',').map(s => s.trim().split(' ')[0]);
              image = srcsetUrls.find(url => url && !url.includes('data:image') && !url.includes('svg')) || '';
            }
          }
          
          const fullImage = image && !image.startsWith('http') && !image.startsWith('data:') ? 
            `${this.mobileUrl}${image}` : image;
          
          products.push({
            id: `jumia-http-${Date.now()}-${index}`,
            title,
            price,
            currency: 'GHS',
            productUrl: fullLink,
            imageUrl: fullImage,
            store: this.store,
            rating: null,
            reviews: null,
            availability: true,
            metadata: {
              scrapedAt: new Date().toISOString(),
              relevancyScore: 0.5
            }
          });
        } catch (error) {
          console.error('[Jumia HTTP] Error parsing product:', error);
        }
      });
      
      return products;
    } catch (error) {
      console.error('[Jumia HTTP] Scraping failed:', error);
      return [];
    }
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      const { query, minBudget, maxBudget } = request;
      const searchUrl = this.buildSearchUrl(query);
      
      console.log(`[Jumia Playwright] Scraping: ${searchUrl}`);

      // Launch browser with enhanced anti-detection
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none'
        }
      });

      page = await context.newPage();

      // Enhanced stealth techniques
      await page.addInitScript(() => {
        // Remove webdriver property
        delete (window as any).navigator.webdriver;
        
        // Override the plugins property
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        
        // Override the languages property
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
        
        // Override webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
        
        // Mock chrome runtime
        (window as any).chrome = {
          runtime: {}
        };
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission } as any) :
            originalQuery(parameters)
        );
      });

      // Block unnecessary resources but allow some for detection avoidance
      await page.route('**/*.{png,jpg,jpeg,gif,woff,woff2}', route => route.abort());

      // Try mobile site first (often less protected)
      try {
        const mobileUrl = this.buildMobileSearchUrl(query);
        console.log(`[Jumia Playwright] Trying mobile site: ${mobileUrl}`);
        
        await page.goto(mobileUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
        
        await page.waitForTimeout(3000);
        
        const content = await page.content();
        if (!content.includes('Cloudflare') && !content.includes('cf-browser-verification')) {
          console.log('[Jumia Playwright] Mobile site loaded successfully');
        } else {
          throw new Error('Mobile site also blocked');
        }
        
      } catch (error) {
        console.log(`[Jumia Playwright] Mobile site failed: ${error}`);
        
        // Fallback to HTTP scraping
        console.log('[Jumia Playwright] Falling back to HTTP scraping...');
        const httpProducts = await this.scrapeWithHTTP(query, minBudget, maxBudget);
        
        if (httpProducts.length > 0) {
          console.log(`[Jumia HTTP] Found ${httpProducts.length} products via HTTP fallback`);
          return {
            success: true,
            products: httpProducts,
            error: null
          };
        }
        
        throw new Error('Both Playwright and HTTP methods failed');
      }

      // Try to wait for product listings to appear
      try {
        await page.waitForSelector('.prd, .product, [data-product], .item', { 
          timeout: 15000 
        });
      } catch (error) {
        console.log('[Jumia Playwright] No product selectors found, continuing with content extraction');
      }

      // Extract products using multiple selector strategies
      const products = await page.evaluate(() => {
        const productSelectors = [
          'article',
          '.prd',
          '.product',
          '[data-product]',
          '.item',
          '.product-item',
          '.card',
          '.listing-item',
          '.product-card',
          '.core'
        ];

        const products: any[] = [];

        function cleanPrice(priceText: string): number {
          if (!priceText) return 0;
          const cleaned = priceText.replace(/[GH₵,\s]/g, '').replace(/[^0-9.]/g, '');
          return parseFloat(cleaned) || 0;
        }

        function isWithinBudget(price: number, minBudget?: number, maxBudget?: number): boolean {
          if (minBudget !== undefined && price < minBudget) return false;
          if (maxBudget !== undefined && price > maxBudget) return false;
          return true;
        }

        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`[Jumia Browser] Found ${elements.length} products with selector: ${selector}`);
            
            elements.forEach((element, index) => {
              try {
                // Enhanced title extraction
                const titleSelectors = [
                  '.name',
                  '.title',
                  '.product-name',
                  '.product-title',
                  'h3',
                  'h4',
                  '.prd-name',
                  '.item-name'
                ];
                
                let title = '';
                for (const titleSel of titleSelectors) {
                  const titleEl = element.querySelector(titleSel);
                  if (titleEl) {
                    title = titleEl.textContent?.trim() || '';
                    if (title) break;
                  }
                }

                // Try link title or image alt as fallback
                if (!title) {
                  const linkEl = element.querySelector('a');
                  title = linkEl?.getAttribute('title') || '';
                }
                if (!title) {
                  const imgEl = element.querySelector('img');
                  title = imgEl?.getAttribute('alt') || '';
                }

                if (!title) return;

                // Enhanced price extraction
                const priceSelectors = [
                  '.prc',
                  '.price',
                  '.amount',
                  '.cost',
                  '.product-price',
                  '.item-price',
                  '.prd-price',
                  '.current-price'
                ];

                let priceText = '';
                for (const priceSel of priceSelectors) {
                  const priceEl = element.querySelector(priceSel);
                  if (priceEl) {
                    priceText = priceEl.textContent?.trim() || '';
                    if (priceText) break;
                  }
                }

                const price = cleanPrice(priceText);
                if (price === 0) return;

                // Enhanced link extraction
                let link = '';
                
                // Try to find product-specific links, avoiding login redirects
                const linkSelectors = [
                  'a[href*="/products/"]:not([href*="login"])',
                  'a[href*="/product/"]:not([href*="login"])',
                  '.name a:not([href*="login"])',
                  '.product-title a:not([href*="login"])',
                  'h3 a:not([href*="login"])',
                  'a[href^="/"]:not([href*="login"]):not([href*="customer"])'
                ];
                
                for (const selector of linkSelectors) {
                  const linkEl = element.querySelector(selector);
                  const href = linkEl?.getAttribute('href') || '';
                  if (href && 
                      !href.includes('svg') && 
                      !href.includes('icon') && 
                      !href.includes('login') &&
                      !href.includes('customer') &&
                      href !== '#' && 
                      (href.includes('/product') || href.includes('.html') || href.startsWith('/'))) {
                    link = href;
                    break;
                  }
                }
                
                // If we got a login redirect, extract the actual product URL from return parameter
                if (link && link.includes('login') && link.includes('return=')) {
                  try {
                    if (link.startsWith('http')) {
                      // Validate URL before constructing
                      try {
                        const url = new URL(link);
                        const returnUrl = url.searchParams.get('return');
                        if (returnUrl) {
                          link = decodeURIComponent(returnUrl);
                        }
                      } catch (urlError) {
                        console.error('[Jumia Browser] Invalid URL for parsing:', link);
                        link = '';
                      }
                    } else {
                      // Handle relative URLs with return parameter
                      const returnMatch = link.match(/return=([^&]+)/);
                      if (returnMatch) {
                        link = decodeURIComponent(returnMatch[1]);
                      }
                    }
                  } catch (e) {
                    // If URL parsing fails, fallback to search
                    console.error('[Jumia Browser] URL parsing error:', e);
                    link = '';
                  }
                }
                
                const fullLink = link && !link.includes('svg') && !link.includes('login') ? 
                  (link.startsWith('http') ? link : `https://www.jumia.com.gh${link}`) : 
                  `https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`;

                // Enhanced image extraction with better handling for Jumia's lazy loading
                const imgEl = element.querySelector('img');
                let image = '';
                
                if (imgEl) {
                  // Try multiple image attributes in order of preference
                  const imageAttrs = ['data-src', 'src', 'data-lazy', 'data-original', 'data-img', 'data-image'];
                  for (const attr of imageAttrs) {
                    const imgUrl = imgEl.getAttribute(attr);
                    if (imgUrl && !imgUrl.includes('data:image') && !imgUrl.includes('placeholder') && !imgUrl.includes('svg')) {
                      image = imgUrl;
                      break;
                    }
                  }
                  
                  // If still no valid image, try to extract from srcset
                  if (!image) {
                    const srcset = imgEl.getAttribute('srcset');
                    if (srcset) {
                      const srcsetUrls = srcset.split(',').map((s: string) => s.trim().split(' ')[0]);
                      image = srcsetUrls.find(url => url && !url.includes('data:image') && !url.includes('svg')) || '';
                    }
                  }
                }
                
                const fullImage = image && !image.startsWith('http') && !image.startsWith('data:') ? 
                  `https://www.jumia.com.gh${image}` : image;

                products.push({
                  id: `jumia-${Date.now()}-${index}`,
                  title: title,
                  price: price,
                  currency: 'GHS',
                  productUrl: fullLink,
                  imageUrl: fullImage,
                  store: 'Jumia',
                  rating: null,
                  reviews: null,
                  availability: true,
                  metadata: {
                    scrapedAt: new Date().toISOString(),
                    relevancyScore: 0.5
                  }
                });
              } catch (error) {
                console.error('[Jumia Browser] Error parsing product:', error);
              }
            });
            break; // Stop after finding products with first working selector
          }
        }

        return products;
      });

      // Apply budget filtering
      const filteredProducts = (products as Product[]).filter(product => 
        isWithinBudget(product.price, minBudget, maxBudget)
      );

      console.log(`[Jumia Playwright] Scraped ${filteredProducts.length} products (${(products as Product[]).length} before budget filter)`);
      
      return {
        success: true,
        products: filteredProducts,
        error: null
      };

    } catch (error) {
      console.error('[Jumia Playwright] Scraping error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Jumia scraping failed'
      };
    } finally {
      // Cleanup resources
      try {
        if (page) await page.close();
        if (context) await context.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        console.error('[Jumia Playwright] Cleanup error:', cleanupError);
      }
    }
  }
}

export const jumiaScraper = new JumiaPlaywrightScraper();
