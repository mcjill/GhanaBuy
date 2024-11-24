import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import { getLocationBasedStores, getUserCountry } from './location-based-stores';

export interface ScrapedProduct {
  title: string;
  price: number;
  currency: string;
  image: string;
  link: string;
  rating: number;
  reviews: number;
  storeLogo: string;
  shippingDays: string;
}

export interface ScrapedResults {
  [key: string]: ScrapedProduct;
}

async function scrapeStore(browser: any, store: any, query: string): Promise<ScrapedProduct | null> {
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(`${store.url}/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle0' });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Store-specific selectors
    const selectors = getSelectorsForStore(store.name);
    
    // Get first product
    const firstProduct = $(selectors.productSelector).first();
    if (!firstProduct.length) return null;

    const price = extractPrice(firstProduct.find(selectors.priceSelector).text(), store.currency);
    if (!price) return null;

    return {
      title: firstProduct.find(selectors.titleSelector).text().trim(),
      price,
      currency: store.currency,
      image: firstProduct.find(selectors.imageSelector).attr('src') || '',
      link: store.url + firstProduct.find(selectors.linkSelector).attr('href'),
      rating: parseFloat(firstProduct.find(selectors.ratingSelector).text()) || store.baseRating,
      reviews: parseInt(firstProduct.find(selectors.reviewsSelector).text()) || store.baseReviews,
      storeLogo: store.logo,
      shippingDays: store.shipping
    };
  } catch (error) {
    console.error(`Error scraping ${store.name}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

function getSelectorsForStore(storeName: string) {
  // Store-specific selectors mapping
  const selectorsMap: { [key: string]: any } = {
    'Jumia Ghana': {
      productSelector: 'article.prd',
      titleSelector: '.name',
      priceSelector: '.prc',
      imageSelector: 'img.img',
      linkSelector: 'a.core',
      ratingSelector: '.stars._s',
      reviewsSelector: '.rev'
    },
    'Melcom Ghana': {
      productSelector: '.product-item-info',
      titleSelector: '.product-item-link',
      priceSelector: '.price',
      imageSelector: '.product-image-photo',
      linkSelector: '.product-item-link',
      ratingSelector: '.rating-result',
      reviewsSelector: '.reviews-actions'
    },
    // Add more store-specific selectors here
  };

  // Default selectors for stores without specific mapping
  return selectorsMap[storeName] || {
    productSelector: '.product',
    titleSelector: '.title',
    priceSelector: '.price',
    imageSelector: 'img',
    linkSelector: 'a',
    ratingSelector: '.rating',
    reviewsSelector: '.reviews'
  };
}

function extractPrice(priceString: string, currency: string): number {
  const numericPrice = priceString.replace(/[^0-9.]/g, '');
  return parseFloat(numericPrice) || 0;
}

export async function scrapeProducts(query: string): Promise<ScrapedResults> {
  const browser = await puppeteer.launch({ headless: true });
  const results: ScrapedResults = {};

  try {
    // Get user's country and relevant stores
    const userCountry = await getUserCountry();
    const relevantStores = getLocationBasedStores(userCountry);

    // Scrape from each store in parallel
    const scrapePromises = relevantStores.map(store => 
      scrapeStore(browser, store, query)
        .then(result => {
          if (result) {
            results[store.name] = result;
          }
        })
    );

    await Promise.all(scrapePromises);
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }

  return results;
}
