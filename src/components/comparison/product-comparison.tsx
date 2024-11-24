'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { currencies, formatCurrencyWithSymbol } from '@/lib/currency';
import { PlusCircle, Trash2, ArrowLeftRight, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/scrapers/types';

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col min-h-[400px]"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Image
          src={product.imageUrl || '/placeholder.png'}
          alt={product.title}
          fill
          className="object-contain hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">{product.store}</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrencyWithSymbol(product.price, product.currency)}
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 min-h-[3.5rem]">{product.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3 min-h-[4.5rem]">{product.title}</p>
        </div>
        <div className="mt-4">
          <Link
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export function ProductComparison() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          budget: 100000000, // High budget to get all products for comparison
          currency: selectedCurrency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      
      const data = await response.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        
        if (data.products.length === 0) {
          setError('No products found matching your search.');
        }
      } else {
        setError('No products found');
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to search products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    // Convert prices for all products to the new currency
    const updatedProducts = await Promise.all(products.map(async (product) => {
      if (product.currency === newCurrency) return product;
      try {
        const convertedPrice = await convertPrice(product.price, product.currency, newCurrency);
        return {
          ...product,
          price: convertedPrice,
          currency: newCurrency
        };
      } catch (error) {
        console.error('Error converting price:', error);
        return product;
      }
    }));
    setProducts(updatedProducts);
  };

  const convertPrice = async (price: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return price;
    try {
      const response = await fetch('/api/convert-currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price,
          from: fromCurrency,
          to: toCurrency
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert currency');
      }

      const data = await response.json();
      return data.convertedAmount;
    } catch (error) {
      console.error('Error converting currency:', error);
      return price; // Return original price if conversion fails
    }
  };

  return (
    <div className="space-y-6 p-4">
      <form onSubmit={handleSearch} className="max-w-5xl mx-auto flex gap-4 items-center justify-center">
        <div className="w-[600px]">
          <Input
            placeholder="Search for products to compare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 text-lg rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-40">
          <CurrencySelect
            value={selectedCurrency}
            onValueChange={handleCurrencyChange}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Search
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>

      {products.length === 0 && !isLoading && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
