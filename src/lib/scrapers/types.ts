export interface Product {
  title: string;
  price: number;
  currency: string;
  url: string;
  image: string;
  store: 'CompuGhana' | 'Telefonika' | 'Jumia';
  availability: boolean;
  timestamp: Date;
}

export interface ScrapingResult {
  products: Product[];
  error?: string;
}
