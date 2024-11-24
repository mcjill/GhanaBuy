import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="mx-auto h-6 w-96 animate-pulse rounded-lg bg-muted" />
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
            <div className="h-10 animate-pulse rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
