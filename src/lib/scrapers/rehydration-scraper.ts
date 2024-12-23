import * as puppeteer from 'puppeteer';
import { Product, ScrapingResult } from './types';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface Selectors {
  productCard: string;
  title: string;
  price: string;
  image: string;
  link: string;
}

interface RehydrationConfig {
  selectors: Selectors;
  dataExtractor: (page: puppeteer.Page) => Promise<Product[]>;
  searchUrl: (query: string) => string;
}

const configs: Record<string, RehydrationConfig> = {
  'jiji.com.gh': {
    selectors: {
      productCard: 'article',
      title: 'h4, h3, .b-list-advert__item-title',
      price: '[data-price], .b-list-advert__item-price',
      image: 'img',
      link: 'a'
    },
    dataExtractor: async (page: puppeteer.Page): Promise<Product[]> => {
      try {
        // Wait for any content to load
        await page.waitForSelector('article', { timeout: 15000 });

        // Extract product data
        const products = await page.evaluate(() => {
          const items = document.querySelectorAll('article');
          return Array.from(items).map((item) => {
            const titleElement = item.querySelector('h4, h3, .b-list-advert__item-title');
            const priceElement = item.querySelector('[data-price], .b-list-advert__item-price');
            const imageElement = item.querySelector('img');
            const linkElement = item.querySelector('a');

            const title = titleElement?.textContent?.trim() || '';
            const priceText = priceElement?.textContent?.trim() || '';
            const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
            const imageUrl = imageElement?.getAttribute('src') || '';
            const productUrl = linkElement?.getAttribute('href') || '';

            return {
              title,
              price,
              currency: 'GHS',
              imageUrl,
              productUrl: productUrl.startsWith('http') ? productUrl : `https://jiji.com.gh${productUrl}`,
              store: 'Jiji Ghana',
              availability: true,
              id: `jiji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              rating: null,
              reviews: null
            };
          });
        });

        return products.filter((product: Product) => product.title && product.price > 0);
      } catch (error) {
        console.error('Error extracting Jiji data:', error);
        return [];
      }
    },
    searchUrl: (query) => `https://jiji.com.gh/search?query=${encodeURIComponent(query)}`,
  }
};

export const scrapeWithRehydration = async (url: string): Promise<Product[]> => {
  let browser: puppeteer.Browser | undefined;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const page = await browser.newPage();
    
    // Set a more realistic user agent and viewport
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1920, height: 1080 });

    // Set request interception to block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      // Only allow necessary resources
      if (['document', 'xhr', 'fetch', 'script'].includes(resourceType)) {
        request.continue();
      } else {
        request.abort();
      }
    });

    // Navigate directly to the URL
    console.log('Navigating to:', url);
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for the content to load
    await page.waitForSelector('.qa-advert-list-item, .b-list-advert__gallery__item', {
      timeout: 15000
    });

    // Extract product data
    const products = await page.evaluate(() => {
      const results: any[] = [];
      
      // Find all product items
      const items = document.querySelectorAll('.qa-advert-list-item, .b-list-advert__gallery__item');
      
      items.forEach((item) => {
        try {
          // Find title
          const titleElement = item.querySelector('.qa-advert-title, .b-advert-title-inner, .b-list-advert-base__item-title');
          if (!titleElement) return;
          
          const title = titleElement.textContent?.trim();
          if (!title) return;

          // Find price
          const priceElement = item.querySelector('.qa-advert-price, .b-list-advert__price-base');
          if (!priceElement) return;
          
          const priceText = priceElement.textContent?.trim() || '';
          const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
          if (!price) return;

          // Find image
          const imageElement = item.querySelector('img');
          const imageUrl = imageElement?.getAttribute('src') || '';

          // Find link
          const linkElement = item.querySelector('a') || titleElement.closest('a');
          const productUrl = linkElement?.getAttribute('href') || '';

          // Find location
          const locationElement = item.querySelector('.b-list-advert__region__text');
          const location = locationElement?.textContent?.trim() || '';

          results.push({
            title,
            price,
            currency: 'GHS',
            imageUrl,
            productUrl: productUrl.startsWith('http') ? productUrl : `https://jiji.com.gh${productUrl}`,
            store: 'Jiji Ghana',
            availability: true,
            id: `jiji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            rating: null,
            reviews: null,
            metadata: { location }
          });
        } catch (err) {
          console.error('Error parsing item:', err);
        }
      });

      return results;
    });

    console.log(`Found ${products.length} products`);
    return products;

  } catch (error) {
    console.error('Error scraping Jiji:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

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
