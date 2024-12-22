import type { Page, Browser, PuppeteerLaunchOptions } from 'puppeteer';
import puppeteer from 'puppeteer';
import type { Product, ScrapingResult } from './types';

interface Selectors {
  productCard: string;
  title: string;
  price: string;
  image: string;
  link: string;
}

const configs: Record<string, RehydrationConfig> = {
  'jiji.com.gh': {
    selectors: {
      productCard: '.b-list-advert__gallery__item',
      title: '.b-advert-title-inner',
      price: '.qa-advert-price',
      image: 'img[data-nuxt-pic]',
      link: 'a.b-list-advert-base'
    },
    dataExtractor: async (page: Page) => {
      try {
        // Wait for product cards to load
        await page.waitForSelector('.b-list-advert__gallery__item', { timeout: 30000 });

        // Extract products data
        const products = await page.evaluate((selectors: Selectors) => {
          const cards = document.querySelectorAll(selectors.productCard);
          return Array.from(cards).map(card => {
            const titleElem = card.querySelector(selectors.title);
            const title = titleElem?.textContent?.trim() || '';
            const priceText = card.querySelector(selectors.price)?.textContent?.trim() || '0';
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const imageUrl = card.querySelector(selectors.image)?.getAttribute('src') || '';
            const link = card.querySelector(selectors.link)?.getAttribute('href') || '';

            // Generate ID from link or timestamp
            const id = link ? 
              `jiji-${link.split('/').pop()?.split('.')[0]}` : 
              `jiji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            return {
              id,
              title,
              price,
              currency: 'GHS',
              productUrl: `https://jiji.com.gh${link}`,
              imageUrl,
              store: 'Jiji Ghana',
              rating: null,
              reviews: null
            };
          });
        }, configs['jiji.com.gh'].selectors);

        return products.filter((product: Product) => product.title && product.price > 0);
      } catch (error) {
        console.error('Error extracting Jiji data:', error);
        return [];
      }
    },
    searchUrl: (query) => `https://jiji.com.gh/search?query=${encodeURIComponent(query)}`,
  }
};

interface RehydrationConfig {
  selectors: Selectors;
  dataExtractor: (page: Page) => Promise<Product[]>;
  searchUrl: (query: string) => string;
}

export async function scrapeWithRehydration(url: string): Promise<Product[]> {
  let browser: Browser | null = null;
  
  try {
    const options: PuppeteerLaunchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    };

    browser = await puppeteer.launch(options);
    const domain = new URL(url).hostname;
    const config = configs[domain];
    
    if (!config) {
      console.error(`No configuration found for domain: ${domain}`);
      return [];
    }

    console.log(`Fetching ${url}...`);
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the URL with longer timeout
    await page.goto(url, { 
      waitUntil: 'networkidle0', 
      timeout: 60000 
    });
    
    // Wait for a bit to ensure dynamic content loads
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Extract products
    const products = await config.dataExtractor(page);
    console.log(`Extracted ${products.length} products from ${domain}`);
    
    return products;
  } catch (error) {
    console.error(`Error in scrapeWithRehydration:`, error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function searchAllStores(query: string): Promise<ScrapingResult> {
  try {
    const searchPromises = Object.values(configs).map(config => 
      scrapeWithRehydration(config.searchUrl(query))
        .catch(error => {
          console.error('Error searching store:', error);
          return [];
        })
    );

    const results = await Promise.all(searchPromises);
    const products = results.flat();

    return {
      success: true,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
