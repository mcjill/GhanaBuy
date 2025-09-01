import { NextRequest } from 'next/server';
import { scrapeCompuGhana, scrapeJumia, scrapeTelefonika } from '@/utils/scrapers';
import { jijiScraper } from '@/lib/scrapers/jiji';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { query, minBudget, maxBudget, stores } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'status', 
          message: 'Starting search...',
          progress: 0
        })}\n\n`));

        const scrapers = [
          { name: 'Jiji', fn: () => jijiScraper.scrape({ query, minBudget, maxBudget }) },
          { name: 'CompuGhana', fn: () => scrapeCompuGhana({ query, minBudget, maxBudget }) },
          { name: 'Jumia', fn: () => scrapeJumia({ query, minBudget, maxBudget }) },
          { name: 'Telefonika', fn: () => scrapeTelefonika({ query, minBudget, maxBudget }) }
        ].filter(scraper => !stores || stores.includes(scraper.name));

        const allProducts: any[] = [];
        let completed = 0;

        // Run scrapers in parallel and stream results
        const promises = scrapers.map(async (scraper, index) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              message: `Searching ${scraper.name}...`,
              progress: (completed / scrapers.length) * 100
            })}\n\n`));

            const result = await scraper.fn();
            
            if (result.success && result.products.length > 0) {
              // Stream products as they arrive
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'products', 
                store: scraper.name,
                products: result.products,
                count: result.products.length
              })}\n\n`));
              
              allProducts.push(...result.products);
            }

            completed++;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'status', 
              message: `${scraper.name} completed`,
              progress: (completed / scrapers.length) * 100
            })}\n\n`));

          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              store: scraper.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`));
            completed++;
          }
        });

        await Promise.allSettled(promises);

        // Send final results
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          totalProducts: allProducts.length,
          message: `Found ${allProducts.length} products`
        })}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Search failed'
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
