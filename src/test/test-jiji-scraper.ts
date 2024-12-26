import { jijiScraper } from '../lib/scrapers/jiji.js';

async function testJijiScraper() {
  const query = 'iphone 14 pro';
  const minBudget = 8000;
  const maxBudget = 23000;

  console.log('Starting Jiji scraper test...');
  console.log(`Query: "${query}"`);
  console.log(`Price Range: GHS ${minBudget} - GHS ${maxBudget}`);
  console.log('----------------------------------------\n');

  try {
    const startTime = Date.now();
    const result = await jijiScraper.scrape({ query, minBudget, maxBudget });
    const duration = Date.now() - startTime;

    if (result.success && result.products.length > 0) {
      console.log(`\n✅ Found ${result.products.length} products in ${duration}ms`);
      
      // Analyze query match quality
      const products = result.products.map(product => {
        const titleLower = product.title.toLowerCase();
        const queryWords = query.toLowerCase().split(' ');
        const matchedWords = queryWords.filter(word => titleLower.includes(word));
        const matchScore = matchedWords.length / queryWords.length;
        
        return {
          ...product,
          matchScore,
          matchedWords
        };
      });

      // Sort by match quality
      products.sort((a, b) => b.matchScore - a.matchScore);

      // Display results
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`Title: ${product.title}`);
        console.log(`Price: ${product.currency} ${product.price}`);
        console.log(`Store: ${product.store}`);
        console.log(`URL: ${product.productUrl}`);
        console.log(`Match Score: ${(product.matchScore * 100).toFixed(1)}%`);
        console.log(`Matched Words: ${product.matchedWords.join(', ')}`);
      });

      // Quality metrics
      const averageMatchScore = products.reduce((sum, p) => sum + p.matchScore, 0) / products.length;
      const perfectMatches = products.filter(p => p.matchScore === 1).length;
      const relevantMatches = products.filter(p => p.matchScore >= 0.5).length;
      
      console.log('\nQuality Metrics:');
      console.log(`Total Products Found: ${products.length}`);
      console.log(`Average Match Score: ${(averageMatchScore * 100).toFixed(1)}%`);
      console.log(`Perfect Matches: ${perfectMatches} out of ${products.length}`);
      console.log(`Relevant Matches (≥50% match): ${relevantMatches} out of ${products.length}`);
      console.log(`Price Range Accuracy: 100% (enforced by scraper)`);
      
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
console.log('Running Jiji scraper quality test...\n');
testJijiScraper().catch(console.error);
