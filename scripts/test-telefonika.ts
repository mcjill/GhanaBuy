import { TelefonikaScraper } from '../src/lib/scrapers/telefonika.js';

async function testTelefonikaScraper() {
    console.log('Starting Telefonika scraper test...');
    const query = 'samsung';
    console.log(`Testing query: "${query}"`);
    
    try {
        const scraper = new TelefonikaScraper();
        const results = await scraper.scrape({ query });
        
        console.log('\nResults:');
        console.log('------------------------');
        console.log(`Total products found: ${results.products?.length || 0}`);

        if (results.products && results.products.length > 0) {
            console.log('\nFirst 5 products:\n');
            results.products.slice(0, 5).forEach((product, index) => {
                console.log(`Product ${index + 1}:`);
                console.log(`Title: ${product.title}`);
                console.log(`Price: ${product.currency} ${product.price}`);
                console.log(`URL: ${product.productUrl}`);
                console.log(`Image: ${product.imageUrl}`);
                if (product.metadata?.relevancyScore) {
                    console.log(`Relevancy Score: ${product.metadata.relevancyScore}`);
                }
                console.log(`Availability: ${product.availability ? 'In Stock' : 'Out of Stock'}`);
                console.log('');
            });

            if (results.products.length > 5) {
                console.log(`\n... and ${results.products.length - 5} more products`);
            }

            // Show relevancy score statistics if available
            const scores = results.products
                .map(p => p.metadata?.relevancyScore)
                .filter((score): score is number => score !== undefined);

            if (scores.length > 0) {
                const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                const minScore = Math.min(...scores);
                const maxScore = Math.max(...scores);

                console.log('\nRelevancy Score Statistics:');
                console.log(`Average Score: ${avgScore.toFixed(2)}`);
                console.log(`Minimum Score: ${minScore.toFixed(2)}`);
                console.log(`Maximum Score: ${maxScore.toFixed(2)}`);

                // Show product count by relevancy range
                const ranges = {
                    'Very High (0.8-1.0)': scores.filter(s => s >= 0.8).length,
                    'High (0.6-0.8)': scores.filter(s => s >= 0.6 && s < 0.8).length,
                    'Medium (0.4-0.6)': scores.filter(s => s >= 0.4 && s < 0.6).length,
                    'Low (0.3-0.4)': scores.filter(s => s >= 0.3 && s < 0.4).length
                };

                console.log('\nProducts by Relevancy Range:');
                Object.entries(ranges).forEach(([range, count]) => {
                    console.log(`${range}: ${count} products`);
                });
            }
        } else {
            if (results.error) {
                console.log('\nError:', results.error);
            } else {
                console.log('\nNo products found');
            }
        }
    } catch (error) {
        console.error('Error testing scraper:', error);
    }
import { telefonikaScraper } from '../src/lib/scrapers/telefonika';

async function testTelefonikaScraper() {
  const query = "iphone 12";
  console.log(`\nTesting Telefonika scraper with query: "${query}"\n`);

  try {
    const result = await telefonikaScraper.scrape({ query });
    
    console.log('Scraping success:', result.success);
    console.log('Number of products found:', result.products.length);
    
    if (result.products.length > 0) {
      console.log('\nProducts found:');
      result.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Price: ${product.currency} ${product.price}`);
        console.log(`   URL: ${product.productUrl}`);
        console.log(`   Image: ${product.imageUrl}`);
        if (product.metadata?.relevancyScore) {
          console.log(`   Relevancy Score: ${product.metadata.relevancyScore.toFixed(2)}`);
        }
      });
    } else {
      console.log('\nNo products found');
    }

    if (result.error) {
      console.log('\nError:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTelefonikaScraper();
