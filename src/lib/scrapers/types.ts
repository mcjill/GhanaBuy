export interface Product {
  title: string;
  price: number;
  currency: string;
  url: string;
  image?: string;
  store: string;
  availability?: boolean;
  rating?: number;
  reviews?: number;
}

export interface ScrapingResult {
  products: Product[];
  error?: string;
}

export interface Scraper {
  scrape: (query: string) => Promise<ScrapingResult>;
  name: string;
}
