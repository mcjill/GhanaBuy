export interface Product {
  title: string;
  price: number;
  url: string;
  image: string;
  store: string;
  rating: number;
  reviews: number;
  currency?: string;
  availability?: boolean;
  description?: string;
  timestamp?: number;
}

export interface ScrapingResult {
  products: Product[];
  error?: string;
  source?: string;
  timestamp?: number;
}

export interface Scraper {
  scrape: (query: string) => Promise<ScrapingResult>;
  name: string;
  baseUrl: string;
  cleanPrice: (price: string) => number;
}

export type Store = 'Jumia' | 'CompuGhana' | 'Telefonika' | 'Jiji' | 'Amazon';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}
