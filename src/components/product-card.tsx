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
        <CardDescription>From {source}</CardDescription>
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
