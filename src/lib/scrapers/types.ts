export interface Product {
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  store: string;
  rating?: number;
  reviews?: number;
  availability?: boolean;
}

export interface ScrapingResult {
  success: boolean;
  products: Product[];
  error: string | null;
}

export interface SearchRequest {
  query: string;
  budget?: number;
  currency?: string;
}

export interface Scraper {
  scrape: (query: SearchRequest) => Promise<ScrapingResult>;
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
