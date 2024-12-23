export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  productUrl: string;
  imageUrl: string;
  store: string;
  rating: number | null;
  reviews: number | null;
  availability: boolean;
  metadata?: {
    searchQuery?: string;
    originalTitle?: string;
    relevancyScore?: number;
    location?: string;
    [key: string]: any;
  };
}

export interface SearchRequest {
  query: string;
  budget?: number;
  currency?: string;
}

export interface ScrapingResult {
  success: boolean;
  products: Product[];
  error: string | null;
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
