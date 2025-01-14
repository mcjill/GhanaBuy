'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { MobileNav } from './mobile-nav';

export function MainNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    // Clear any search-related state from localStorage
    localStorage.removeItem('lastSearch');
    localStorage.removeItem('searchResults');
    
    // Use window.location for hard navigation when needed
    window.location.href = href;
  };

  const routes = [
    {
      href: '/',
      label: 'Home',
      active: pathname === '/',
    },
    {
      href: '/compare',
      label: 'Compare',
      active: pathname === '/compare',
    },
    {
      href: '/blog',
      label: 'Blog',
      active: pathname === '/blog',
    },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/70 backdrop-blur-lg shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="container-apple">
        <div className="flex h-16 items-center justify-between">
          <Link 
            href="/"
            onClick={(e) => handleNavigation(e, '/')}
            className={`text-lg font-semibold transition-colors duration-200 ${
              isScrolled ? 'text-gray-900' : 'text-gray-800'
            }`}
          >
            Can I Buy
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              Beta
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={(e) => handleNavigation(e, route.href)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'
                } ${route.active ? 'nav-link-active' : 'nav-link-inactive'}`}
              >
                {route.label}
              </Link>
            ))}
          </div>

          {/* Mobile Navigation */}
          <MobileNav routes={routes} onNavigate={handleNavigation} />
        </div>
      </div>
    </nav>
  );
}
