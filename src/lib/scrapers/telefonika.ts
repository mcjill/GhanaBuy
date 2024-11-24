import puppeteer from 'puppeteer';
import { Product, ScrapingResult } from './types';
import { BaseScraper } from './base-scraper';

export class TelefonikaScraper extends BaseScraper {
  protected store = 'Telefonika' as const;
  
  protected selectors = {
    productGrid: '.products-grid',
    productItem: '.item',
    title: '.product-name a',
    price: '.price',
    image: '.product-image img',
    link: '.product-name a'
  };

  protected getSearchUrl(query: string): string {
    return `https://telefonika.com/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  }
}

// Create singleton instance
export const telefonikaScraper = new TelefonikaScraper();
