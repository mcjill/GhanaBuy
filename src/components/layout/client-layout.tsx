'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/layout/main-nav';
import { useEffect, useState } from 'react';

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for smart shopping decisions
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Can I Buy? All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
