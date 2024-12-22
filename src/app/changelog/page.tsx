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
        <div className="space-y-8">
          {/* New Entry - December 22, 2023 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h2 className="text-2xl font-bold mb-4">December 22, 2023</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">Search & Product Display Improvements</h3>
                <ul className="list-disc ml-6 space-y-2 text-gray-700">
                  <li>Removed product filtering and sanitization to show all available products from every source</li>
                  <li>Fixed CompuGhana scraper to properly extract all product details including images and prices</li>
                  <li>Improved URL handling across all scrapers to ensure proper absolute URLs</li>
                  <li>Enhanced product ID generation for better tracking and consistency</li>
                  <li>Added detailed logging to help track product sourcing and processing</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-600">Scraper Enhancements</h3>
                <ul className="list-disc ml-6 space-y-2 text-gray-700">
                  <li>Added better error handling and reporting in all scrapers</li>
                  <li>Improved HTML parsing and selector handling for CompuGhana products</li>
                  <li>Enhanced product validation to ensure all required fields are present</li>
                  <li>Added testing script for individual scraper testing and debugging</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-600">Performance Updates</h3>
                <ul className="list-disc ml-6 space-y-2 text-gray-700">
                  <li>Removed caching layer to ensure fresh results on every search</li>
                  <li>Optimized parallel scraping to reduce search response time</li>
                  <li>Improved error reporting in the API response</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
