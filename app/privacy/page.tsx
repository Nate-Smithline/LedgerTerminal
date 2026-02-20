import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 text-sm text-mono-light hover:text-mono-medium transition-colors mb-10"
        >
          <span className="material-symbols-rounded text-[18px]">arrow_back</span>
          Back
        </Link>

        <h1 className="font-display text-3xl text-mono-dark mb-2">Privacy Policy</h1>
        <p className="text-sm text-mono-light mb-10">Last updated: February 17, 2026</p>

        <div className="card p-8 space-y-8 text-sm text-mono-medium leading-relaxed">
          <section>
            <h2 className="text-lg text-mono-dark mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Name, email address, password, and business type</li>
              <li><strong>Financial data:</strong> Transaction records you upload (dates, amounts, vendors, categories)</li>
              <li><strong>Usage data:</strong> How you interact with the Service (pages viewed, features used)</li>
              <li><strong>Device data:</strong> Browser type, operating system, and IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain the Service</li>
              <li>To categorize transactions using AI models</li>
              <li>To generate tax summaries and reports</li>
              <li>To send verification and transactional emails</li>
              <li>To improve the Service and develop new features</li>
              <li>To communicate updates (if you opted in)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">3. Data Storage &amp; Security</h2>
            <p>
              Your data is stored securely using Supabase with row-level security policies.
              All data is encrypted in transit (TLS) and at rest. We implement
              industry-standard security practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">4. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> Authentication and database hosting</li>
              <li><strong>Anthropic (Claude):</strong> AI transaction categorization</li>
              <li><strong>Resend:</strong> Transactional email delivery</li>
            </ul>
            <p className="mt-2">
              These services have their own privacy policies. We only share the minimum data
              necessary for each service to function.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">5. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell your personal or financial data. We may share
              data only: (a) with your consent, (b) to comply with legal obligations,
              (c) with service providers who assist in operating the Service under strict
              confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data in standard formats (CSV, PDF)</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We do not
              use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. Upon account
              deletion, all personal and financial data is permanently removed within 30 days.
              Some anonymized, aggregated data may be retained for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-mono-dark mb-3">9. Contact</h2>
            <p>
              For privacy inquiries, email{" "}
              <a href="mailto:privacy@expenseteterminal.com" className="text-accent-navy underline">
                privacy@expenseteterminal.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
