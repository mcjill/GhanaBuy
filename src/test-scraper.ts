const { frankoScraper } = require('./lib/scrapers/franko');

async function testScraper() {
  console.log('Starting Franko Trading scraper test...\n');
  
  try {
    const query = 'tecno';
    console.log(`Searching for: "${query}"\n`);

    const results = await frankoScraper.scrape({ query });

    if (results.success) {
      console.log(`Found ${results.products.length} products:\n`);
      
      // Sort by relevancy score
      const sortedProducts = results.products.sort((a, b) => 
        (b.metadata?.relevancyScore || 0) - (a.metadata?.relevancyScore || 0)
      );

      // Display top 10 results
      sortedProducts.slice(0, 10).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Price: GHS ${product.price}`);
        console.log(`   Score: ${product.metadata?.relevancyScore}`);
        console.log(`   URL: ${product.productUrl}\n`);
      });
    } else {
      console.error('Scraping failed:', results.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testScraper();
