import React from 'react';

export default function ChangelogPage() {
  const changes = [
    {
      version: '1.0.0',
      date: 'February 8, 2024',
      changes: [
        'Initial release',
        'Multi-platform product search (Jiji Ghana, Amazon)',
        'Real-time currency conversion',
        'Interactive product comparison',
        'Responsive design implementation'
      ]
    },
    {
      version: '0.9.0',
      date: 'February 1, 2024',
      changes: [
        'Beta release',
        'Added currency conversion system',
        'Implemented basic search functionality',
        'Created responsive UI components'
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Changelog</h1>
      <div className="space-y-8">
        {changes.map((release, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Version {release.version}</h2>
              <span className="text-gray-600">{release.date}</span>
            </div>
            <ul className="list-disc list-inside space-y-2">
              {release.changes.map((change, changeIndex) => (
                <li key={changeIndex} className="text-gray-700">{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
