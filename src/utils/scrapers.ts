import * as cheerio from 'cheerio';
import { Product, ScrapingResult } from '@/lib/scrapers/types';
import { retry } from '@/lib/utils/retry';

const STORE_NAMES = {
  0: 'Jiji Ghana',
  1: 'Jumia',
  2: 'CompuGhana',
  3: 'Telefonika',
  4: 'Amazon'
};

export async function scrapeAllSources(query: string): Promise<ScrapingResult> {
  try {
    console.log('Starting to scrape all sources for query:', query);
    
    const results = await Promise.allSettled([
      scrapeJiji(query),      // Add Jiji first as it's prioritized
      scrapeJumia(query),
      scrapeCompuGhana(query),
      scrapeTelefonika(query),
      scrapeAmazon(query),
    ]);

    const products: Product[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const source = result.value;
        if (source.products && source.products.length > 0) {
          console.log(`Successfully scraped ${source.products.length} products from ${STORE_NAMES[index]}`);
          products.push(...source.products);
        } else {
          console.log(`No products found from ${STORE_NAMES[index]}`);
        }
        if (source.error) {
          errors.push(`${STORE_NAMES[index]}: ${source.error}`);
        }
      } else {
        console.error(`Failed to scrape ${STORE_NAMES[index]}:`, result.reason);
        errors.push(`${STORE_NAMES[index]}: ${result.reason.toString()}`);
      }
    });

    // Sort products by price
    products.sort((a, b) => a.price - b.price);

    console.log(`Total products found across all sources: ${products.length}`);
    
    return {
      success: products.length > 0,
      products,
      error: errors.length > 0 ? errors.join('; ') : null
    };
  } catch (error) {
    console.error('Error in scrapeAllSources:', error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function scrapeJumia(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://www.jumia.com.gh/catalog/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.prd').each((_, element) => {
      const title = $(element).find('.name').text().trim();
      const priceText = $(element).find('.prc').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const productUrl = 'https://www.jumia.com.gh' + $(element).find('a').attr('href');
      const imageUrl = $(element).find('img').attr('data-src');
      const rating = parseFloat($(element).find('.stars').attr('data-rate') || '0');
      const reviews = parseInt($(element).find('.rev').text().replace(/[^0-9]/g, '') || '0');

      if (title && price && productUrl && imageUrl) {
        products.push({
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'Jumia',
          rating,
          reviews,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Jumia'
    };
  }
}

async function scrapeCompuGhana(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://compughana.com/catalogsearch/result/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.product-item-info').each((_, element) => {
      const title = $(element).find('.product-item-link').text().trim();
      const priceText = $(element).find('.price').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const productUrl = $(element).find('.product-item-link').attr('href') || '';
      let imageUrl = '';
      const imgElement = $(element).find('img.product-image-photo');
      imageUrl = imgElement.attr('src') || 
                imgElement.attr('data-src') || 
                imgElement.attr('data-original') || 
                imgElement.attr('data-lazy') || 
                '';

      if (title && price && productUrl && imageUrl) {
        products.push({
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'CompuGhana',
          rating: 0,
          reviews: 0,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape CompuGhana'
    };
  }
}

async function scrapeTelefonika(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://telefonika.com.gh/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.product-item').each((_, element) => {
      const title = $(element).find('.product-title').text().trim();
      const priceText = $(element).find('.price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const productUrl = $(element).find('a').attr('href') || '';
      const imageUrl = $(element).find('img').attr('src') || '';

      if (title && price && productUrl && imageUrl) {
        products.push({
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'Telefonika',
          rating: 0,
          reviews: 0,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Telefonika'
    };
  }
}

async function scrapeJiji(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://jiji.com.gh/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.qa-advert-list-item').each((_, element) => {
      const title = $(element).find('.qa-advert-title').text().trim();
      const priceText = $(element).find('.qa-advert-price').text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      const productUrl = 'https://jiji.com.gh' + ($(element).find('a').attr('href') || '');
      const imageUrl = $(element).find('img').attr('src') || '';

      if (title && price && productUrl && imageUrl) {
        products.push({
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'Jiji Ghana',
          rating: 0,
          reviews: 0,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Jiji'
    };
  }
}

async function scrapeAmazon(query: string): Promise<ScrapingResult> {
  try {
    const response = await retry(() => 
      fetch(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const products: Product[] = [];

    $('.s-result-item').each((_, element) => {
      const title = $(element).find('h2 span').text().trim();
      const priceText = $(element).find('.a-price-whole').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) * 12.5; // Convert USD to GHS (approximate)
      const productUrl = 'https://www.amazon.com' + ($(element).find('a.a-link-normal').attr('href') || '');
      const imageUrl = $(element).find('img.s-image').attr('src') || '';
      const ratingText = $(element).find('.a-icon-star-small .a-icon-alt').text();
      const rating = parseFloat(ratingText.split(' ')[0]) || 0;
      const reviewsText = $(element).find('span.a-size-base.s-underline-text').text();
      const reviews = parseInt(reviewsText.replace(/[^0-9]/g, '')) || 0;

      if (title && price && productUrl && imageUrl) {
        products.push({
          title,
          price,
          currency: 'GHS',
          productUrl,
          imageUrl,
          store: 'Amazon',
          rating,
          reviews,
          availability: true
        });
      }
    });

    return {
      success: products.length > 0,
      products,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Failed to scrape Amazon'
    };
  }
}
