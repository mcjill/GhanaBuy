import React from 'react';

export default function UptimePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">System Uptime</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Current Status</h2>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-lg">All Systems Operational</span>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Uptime Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Last 24 hours</p>
              <p className="text-2xl font-bold">99.99%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Last 7 days</p>
              <p className="text-2xl font-bold">99.95%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Last 30 days</p>
              <p className="text-2xl font-bold">99.90%</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Incidents</h2>
          <p className="text-gray-600">No incidents reported in the last 90 days.</p>
        </div>
      </div>
    </div>
  );
}
