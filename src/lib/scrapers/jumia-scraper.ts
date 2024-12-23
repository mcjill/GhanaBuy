import * as puppeteer from 'puppeteer';
import { Product } from './types';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Function to calculate relevancy score between product title and search query
function calculateRelevancyScore(title: string, query: string): number {
  const titleWords = new Set(title.toLowerCase().split(/\s+/));
  const queryWords = new Set(query.toLowerCase().split(/\s+/));
  
  let matchCount = 0;
  queryWords.forEach(word => {
    if (titleWords.has(word)) matchCount++;
  });
  
  return matchCount / queryWords.size; // Score from 0 to 1
}

// Helper function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const scrapeJumia = async (query: string): Promise<Product[]> => {
  let browser: puppeteer.Browser | undefined;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-dev-shm-usage'
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
        if (['document', 'xhr', 'fetch', 'script'].includes(resourceType)) {
          request.continue();
        } else {
          request.abort();
        }
      });

      // Construct search URL
      const searchUrl = `https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`;
      console.log('Navigating to:', searchUrl);
      
      // Try to navigate with increased timeout
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', // Changed from networkidle0 to be less strict
        timeout: 60000 // Increased timeout
      });

      // Wait for initial page load
      await delay(2000);

      // Check if we need to handle any popups or overlays
      try {
        const popupSelector = '[aria-label="newsletter_popup_close-cta"]';
        const popup = await page.$(popupSelector);
        if (popup) {
          await popup.click();
          await delay(500);
        }
      } catch (err) {
        // Ignore popup handling errors
      }

      // Wait for product grid to load with increased timeout
      await page.waitForSelector('article.prd, .-no-results', {
        timeout: 30000
      });

      // Check for no results
      const noResults = await page.$('.-no-results');
      if (noResults) {
        console.log('No results found');
        return [];
      }

      // Extract product data
      const products = await page.evaluate((searchQuery) => {
        const results: any[] = [];
        
        // Find all product items
        const items = document.querySelectorAll('article.prd');
        
        items.forEach((item) => {
          try {
            // Find title
            const titleElement = item.querySelector('.name');
            if (!titleElement) return;
            
            const title = titleElement.textContent?.trim();
            if (!title) return;

            // Find price
            const priceElement = item.querySelector('.prc');
            if (!priceElement) return;
            
            const priceText = priceElement.textContent?.trim() || '';
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            if (!price) return;

            // Find image
            const imageElement = item.querySelector('img');
            const imageUrl = imageElement?.getAttribute('data-src') || imageElement?.getAttribute('src') || '';

            // Find link
            const linkElement = item.querySelector('a');
            const productUrl = linkElement?.getAttribute('href') || '';

            // Find rating if available
            const ratingElement = item.querySelector('.stars._s');
            const rating = ratingElement ? parseFloat(ratingElement.getAttribute('data-rate') || '0') : null;

            // Find review count if available
            const reviewElement = item.querySelector('.rev');
            const reviewText = reviewElement?.textContent?.trim() || '';
            const reviews = reviewText ? parseInt(reviewText.replace(/[^\d]/g, '')) : null;

            results.push({
              title,
              price,
              currency: 'GHS',
              imageUrl,
              productUrl: productUrl.startsWith('http') ? productUrl : `https://www.jumia.com.gh${productUrl}`,
              store: 'Jumia Ghana',
              availability: true,
              id: `jumia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              rating,
              reviews,
              metadata: {
                searchQuery,
                originalTitle: title // Store original title for relevancy calculation
              }
            });
          } catch (err) {
            console.error('Error parsing item:', err);
          }
        });

        return results;
      }, query);

      // Post-process products to add relevancy scores and filter irrelevant results
      const processedProducts = products
        .map(product => {
          const relevancyScore = calculateRelevancyScore(product.metadata.originalTitle, query);
          return {
            ...product,
            metadata: {
              ...product.metadata,
              relevancyScore
            }
          };
        })
        .filter(product => {
          // Only keep products that have at least 50% relevancy score
          return product.metadata.relevancyScore >= 0.5;
        })
        .sort((a, b) => {
          // Sort by relevancy score (highest first)
          return b.metadata.relevancyScore - a.metadata.relevancyScore;
        });

      console.log(`Found ${processedProducts.length} relevant products out of ${products.length} total`);
      return processedProducts;

    } catch (error) {
      console.error(`Error scraping Jumia (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      
      if (browser) {
        await browser.close();
        browser = undefined;
      }
      
      if (retryCount < maxRetries) {
        console.log(`Retrying in 2 seconds...`);
        await delay(2000);
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  return []; // Return empty array if all retries failed
};
