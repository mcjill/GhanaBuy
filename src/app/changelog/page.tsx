import React from 'react';
import { Card } from '@/components/ui/card';

export default function ChangelogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Changelog</h1>

      {/* Latest Release */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">December 21, 2024</h2>
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">🚀 Product Search Improvements</h3>
          <ul className="space-y-3">
            <li>✨ Added engaging loading animations with fun messages while searching</li>
            <li>🔄 Improved Jiji product scraping reliability</li>
            <li>🎯 Centered product comparison tabs for better UI balance</li>
            <li>🎨 Enhanced product card animations and styling</li>
            <li>🔍 Simplified search interface with better error handling</li>
            <li>🛠️ Removed international store tabs (Amazon, eBay, AliExpress) for future improvements</li>
            <li>📱 Improved mobile responsiveness across all components</li>
          </ul>
        </Card>
      </div>

      {/* Previous Releases */}
      <div className="space-y-12 opacity-75">
        <div>
          <h2 className="text-2xl font-semibold mb-4">December 20, 2024</h2>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">🌟 Initial Release</h3>
            <ul className="space-y-3">
              <li>🚀 Launched product comparison tool</li>
              <li>🔍 Integrated local store scrapers (Jiji, Jumia, CompuGhana)</li>
              <li>💱 Added currency conversion support</li>
              <li>🎨 Implemented responsive product grid layout</li>
              <li>📊 Added product sorting and filtering capabilities</li>
              <li>🔄 Integrated real-time price updates</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
