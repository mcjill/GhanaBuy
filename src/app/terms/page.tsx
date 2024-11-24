import React from 'react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using Can I Buy?, you agree to be bound by these Terms of
            Service and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p className="text-gray-700">
            Can I Buy? is a price comparison service that helps users make informed
            purchasing decisions by comparing prices across different e-commerce platforms
            in Ghana.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Store Affiliations and Shopping Disclaimer</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              Can I Buy? is an independent price comparison service and is not affiliated with,
              endorsed by, or connected to any of the stores or platforms we compare prices from.
            </p>
            <p>
              We strongly encourage users to exercise caution when shopping on any e-commerce
              platform. Before making a purchase, please:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>Verify the legitimacy of the seller and their ratings</li>
              <li>Read product reviews and seller feedback carefully</li>
              <li>Use secure payment methods</li>
              <li>Be wary of prices that seem too good to be true</li>
              <li>Keep records of all transactions and communications</li>
            </ul>
            <p className="mt-4 font-medium">
              Can I Buy? is not responsible for any transactions between users and third-party
              sellers or platforms. All purchases are made at your own risk.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>You must provide accurate information when using our service</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You agree not to misuse or attempt to disrupt our service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          <p className="text-gray-700">
            All content, features, and functionality of Can I Buy? are owned by us and
            are protected by international copyright, trademark, and other intellectual
            property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Disclaimer</h2>
          <p className="text-gray-700">
            The information provided through our service is for general informational
            purposes only. We do not guarantee the accuracy, completeness, or usefulness
            of this information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-700">
            We shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages resulting from your use of or inability to use our service.
          </p>
        </section>

        <div className="text-sm text-gray-600 mt-8">
          Last updated: February 8, 2024
        </div>
      </div>
    </div>
  );
}
