import { NextRequest, NextResponse } from 'next/server';
import { compuGhanaScraper } from '@/lib/scrapers/compughana';
import { jumiaScraper } from '@/lib/scrapers/jumia';
import { jijiScraper } from '@/lib/scrapers/jiji';
import { telefonikaScraper } from '@/lib/scrapers/telefonika';
import { Product, ScrapingResult } from '@/lib/scrapers/types';

const MIN_RELEVANCY_SCORE = 0.3;
const HIGH_RELEVANCY_THRESHOLD = 0.7;

interface SanitizedProduct extends Product {
  sanitizedTitle: string;
  sanitizedBrand: string | null;
  sanitizedModel: string | null;
  isExactMatch: boolean;
}

function sanitizeProduct(product: Product, query: string): SanitizedProduct {
  const title = product.title.toLowerCase();
  const searchTerms = query.toLowerCase().split(' ');
  
  // Extract brand and model information
  const commonBrands = ['iphone', 'samsung', 'huawei', 'xiaomi', 'tecno', 'infinix', 'oppo', 'vivo', 'realme'];
  const brand = commonBrands.find(b => title.includes(b)) || null;
  
  // Extract model number (e.g., "13" from "iPhone 13")
  const modelMatch = title.match(/\d+(\s?pro)?(\s?max)?(\s?plus)?/i);
  const model = modelMatch ? modelMatch[0].trim() : null;

  // Clean the title by removing common noise words
  const noiseWords = ['case', 'cover', 'protector', 'charger', 'cable', 'adapter', 'holder'];
  let sanitizedTitle = title;
  noiseWords.forEach(word => {
    sanitizedTitle = sanitizedTitle.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  });
  sanitizedTitle = sanitizedTitle.replace(/\s+/g, ' ').trim();

  // Check if it's an exact match
  const isExactMatch = searchTerms.every(term => sanitizedTitle.includes(term));

  return {
    ...product,
    sanitizedTitle,
    sanitizedBrand: brand,
    sanitizedModel: model,
    isExactMatch
  };
}

function calculateEnhancedRelevancyScore(product: SanitizedProduct, query: string): number {
  const searchTerms = query.toLowerCase().split(' ');
  let score = 0;

  // Exact match bonus
  if (product.isExactMatch) {
    score += 5;
  }

  // Brand match bonus
  if (product.sanitizedBrand && searchTerms.includes(product.sanitizedBrand)) {
    score += 3;
  }

  // Model match bonus
  if (product.sanitizedModel && searchTerms.some(term => product.sanitizedModel?.includes(term))) {
    score += 2;
  }

  // Title relevancy
  const termMatches = searchTerms.filter(term => 
    product.sanitizedTitle.includes(term)
  ).length;
  score += (termMatches / searchTerms.length) * 2;

  // Penalize accessories and non-primary products
  const accessoryIndicators = ['case', 'cover', 'protector', 'charger', 'cable'];
  if (accessoryIndicators.some(word => product.title.toLowerCase().includes(word))) {
    score *= 0.3;
  }

  // Normalize score (0 to 1)
  const normalizedScore = score / 10;
  
  // Return 0 if below minimum threshold
  return normalizedScore >= MIN_RELEVANCY_SCORE ? normalizedScore : 0;
}

function filterAndSortProducts(products: Product[], query: string): Product[] {
  // Step 1: Sanitize all products
  const sanitizedProducts = products.map(p => sanitizeProduct(p, query));

  // Step 2: Calculate enhanced relevancy scores
  const scoredProducts = sanitizedProducts.map(p => ({
    ...p,
    metadata: {
      ...p.metadata,
      relevancyScore: calculateEnhancedRelevancyScore(p, query)
    }
  }));

  // Step 3: Filter out products with zero relevancy
  const relevantProducts = scoredProducts.filter(p => 
    (p.metadata?.relevancyScore || 0) > MIN_RELEVANCY_SCORE
  );

  // Step 4: Sort products by relevancy score
  const sortedProducts = relevantProducts.sort((a, b) => {
    const scoreA = a.metadata?.relevancyScore || 0;
    const scoreB = b.metadata?.relevancyScore || 0;
    
    // Prioritize high relevancy products
    if (scoreB >= HIGH_RELEVANCY_THRESHOLD && scoreA < HIGH_RELEVANCY_THRESHOLD) {
      return 1;
    }
    if (scoreA >= HIGH_RELEVANCY_THRESHOLD && scoreB < HIGH_RELEVANCY_THRESHOLD) {
      return -1;
    }
    
    return scoreB - scoreA;
  });

  return sortedProducts;
}

export async function POST(request: NextRequest) {
  try {
    const { query, budget } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[Search API] Starting search for query: "${query}"`);

    // Run all scrapers in parallel with timeouts
    const [compuGhanaResults, jumiaResults, jijiResults, telefonikaResults] = await Promise.all([
      compuGhanaScraper.scrape({ query }).catch(error => {
        console.error('[Search API] CompuGhana scraper error:', error);
        return { success: false, products: [], error: error.message };
      }),
      jumiaScraper.scrape({ query }).catch(error => {
        console.error('[Search API] Jumia scraper error:', error);
        return { success: false, products: [], error: error.message };
      }),
      jijiScraper.scrape({ query }).catch(error => {
        console.error('[Search API] Jiji scraper error:', error);
        return { success: false, products: [], error: error.message };
      }),
      telefonikaScraper.scrape({ query }).catch(error => {
        console.error('[Search API] Telefonika scraper error:', error);
        return { success: false, products: [], error: error.message };
      })
    ]);

    // Combine all products
    const allProducts = [
      ...compuGhanaResults.products,
      ...jumiaResults.products,
      ...jijiResults.products,
      ...telefonikaResults.products
    ];

    // Log results
    console.log('[Search API] Search Results:', {
      totalProducts: allProducts.length,
      compuGhanaCount: compuGhanaResults.success ? compuGhanaResults.products.length : 0,
      jumiaCount: jumiaResults.success ? jumiaResults.products.length : 0,
      jijiCount: jijiResults.success ? jijiResults.products.length : 0,
      telefonikaCount: telefonikaResults.success ? telefonikaResults.products.length : 0
    });

    // Process and sort products by relevance
    const filteredProducts = filterAndSortProducts(allProducts, query);

    // Log relevance scores for debugging
    console.log('[Search API] Top 3 products by relevance:', 
      filteredProducts.slice(0, 3).map(p => ({
        title: p.title,
        store: p.store,
        score: p.metadata?.relevancyScore
      }))
    );

    return NextResponse.json({
      success: true,
      products: filteredProducts,
      stats: {
        total: filteredProducts.length,
        byStore: {
          compughana: filteredProducts.filter(p => p.store === 'CompuGhana').length,
          jumia: filteredProducts.filter(p => p.store === 'Jumia').length,
          jiji: filteredProducts.filter(p => p.store === 'Jiji Ghana').length,
          telefonika: filteredProducts.filter(p => p.store === 'Telefonika').length
        }
      }
    });
  } catch (error) {
    console.error('[Search API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        products: []
      },
      { status: 500 }
    );
  }
}
