import SimpleFooter from "../components/footer";


export default function PrivacyPage() {
  return (
    <>
      <main className="bg-black text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-px w-8 bg-orange-500"></div>
              <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider mx-3">
                Legal
              </span>
              <div className="h-px w-8 bg-orange-500"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-white/70 text-sm">
              Effective Date: 1st June 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">1. Information We Collect</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Account info:</strong> Name, email, phone number, business name.</li>
                <li><strong>Store data:</strong> Products, orders, customer names/addresses (only as needed for your store).</li>
                <li><strong>Payment info:</strong> Processed by third‑party provider (M‑Pesa / card). We never see your full card details.</li>
                <li><strong>Technical data:</strong> IP address, browser type, device info (for security and analytics).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">2. How We Use Your Data</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>To provide and maintain your store.</li>
                <li>To send service emails (e.g., trial ending, payment receipts).</li>
                <li>To improve our platform.</li>
                <li>To comply with legal obligations (e.g., tax records).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">3. Data Sharing</h2>
              <p>We do <strong>not</strong> sell your data. We share only when necessary:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                <li>Payment processors (to bill you).</li>
                <li>Hosting & database providers (e.g., Vercel, Supabase).</li>
                <li>Law enforcement if required by Kenyan law.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">4. Your Rights (Kenya Data Protection Act)</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access the data we hold about you.</li>
                <li>Request correction or deletion (where legally possible).</li>
                <li>Withdraw consent (e.g., marketing emails).</li>
              </ul>
              <p className="mt-2">To exercise these, email <a href="mailto:info@paziatech.com" className="text-orange-500 hover:underline">info@paziatech.com</a>.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">5. Data Retention</h2>
              <p>
                Account data: kept while your account is active + 30 days after cancellation.<br />
                Order data: you control deletion via dashboard. We do not retain customer payment details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">6. Security</h2>
              <p>We use industry‑standard encryption (SSL) and access controls. However, no online service is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">7. Children’s Privacy</h2>
              <p>Our service is not for children under 16. We do not knowingly collect their data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">8. Changes to This Policy</h2>
              <p>We may update this policy. You will be notified by email or dashboard notice.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">9. Contact Our Data Officer</h2>
              <p>
                Pazia Tech<br />
                Email: info@paziatech.com<br />
                Phone: +254 715067768
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <SimpleFooter />
    </>
  );
}