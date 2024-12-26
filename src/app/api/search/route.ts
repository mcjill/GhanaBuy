import { NextRequest, NextResponse } from 'next/server';
import { compuGhanaScraper } from '@/lib/scrapers/compughana';
import { jumiaScraper } from '@/lib/scrapers/jumia';
import { jijiScraper } from '@/lib/scrapers/jiji';
import { telefonikaScraper } from '@/lib/scrapers/telefonika';
import { frankoScraper } from '@/lib/scrapers/franko';
import { Product, ScrapingResult } from '@/lib/scrapers/types';

const MIN_RELEVANCY_SCORE = 0.2; // Lowered from 0.3 to allow more products
const HIGH_RELEVANCY_THRESHOLD = 0.6; // Lowered from 0.7 to allow more products in high relevancy

interface SanitizedProduct extends Product {
  sanitizedTitle: string;
  sanitizedBrand: string | null;
  sanitizedModel: string | null;
  isExactMatch: boolean;
  matchedTerms: string[];
  termMatchCount: number;
}

// Common brands by category
const PRODUCT_BRANDS = {
  phones: ['iphone', 'samsung', 'huawei', 'xiaomi', 'tecno', 'infinix', 'oppo', 'vivo', 'realme'],
  laptops: ['hp', 'dell', 'lenovo', 'acer', 'asus', 'apple', 'macbook', 'toshiba', 'msi'],
  appliances: ['lg', 'samsung', 'whirlpool', 'panasonic', 'philips', 'binatone', 'bruhm', 'nasco', 'zara'],
  electronics: ['sony', 'lg', 'samsung', 'panasonic', 'philips', 'tcl', 'hisense', 'toshiba'],
  kitchen: ['binatone', 'philips', 'zara', 'nasco', 'bruhm', 'kenwood', 'geepas', 'raf']
};

// Noise words by category
const NOISE_WORDS = {
  phones: ['case', 'cover', 'protector', 'charger', 'cable', 'adapter', 'holder', 'stand'],
  laptops: ['bag', 'sleeve', 'charger', 'adapter', 'stand', 'cooling pad', 'skin'],
  appliances: ['cover', 'manual', 'accessory', 'spare', 'part', 'filter'],
  electronics: ['mount', 'stand', 'cable', 'remote', 'bracket', 'holder'],
  kitchen: ['spare', 'part', 'attachment', 'accessory', 'manual']
};

// Store name normalization map
const STORE_MAP = {
  'Jumia': 'Jumia',
  'Jiji': 'Jiji',
  'CompuGhana': 'CompuGhana',
  'Compughana': 'CompuGhana',
  'Telefonika': 'Telefonika'
};

