import { Card } from '@/components/ui/card';
import { Product } from '@/lib/scrapers/types';
import { formatCurrencyWithSymbol } from '@/lib/currency';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Validate and sanitize product URL
  const getValidUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return '#';
    
    try {
      // Test if URL is valid
      new URL(url);
      return url;
    } catch {
      // If URL is invalid, return fallback
      return '#';
    }
  };

  const getStoreStyles = (store: string) => {
    const storeName = store.toLowerCase();
    if (storeName.includes('jiji')) {
      return {
        bgColor: 'bg-[#2ECC71]',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#27AE60]'
      };
    }
    if (storeName.includes('jumia')) {
      return {
        bgColor: 'bg-[#F68B1E]',
        textColor: 'text-white',
        hoverBg: 'hover:bg-[#E67E17]'
      };
    }
    if (storeName.includes('compughana')) {
      return {
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-800',
        hoverBg: 'hover:bg-sky-200'
      };
    }
    if (storeName.includes('telefonika')) {
      return {
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        hoverBg: 'hover:bg-purple-200'
      };
    }
    return {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      hoverBg: 'hover:bg-gray-200'
    };
  };

  const storeStyles = getStoreStyles(product.store);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="overflow-hidden bg-white transition-all duration-300 hover:shadow-lg">
        <Link href={getValidUrl(product.productUrl)} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative aspect-[4/3] bg-white p-4">
            <Image
              src={product.imageUrl || '/placeholder.png'}
              alt={product.title}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.png';
                target.onerror = null;
              }}
            />
            <div 
              className={`absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded-full transition-colors ${storeStyles.bgColor} ${storeStyles.textColor} ${storeStyles.hoverBg}`}
            >
              {product.store}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-900 group-hover:text-blue-600">
              {product.title}
            </h3>
            
            {product.metadata?.specs && (
              <p className="mb-2 line-clamp-1 text-xs text-gray-500">
                {product.metadata.specs}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrencyWithSymbol(product.price, product.currency)}
                </div>
                {product.metadata?.originalPrice && product.metadata.originalPrice > product.price && (
                  <div className="text-sm text-gray-500 line-through">
                    {formatCurrencyWithSymbol(product.metadata.originalPrice, product.currency)}
                  </div>
                )}
              </div>

              {product.rating && product.rating > 0 && (
                <div className="flex items-center">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1 text-sm text-gray-600">
                    {product.rating.toFixed(1)}
                  </span>
                  {product.reviews && product.reviews > 0 && (
                    <span className="ml-1 text-xs text-gray-400">
                      ({product.reviews})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
