import { jumiaScraper } from '../lib/scrapers/jumia';

async function testJumiaTVScraper() {
  const query = 'Samsung TV';
  const minBudget = 3000;
  const maxBudget = 90000;

  console.log('Starting Jumia TV scraper test...');
  console.log(`Query: "${query}"`);
  console.log(`Price Range: GHS ${minBudget} - GHS ${maxBudget}`);
  console.log('----------------------------------------\n');

  try {
    const startTime = Date.now();
    const result = await jumiaScraper.scrape({ query, minBudget, maxBudget });
    const duration = Date.now() - startTime;

    if (result.success && result.products.length > 0) {
      console.log(`\n✅ Found ${result.products.length} products in ${duration}ms`);
      
      // Display results
      result.products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`Title: ${product.title}`);
        console.log(`Price: ${product.currency} ${product.price}`);
        console.log(`Store: ${product.store}`);
        console.log(`URL: ${product.productUrl}`);
        console.log(`Relevancy Score: ${(product.metadata.relevancyScore * 100).toFixed(1)}%`);
      });

      // Quality metrics
      const averageRelevancy = result.products.reduce((sum, p) => sum + (p.metadata.relevancyScore || 0), 0) / result.products.length;
      const highRelevancy = result.products.filter(p => (p.metadata.relevancyScore || 0) >= 0.8).length;
      
      console.log('\nQuality Metrics:');
      console.log(`Total Products Found: ${result.products.length}`);
      console.log(`Average Relevancy Score: ${(averageRelevancy * 100).toFixed(1)}%`);
      console.log(`High Relevancy Products (≥80%): ${highRelevancy} out of ${result.products.length}`);
      console.log(`Price Range: GHS ${Math.min(...result.products.map(p => p.price))} - GHS ${Math.max(...result.products.map(p => p.price))}`);
      
    } else {
      console.log('\n❌ No products found');
      if (!result.success) {
        console.error('Error:', result.error);
      }
    }
  } catch (error) {
    console.error('\n❌ Scraper failed with error:', error);
  }
}

// Run the test
console.log('Running Jumia TV scraper quality test...\n');
testJumiaTVScraper().catch(console.error);
