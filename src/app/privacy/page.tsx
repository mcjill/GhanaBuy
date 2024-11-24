import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-gray-700">
            We collect information that you provide directly to us when using our service,
            including search queries and feedback submissions. We do not store any personal
            financial information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>To provide and improve our price comparison service</li>
            <li>To analyze usage patterns and optimize user experience</li>
            <li>To respond to your comments and questions</li>
            <li>To send you related information and updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate security measures to protect your information from
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-gray-700">
            Our service integrates with third-party e-commerce platforms. When you use our
            service, you may also be subject to their privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-700">
            If you have questions about this Privacy Policy, please contact us at
            privacy@canibuy.gh
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8">
          Last updated: February 8, 2024
        </div>
      </div>
    </div>
  );
}
