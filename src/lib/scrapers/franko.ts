import { Product, Scraper, SearchRequest, ScrapingResult } from './types';
import axios from 'axios';

class FrankoScraper implements Scraper {
  readonly name = 'Franko Trading';
  readonly baseUrl = 'https://frankotrading.com';
  
  cleanPrice(price: string | number): number {
    if (typeof price === 'number') return price;
    return parseFloat(price) || 0;
  }

  async scrape(request: SearchRequest): Promise<ScrapingResult> {
    try {
      // First get all products from showrooms
      const showrooms = [
        'fca9d386-2904-4e13-a0cb-4f183aa274af',
        '3485ae7d-a961-4d58-b83e-aa15ee968825',
        '1e93aeb7-bba7-4bd4-b017-ea3267047d46',
        '3707001c-1cd2-48cb-b205-e7fa27b61aed',
        '67f53c84-0257-4719-a170-ff62e3d707f1',
        '84b6b4e2-4fa4-4f3e-b89c-900812d95815',
        '910812e9-cd1e-449a-a5bb-b74b29836569'
      ];

      const products: Product[] = [];
      
      for (const showroomId of showrooms) {
        try {
          if (process.env.DEBUG) {
            console.log(`\nFetching showroom: ${showroomId}`);
          }

          const response = await axios.get(
            `https://smfteapi.salesmate.app/Product/Product-Get-by-ShowRoom/${showroomId}`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            }
          );

          if (process.env.DEBUG) {
            console.log(`Got ${response.data?.length || 0} products from showroom`);
          }

          if (response.data && Array.isArray(response.data)) {
            const items = response.data
              .filter((item: any) => {
                if (!item || typeof item.productName !== 'string') {
                  if (process.env.DEBUG) {
                    console.log('Skipping invalid item:', item);
                  }
                  return false;
                }
                const searchStr = `${item.productName} ${item.description || ''}`.toLowerCase();
                const matches = searchStr.includes(request.query.toLowerCase());
                if (process.env.DEBUG && matches) {
                  console.log('Found matching item:', item.productName);
                }
                return matches;
              })
              .map((item: any) => {
                let imageUrl = '';
                if (item.productImage) {
                  // Clean up the image path and ensure forward slashes
                  const imagePath = item.productImage
                    .split(/[\\\/]/)  // Split on both forward and back slashes
                    .filter(Boolean)   // Remove empty segments
                    .pop();            // Get the filename
                  
                  if (imagePath) {
                    imageUrl = `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath}`;
                  }
                }
                
                if (process.env.DEBUG) {
                  console.log('Processing item:', {
                    name: item.productName,
                    price: item.price,
                    imageUrl
                  });
                }

                return {
                  id: `franko-${item.productID || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: item.productName || 'Unknown Product',
                  price: this.cleanPrice(item.price),
                  currency: 'GHS',
                  productUrl: `${this.baseUrl}/product/${item.productID}`,
                  imageUrl,
                  store: this.name,
                  rating: null,
                  reviews: null,
                  availability: true,
                  metadata: {
                    relevancyScore: this.calculateRelevancyScore(item, request.query),
                    originalData: item
                  }
                } as Product;
              });

            if (process.env.DEBUG) {
              console.log(`Found ${items.length} matching items in showroom`);
            }

            products.push(...items);
          }
        } catch (error) {
          console.error(`Error fetching showroom ${showroomId}:`, error);
        }
      }

      if (process.env.DEBUG) {
        console.log(`\nTotal products found: ${products.length}`);
      }

      return {
        success: true,
        products,
        error: null
      };

    } catch (error) {
      console.error('Franko Trading scraper error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private calculateRelevancyScore(item: any, query: string): number {
    if (!item || typeof item.productName !== 'string') return 0;
    
    const searchTerms = query.toLowerCase().split(' ');
    const itemText = `${item.productName} ${item.description || ''}`.toLowerCase();
    
    let score = 0;
    
    // Check title matches
    searchTerms.forEach(term => {
      const name = item.productName.toLowerCase();
      if (name.includes(term)) {
        score += 2;
      }
      if (itemText.includes(term)) {
        score += 1;
      }
    });

    // Boost score for exact matches
    if (item.productName.toLowerCase().includes(query.toLowerCase())) {
      score += 3;
    }

    // Normalize score between 0 and 1
    return Math.min(score / (searchTerms.length * 3), 1);
  }
}

export const frankoScraper = new FrankoScraper();
