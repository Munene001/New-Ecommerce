import SimpleFooter from "../components/footer";


export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-white/70 text-sm">
              Effective Date: 1st June 2026 | Last Updated: 1st June 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-white/90">
            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">1. Our Service</h2>
              <p>
                Pazia Tech provides an e‑commerce store builder. You get a standalone online store. 
                Money from your customers goes directly to <strong>you</strong>. We do not take any commission on your sales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">2. Subscription & Free Trial</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Free Trial:</strong> 30 days with full Basic plan features.</li>
                <li><strong>After Trial:</strong> You must choose a paid plan (Basic: KES 999/month or Pro: KES 2,499/month) to continue.</li>
                <li><strong>Payments:</strong> Monthly or annual (annual saves 20%).</li>
                <li><strong>Cancellation:</strong> You can cancel anytime from your dashboard. No refunds for partial months.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">3. Your Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>You own all content (products, images, descriptions) you upload.</li>
                <li>You must comply with all Kenyan laws (e.g., Consumer Protection Act, Data Protection Act).</li>
                <li>You are responsible for fulfilling orders, handling deliveries, and customer support.</li>
                <li>You must not sell prohibited items (illegal goods, counterfeit, adult content, etc.).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">4. Custom Domain & Pro Services</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Basic:</strong> You bring your own domain.</li>
                <li>
                  <strong>Pro:</strong> We provide a free domain (we buy it for you). 
                  <strong className="text-orange-400"> After 6 consecutive paid months on the Pro plan, the domain transfers fully to you.</strong> 
                  You can then take it anywhere.
                </li>
                <li>Pro hands‑on services: blog writing, product upload help, social media auto‑posting – delivered within reasonable timeframes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">5. Payments & Refunds</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Subscription fees are billed in advance (monthly or annually).</li>
                <li>We use secure payment providers (M‑Pesa / card). We never store your payment details.</li>
                <li>No refunds for unused time if you cancel.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">6. Limitation of Liability</h2>
              <p>
                Pazia Tech is not liable for lost sales, customer disputes, or downtime caused by third‑party services. 
                Our total liability is limited to the amount you paid us in the last 3 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">7. Termination</h2>
              <p>
                We may suspend or terminate your store if you violate these Terms. You will be notified and given 7 days to fix the issue.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">8. Governing Law</h2>
              <p>These Terms are governed by the laws of Kenya. Any disputes shall be resolved in Nairobi.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-3">9. Contact Us</h2>
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