function sanitizeProduct(product: Product, query: string): SanitizedProduct {
  const title = product.title.toLowerCase();
  const searchTerms = query.toLowerCase().split(' ');
  
  // Find matching brand across all categories
  let brand = null;
  for (const category of Object.values(PRODUCT_BRANDS)) {
    const matchedBrand = category.find(b => title.includes(b));
    if (matchedBrand) {
      brand = matchedBrand;
      break;
    }
  }
  
  // Extract model number patterns
  const modelPatterns = [
    /\b\d+(\s?pro)?(\s?max)?(\s?plus)?(\s?ultra)?/i,  // e.g., "13 pro max"
    /\b[a-z]\d+[a-z]?\b/i,  // e.g., "m31s", "a52"
    /\b[a-z]{1,3}[-]?\d{2,4}[a-z]?\b/i  // e.g., "gx-200", "hp-2000"
  ];
  
  let model = null;
  for (const pattern of modelPatterns) {
    const match = title.match(pattern);
    if (match) {
      model = match[0].trim();
      break;
    }
  }

  // Clean the title by removing noise words from all categories
  let sanitizedTitle = title;
  Object.values(NOISE_WORDS).flat().forEach(word => {
    sanitizedTitle = sanitizedTitle.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  sanitizedTitle = sanitizedTitle.replace(/\s+/g, ' ').trim();

  // Track matched terms
  const matchedTerms = searchTerms.filter(term => sanitizedTitle.includes(term));
  const termMatchCount = matchedTerms.length;
  const isExactMatch = termMatchCount === searchTerms.length;

  return {
    ...product,
    sanitizedTitle,
    sanitizedBrand: brand,
    sanitizedModel: model,
    isExactMatch,
    matchedTerms,
    termMatchCount
  };
}

function calculateEnhancedRelevancyScore(product: SanitizedProduct, query: string): number {
  let score = 0;
  const searchTerms = query.toLowerCase().split(' ');

  // Base score from term matches (0-5)
  score += (product.termMatchCount / searchTerms.length) * 5;

  // Exact match bonus
  if (product.isExactMatch) {
    score += 3;
  }

  // Brand match bonus
  if (product.sanitizedBrand && searchTerms.includes(product.sanitizedBrand)) {
    score += 2;
  }

  // Model match bonus
  if (product.sanitizedModel && searchTerms.some(term => product.sanitizedModel?.includes(term))) {
    score += 2;
  }

  // Title length relevancy (prefer shorter, more specific titles)
  const titleWords = product.sanitizedTitle.split(' ').length;
  const lengthScore = Math.max(0, 1 - (titleWords - searchTerms.length) / 10);
  score += lengthScore;

  // Word order bonus (terms appearing in the same order as search)
  const titleLower = product.sanitizedTitle;
  const queryLower = query.toLowerCase();
  if (titleLower.includes(queryLower)) {
    score += 2;
  }

  // Check if it's an accessory or secondary product
  let isAccessory = false;
  for (const noiseWords of Object.values(NOISE_WORDS)) {
    if (noiseWords.some(word => product.title.toLowerCase().includes(word))) {
      isAccessory = true;
      break;
    }
  }

  // Penalize accessories
  if (isAccessory) {
    score *= 0.3;
  }

  // Normalize final score (0 to 1)
  const normalizedScore = Math.min(1, score / 13);
  
  // Return 0 if below minimum threshold
  return normalizedScore >= MIN_RELEVANCY_SCORE ? normalizedScore : 0;
}

function filterByBudget(products: Product[], minBudget?: number, maxBudget?: number): Product[] {
  return products.filter(product => {
    const price = product.price;
    if (!price) return false;
    
    if (minBudget !== undefined && price < minBudget) {
      return false;
    }
    
    if (maxBudget !== undefined && price > maxBudget) {
      return false;
    }
    
    return true;
  });
}

function filterAndSortProducts(products: Product[], query: string, minBudget?: number, maxBudget?: number): Product[] {
  console.log('[Search API] Starting filterAndSortProducts:', {
    totalProducts: products.length,
    query,
    minBudget,
    maxBudget
  });

  // First sanitize all products
  const sanitizedProducts = products.map(p => sanitizeProduct(p, query));
  
  // Calculate relevancy scores
  const scoredProducts = sanitizedProducts.map(product => {
    const score = calculateEnhancedRelevancyScore(product, query);
    console.log('[Search API] Product score:', {
      title: product.title,
      store: product.store,
      score,
      isExactMatch: product.isExactMatch,
      matchedTerms: product.matchedTerms,
      termMatchCount: product.termMatchCount
    });
    return {
      ...product,
      metadata: {
        ...product.metadata,
        relevancyScore: score
      }
    };
  });

  // Filter by budget and minimum relevancy
  const filteredProducts = scoredProducts
    .filter(product => {
      // Must have non-zero relevancy score
      const hasRelevancy = product.metadata.relevancyScore > 0;
      if (!hasRelevancy) {
        console.log('[Search API] Product filtered out due to zero relevancy:', {
          title: product.title,
          store: product.store,
          score: product.metadata.relevancyScore
        });
        return false;
      }
      
      // Apply budget filter
      const withinBudget = filterByBudget([product], minBudget, maxBudget).length > 0;
      if (!withinBudget) {
        console.log('[Search API] Product filtered out due to budget:', {
          title: product.title,
          store: product.store,
          price: product.price,
          minBudget,
          maxBudget
        });
        return false;
      }
      
      return true;
    });

  console.log('[Search API] After filtering:', {
    initial: products.length,
    afterScoring: scoredProducts.length,
    afterFiltering: filteredProducts.length
  });

  // Sort by relevancy score
  return filteredProducts.sort((a, b) => {
    const scoreA = a.metadata.relevancyScore || 0;
    const scoreB = b.metadata.relevancyScore || 0;
    return scoreB - scoreA;
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { query, minBudget, maxBudget, stores = ['Jumia', 'Jiji', 'CompuGhana'] } = data;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Normalize store names
    const normalizedStores = stores.map(store => STORE_MAP[store] || store);
    console.log(`[Search API] Normalized stores:`, normalizedStores);

    // Map store names to scrapers
    const scraperMap = {
      'Jumia': jumiaScraper,
      'Jiji': jijiScraper,
      'CompuGhana': compuGhanaScraper,
      'Telefonika': telefonikaScraper
    };

    // Run selected scrapers in parallel
    const selectedScrapers = normalizedStores
      .filter(store => {
        const hasStore = !!scraperMap[store];
        if (!hasStore) {
          console.warn(`[Search API] No scraper found for store: ${store}`);
        }
        return hasStore;
      })
      .map(store => ({
        name: store,
        scraper: scraperMap[store]
      }));

    console.log(`[Search API] Running scrapers for stores:`, stores);
    console.log(`[Search API] Selected scrapers:`, selectedScrapers.map(s => s.name));
    
    const scraperPromises = selectedScrapers.map(({ name, scraper }) => {
      console.log(`[Search API] Starting ${name} scraper...`);
      return scraper.scrape({ query, minBudget, maxBudget })
        .then(result => {
          if (result.success) {
            console.log(`[Search API] ${name} found ${result.products.length} products`);
            console.log(`[Search API] Sample products from ${name}:`, result.products.slice(0, 3).map(p => ({
              title: p.title,
              price: p.price,
              relevancyScore: p.metadata?.relevancyScore
            })));
          } else {
            console.error(`[Search API] ${name} scraper failed:`, result.error);
          }
          return { name, result };
        })
        .catch(error => {
          console.error(`[Search API] ${name} scraper threw error:`, error);
          return { name, result: { success: false, error: error.message, products: [] } };
        });
    });

    const results = await Promise.allSettled(scraperPromises);

    // Collect all successful results
    let allProducts: Product[] = [];
    results.forEach((result, index) => {
      const source = selectedScrapers[index].name;
      if (result.status === 'fulfilled') {
        const { name, result: scrapeResult } = result.value;
        if (scrapeResult.success) {
          console.log(`[Search API] Processing ${scrapeResult.products.length} products from ${name}`);
          allProducts = [...allProducts, ...scrapeResult.products];
        }
      } else {
        console.error(`[Search API] ${source} scraper promise rejected:`, result.reason);
      }
    });

    // Filter and sort products
    const filteredAndSortedProducts = filterAndSortProducts(allProducts, query, minBudget, maxBudget);
    console.log('[Search API] After filtering and sorting:', {
      initial: allProducts.length,
      filtered: filteredAndSortedProducts.length,
      byStore: filteredAndSortedProducts.reduce((acc, p) => {
        acc[p.store] = (acc[p.store] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // Group products by relevancy
    const highRelevancyProducts = filteredAndSortedProducts.filter(p => {
      const score = p.metadata?.relevancyScore || 0;
      const isHigh = score >= HIGH_RELEVANCY_THRESHOLD;
      if (!isHigh) {
        console.log('[Search API] Product moved to other due to low relevancy:', {
          title: p.title,
          store: p.store,
          score
        });
      }
      return isHigh;
    });
    
    const otherProducts = filteredAndSortedProducts.filter(
      p => (p.metadata?.relevancyScore || 0) < HIGH_RELEVANCY_THRESHOLD
    );

    console.log('[Search API] Final product counts:', {
      total: filteredAndSortedProducts.length,
      highRelevancy: highRelevancyProducts.length,
      other: otherProducts.length
    });

    return NextResponse.json({
      success: true,
      products: {
        highRelevancy: highRelevancyProducts,
        other: otherProducts
      }
    });

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
