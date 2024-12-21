import { Product, ScrapingResult, SearchRequest } from './types';
import * as puppeteer from 'puppeteer';

interface TwitterAccount {
  handle: string;
  priority: number;
  url: string;
}

export class XScraper {
  private readonly store = 'X (Twitter)' as const;
  private readonly currency = 'GHS';
  private readonly accounts: TwitterAccount[] = [
    {
      handle: 'forlinkin',
      priority: 1, // Highest priority
      url: 'https://twitter.com/forlinkin'
    },
    {
      handle: 'mcitygh',
      priority: 2,
      url: 'https://twitter.com/mcitygh'
    },
    {
      handle: 'sarkwealthy',
      priority: 3,
      url: 'https://twitter.com/sarkwealthy'
    },
    {
      handle: 'paraycomputers',
      priority: 4,
      url: 'https://twitter.com/paraycomputers'
    }
  ];

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    let browser;
    try {
      console.log(`[XScraper] Starting search for: ${request.query}`);

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--window-size=1920,1080',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      const allProducts: Product[] = [];
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Scrape each account
      for (const account of this.accounts) {
        try {
          // Go to advanced search
          const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(`(${request.query}) (from:${account.handle})`)}`;
          console.log(`[XScraper] Scraping ${searchUrl}`);
          
          await page.goto(searchUrl, { 
            waitUntil: 'networkidle0', 
            timeout: 30000 
          });

          // Wait for initial content to load
          await page.waitForFunction(() => {
            const content = document.body.textContent || '';
            return content.includes('Top') || content.includes('Latest') || content.includes('People') || content.includes('Photos');
          }, { timeout: 10000 });

          // Wait a bit for dynamic content
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Extract tweets with prices
          const products = await page.evaluate((handle: string) => {
            const results: any[] = [];
            const tweetElements = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
            
            tweetElements.forEach((tweet) => {
              const tweetText = tweet.textContent?.toLowerCase() || '';
              const hasPrice = tweetText.match(/gh[sc¢]?\s*[₵¢]?\s*\d+(?:,\d{3})*(?:\.\d{2})?/i);
              
              if (hasPrice) {
                const priceMatch = tweetText.match(/\d+(?:,\d{3})*(?:\.\d{2})?/);
                const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
                
                if (price > 0) {
                  // Get image if available
                  const imageElement = tweet.querySelector('img[src*="/media/"]');
                  const imageUrl = imageElement?.getAttribute('src') || '';
                  
                  // Get tweet URL
                  const timeElement = tweet.querySelector('time');
                  const linkElement = timeElement?.parentElement;
                  const tweetUrl = linkElement?.getAttribute('href') 
                    ? `https://twitter.com${linkElement.getAttribute('href')}`
                    : '';
                  
                  results.push({
                    id: tweetUrl.split('/').pop() || crypto.randomUUID(),
                    title: tweetText.slice(0, 100) + '...',
                    price,
                    currency: 'GHS',
                    productUrl: tweetUrl,
                    imageUrl,
                    store: `X: @${handle}`,
                    rating: null,
                    reviews: null
                  });
                }
              }
            });
            
            return results;
          }, account.handle);

          allProducts.push(...products);
          
        } catch (error) {
          console.error(`Error scraping account @${account.handle}:`, error);
        }
      }

      // Sort by account priority
      const sortedProducts = allProducts.sort((a, b) => {
        const accountA = this.accounts.find(acc => a.store.includes(acc.handle));
        const accountB = this.accounts.find(acc => b.store.includes(acc.handle));
        
        if (accountA && accountB) {
          if (accountA.priority !== accountB.priority) {
            return accountA.priority - accountB.priority;
          }
        }
        return 0;
      });

      console.log(`[XScraper] Found ${sortedProducts.length} products`);
      return {
        success: true,
        products: sortedProducts,
        error: null
      };

    } catch (error) {
      console.error('Error scraping X:', error);
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

export const xScraper = new XScraper();
