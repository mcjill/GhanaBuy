import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { ClientLayout } from '@/components/layout/client-layout';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Can I Buy? - Smart Purchase Price Comparison',
  description: 'Make informed financial decisions with our smart price comparison tool for Ghana.',
  keywords: [
    'purchase decision',
    'affordability calculator',
    'price comparison',
    'savings calculator',
    'financial planning',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <div className="min-h-screen flex flex-col">
          <NotificationProvider />
          <main className="flex-grow">
            <ClientLayout>{children}</ClientLayout>
          </main>
          
          <footer className="bg-gray-900 text-white py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">About Can I Buy?</h3>
                  <p className="text-gray-400">
                    Helping Ghanaians make smarter financial decisions through intelligent price comparisons.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/uptime" className="text-gray-400 hover:text-white transition">
                        System Status
                      </Link>
                    </li>
                    <li>
                      <Link href="/changelog" className="text-gray-400 hover:text-white transition">
                        Changelog
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Legal</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/privacy" className="text-gray-400 hover:text-white transition">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-gray-400 hover:text-white transition">
                        Terms of Service
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact</h3>
                  <p className="text-gray-400">
                    Email: hello@canibuy.gh<br />
                    Location: Accra, Ghana
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Can I Buy. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
