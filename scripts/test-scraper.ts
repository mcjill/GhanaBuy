import { jijiScraper } from '../src/lib/scrapers/jiji';
import { jumiaScraper } from '../src/lib/scrapers/jumia';
import { compuGhanaScraper } from '../src/lib/scrapers/compughana';
import { telefonikaScraper } from '../src/lib/scrapers/telefonika';
import { Product, ScrapingResult } from '../src/lib/scrapers/types';

const SEARCH_QUERY = process.argv[2] || "iphone 13";
console.log(`Testing scrapers with query: "${SEARCH_QUERY}"\n`);
console.log('Starting scraping process...\n');

async function displayResults(results: ScrapingResult, storeName: string) {
  console.log(`\n${storeName} Results:`);
  console.log(`Success: ${results.success}`);
  console.log(`Total products found: ${results.products.length}`);
  
  if (results.products.length > 0) {
    console.log('\nFirst 3 products:\n');
    results.products.slice(0, 3).forEach((product, index) => {
      console.log(`[${storeName} Product ${index + 1}]`);
      printProduct(product);
      console.log();
    });
  }
  
  if (results.error) {
    console.error(`\n${storeName} Error:`, results.error);
  }
}

async function testAllScrapers() {
  const scrapers = {
    'Jiji': jijiScraper,
    'Jumia': jumiaScraper,
    'CompuGhana': compuGhanaScraper,
    'Telefonika': telefonikaScraper
  };

  for (const [storeName, scraper] of Object.entries(scrapers)) {
    console.log(`Testing ${storeName}...`);
    const startTime = Date.now();
    
    try {
      const results = await scraper.scrape({
        query: SEARCH_QUERY,
        minBudget: 0,
        maxBudget: 100000000
      });
      
      await displayResults(results, storeName);
      console.log(`\n${storeName} scraping completed in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error(`Error testing ${storeName}:`, error);
    }
    
    console.log('-'.repeat(50));
  }
}

function printProduct(product: Product) {
  console.log(`Title: ${product.title}`);
  console.log(`Price: ${product.price} ${product.currency}`);
  console.log(`URL: ${product.productUrl}`);
  console.log(`Image: ${product.imageUrl}`);
}

// Run the tests
testAllScrapers().catch(console.error);
