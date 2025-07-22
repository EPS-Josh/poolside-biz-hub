import { Header } from '@/components/Header';

const EULA = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-6">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">End-User License Agreement</h1>
          
          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-foreground mb-4">
              By accessing and using this pool and spa service management application ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. License Grant</h2>
            <p className="text-foreground mb-4">
              Subject to the terms of this Agreement, we grant you a limited, non-exclusive, non-transferable license to use the Service for your pool and spa service business operations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Permitted Uses</h2>
            <p className="text-foreground mb-4">You may use the Service to:</p>
            <ul className="list-disc pl-6 text-foreground mb-4">
              <li>Manage customer information and service records</li>
              <li>Schedule appointments and track service history</li>
              <li>Manage inventory and parts tracking</li>
              <li>Generate reports and analytics</li>
              <li>Integrate with QuickBooks for financial management</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Restrictions</h2>
            <p className="text-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-foreground mb-4">
              <li>Copy, modify, or distribute the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service for illegal or unauthorized purposes</li>
              <li>Interfere with or disrupt the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data and Privacy</h2>
            <p className="text-foreground mb-4">
              Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of information as outlined in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Third-Party Integrations</h2>
            <p className="text-foreground mb-4">
              The Service may integrate with third-party services such as QuickBooks. Your use of such integrations is subject to the respective third-party terms of service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-foreground mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
            <p className="text-foreground mb-4">
              IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
            <p className="text-foreground mb-4">
              This Agreement is effective until terminated. You may terminate it at any time by discontinuing use of the Service. We may terminate your access immediately without notice for breach of this Agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to Terms</h2>
            <p className="text-foreground mb-4">
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Information</h2>
            <p className="text-foreground mb-4">
              If you have questions about this Agreement, please contact us through the application support channels.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default EULA;