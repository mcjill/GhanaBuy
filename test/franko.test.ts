import { frankoScraper } from '../src/lib/scrapers/franko';

async function testFrankoScraper() {
  console.log('\nStarting Franko Trading scraper test...\n');
  
  const query = 'tecno';
  console.log(`Searching for: "${query}"\n`);

  try {
    const results = await frankoScraper.scrape({ query });

    if (results.success && results.products.length > 0) {
      console.log(`Found ${results.products.length} products:\n`);
      
      // Sort by relevancy score
      const sortedProducts = results.products.sort((a, b) => 
        (b.metadata?.relevancyScore || 0) - (a.metadata?.relevancyScore || 0)
      );

      // Display top 10 results
      sortedProducts.slice(0, 10).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Price: ${product.currency} ${product.price}`);
        console.log(`   Score: ${product.metadata?.relevancyScore}`);
        console.log(`   URL: ${product.productUrl}`);
        console.log(`   Image: ${product.imageUrl}\n`);
      });
    } else if (results.success && results.products.length === 0) {
      console.log('No products found for this search query.');
    } else {
      console.error('Scraping failed:', results.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Enable debug logging
process.env.DEBUG = 'true';
testFrankoScraper();
