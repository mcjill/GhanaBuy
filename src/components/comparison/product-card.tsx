import { Card } from '@/components/ui/card';
import { Product } from '@/lib/scrapers/types';
import { formatCurrencyWithSymbol } from '@/lib/currency';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <Link href={product.productUrl} target="_blank" rel="noopener noreferrer">
          <div className="relative h-48 bg-gray-100">
            <Image
              src={product.imageUrl || '/placeholder.png'}
              alt={product.title}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-sm font-medium">
              {product.store}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2 line-clamp-2">{product.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrencyWithSymbol(product.price, product.currency)}
              </span>
              {product.rating && (
                <div className="flex items-center">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1 text-sm text-gray-600">
                    {product.rating.toFixed(1)}
                  </span>
                  {product.reviews && (
                    <span className="ml-1 text-sm text-gray-500">
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
