import { JijiScraper } from '../lib/scrapers/jiji';
import { JumiaScraper } from '../lib/scrapers/jumia';
import { CompuGhanaScraper } from '../lib/scrapers/compughana';
import { TelefonikaScraper } from '../lib/scrapers/telefonika';
import type { Product, Scraper } from '../lib/scrapers/types';

async function testScraper(scraper: Scraper) {
  console.log(`\n🚀 Testing ${scraper.store} scraper with budget range...`);
  
  try {
    const result = await scraper.scrape({ 
      query: 'iphone 12',
      minBudget: 3000,
      maxBudget: 9000
    });

    if (!result.success || result.error) {
      console.log(`❌ Error: ${result.error}`);
      return;
    }

    const products = result.products;
    console.log(`\n✅ Found ${products.length} products within budget range`);

    // Validate price range
    const outOfRangeProducts = products.filter(
      p => p.price < 3000 || p.price > 9000
    );

    if (outOfRangeProducts.length > 0) {
      console.log('\n⚠️  WARNING: Found products outside budget range:');
      outOfRangeProducts.forEach(p => {
        console.log(`- ${p.title}: ${p.currency} ${p.price}`);
      });
    }

    // Print first 5 products
    console.log('\nFirst 5 products:');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Price: ${product.currency} ${product.price}`);
      console.log(`   URL: ${product.productUrl}`);
      if (product.metadata?.relevancyScore) {
        console.log(`   Relevancy: ${(product.metadata.relevancyScore * 100).toFixed(1)}%`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function runTests() {
  const scrapers = [
    new CompuGhanaScraper(),
    new JumiaScraper(),
    new JijiScraper(),
    new TelefonikaScraper()
  ];

  console.log('🔍 Testing all scrapers with:');
  console.log('Query: "iphone 12"');
  console.log('Price Range: GHS 3,000 - GHS 9,000\n');

  for (const scraper of scrapers) {
    await testScraper(scraper);
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests().catch(console.error);
