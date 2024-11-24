import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/utils/scrapers';

// Currency conversion rates (to be updated with real exchange rates)
const exchangeRates = {
  USD: 1,
  GHS: 12.5,
  NGN: 1200,
  EUR: 0.92,
  GBP: 0.79
};

// Store information
const storeInfo = {
  'Amazon': {
    name: 'Amazon',
    rating: 4.8,
    reviews: 2500000,
    shippingDays: '7-14',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png'
  },
  'Jumia': {
    name: 'Jumia Ghana',
    rating: 4.5,
    reviews: 150000,
    shippingDays: '2-5',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Jumia_Group_Logo_2019.png/1200px-Jumia_Group_Logo_2019.png'
  },
  'Jiji': {
    name: 'Jiji Ghana',
    rating: 4.3,
    reviews: 75000,
    shippingDays: '1-3',
    image: 'https://play-lh.googleusercontent.com/0WzLuS8DGG7CGvCxYyuGtxg1WkZHiFSVwUzwXXhYE6e7P-Qdp2l_g6RqQKevn_g_Xg'
  },
  'eBay': {
    name: 'eBay',
    rating: 4.6,
    reviews: 1800000,
    shippingDays: '10-21',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/EBay_logo.svg/2560px-EBay_logo.svg.png'
  }
};

export async function POST(request: Request) {
  try {
    const { query, currency = 'USD' } = await request.json();
    
    if (!query) {
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }

    // Scrape products from all sources
    const scrapedProducts = await scrapeAllSources(query);
    
    // Transform scraped data into the expected format
    const formattedProducts: { [key: string]: any } = {};
    
    // Process Amazon products
    scrapedProducts.amazon.forEach((product, index) => {
      const convertedPrice = product.price * (exchangeRates[currency] || 1);
      formattedProducts[`Amazon ${index + 1}`] = {
        title: product.title,
        price: convertedPrice,
        image: product.image,
        link: product.link,
        rating: product.rating,
        reviews: product.reviews,
        storeLogo: storeInfo.Amazon.image,
        shippingDays: storeInfo.Amazon.shippingDays
      };
    });

    // Process Jumia products
    scrapedProducts.jumia.forEach((product, index) => {
      const convertedPrice = (product.price / exchangeRates.GHS) * (exchangeRates[currency] || 1);
      formattedProducts[`Jumia ${index + 1}`] = {
        title: product.title,
        price: convertedPrice,
        image: product.image,
        link: product.link,
        rating: product.rating,
        reviews: product.reviews,
        storeLogo: storeInfo.Jumia.image,
        shippingDays: storeInfo.Jumia.shippingDays
      };
    });

    // Process Jiji products
    scrapedProducts.jiji.forEach((product, index) => {
      const convertedPrice = (product.price / exchangeRates.GHS) * (exchangeRates[currency] || 1);
      formattedProducts[`Jiji ${index + 1}`] = {
        title: product.title,
        price: convertedPrice,
        image: product.image,
        link: product.link,
        rating: storeInfo.Jiji.rating,
        reviews: storeInfo.Jiji.reviews,
        storeLogo: storeInfo.Jiji.image,
        shippingDays: storeInfo.Jiji.shippingDays
      };
    });

    // Process eBay products
    scrapedProducts.ebay.forEach((product, index) => {
      const convertedPrice = product.price * (exchangeRates[currency] || 1);
      formattedProducts[`eBay ${index + 1}`] = {
        title: product.title,
        price: convertedPrice,
        image: product.image,
        link: product.link,
        rating: storeInfo.eBay.rating,
        reviews: storeInfo.eBay.reviews,
        storeLogo: storeInfo.eBay.image,
        shippingDays: storeInfo.eBay.shippingDays
      };
    });

    if (Object.keys(formattedProducts).length === 0) {
      return NextResponse.json({
        error: 'No products found',
        message: 'Try a different search term or check back later.'
      }, { status: 404 });
    }

    return NextResponse.json({
      products: formattedProducts,
      metadata: {
        query,
        timestamp: new Date().toISOString(),
        currency,
        disclaimer: 'Prices are scraped in real-time and may vary. Shipping costs not included.'
      }
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch prices',
        message: error?.message || 'An error occurred while fetching prices. Please try again.'
      },
      { status: 500 }
    );
  }
}
