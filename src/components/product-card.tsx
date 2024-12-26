import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  source: string;
  onAnalyze?: () => void;
}

export function ProductCard({
  name,
  price,
  currency,
  imageUrl,
  source,
  onAnalyze,
}: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        {imageUrl && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <CardTitle className="line-clamp-2">{name}</CardTitle>
        <CardDescription>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            source === 'Jiji' ? 'bg-emerald-100 text-emerald-800' :
            source === 'CompuGhana' ? 'bg-sky-100 text-sky-800' :
            source === 'Jumia' ? 'bg-orange-100 text-orange-800' :
            source === 'Telefonika' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            From {source}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(price, currency)}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onAnalyze}
          variant="gradient"
          className="w-full"
        >
          Analyze Affordability
        </Button>
      </CardFooter>
    </Card>
  );
}
