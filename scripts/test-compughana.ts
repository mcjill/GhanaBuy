import { CompuGhanaScraper } from '../src/lib/scrapers/compughana';

async function testCompuGhanaScraper() {
    console.log('Starting CompuGhana scraper test...');
    const query = 'iphone';
    console.log(`Testing query: "${query}"`);
    
    try {
        const scraper = new CompuGhanaScraper();
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
                console.log(`Relevancy Score: ${product.metadata?.relevancyScore}`);
                console.log(`Availability: ${product.availability ? 'In Stock' : 'Out of Stock'}`);
                console.log('');
            });

            // Show distribution of relevancy scores
            const scores = results.products.map(p => p.metadata?.relevancyScore || 0);
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
}

testCompuGhanaScraper();
