"use client";

import { Shield, Lock, Mail, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";

// Reusable card component
const Card = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="bg-white/5 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-orange-400" />
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <div className="text-gray-300 text-sm space-y-1">{children}</div>
  </div>
);

// Reusable table row
const DataRow = ({ label, access, usage }: { label: string; access: string; usage: string }) => (
  <div className="px-5 py-2.5 grid grid-cols-3 gap-4 text-sm border-t border-white/10">
    <div className="text-white">{label}</div>
    <div className="text-gray-300">{access}</div>
    <div className="text-gray-300">{usage}</div>
  </div>
);

const DataTransparencySection = () => {
  // Using your magenta variable (falls back to magenta if not defined)
  const magentaColor = "var(--magenta, #00ff00)"; // you said magenta is green in your CSS

  return (
    <section className="py-12 px-4 bg-[#0A1128] border-t border-orange-500/20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-300 px-3 py-1 rounded-full text-sm mb-3">
            <Shield className="w-4 h-4" />
            <span>Privacy & Security</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white font-[Poppins] mb-2">
            How We Use Your Data
          </h2>
          <p className="text-gray-200 text-sm max-w-xl mx-auto">
            PaziaTech helps Kenyan merchants sell online. We use Google Sign‑In for secure, password‑free access.
          </p>
        </div>

        {/* Two cards: App purpose + Why Google auth */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card icon={Lock} title="What PaziaTech Does">
            <p>Create a product catalog, share a link, accept M‑Pesa, manage orders.</p>
            <ul className="list-disc list-inside mt-2 space-y-0.5 text-gray-100">
              <li>Store in minutes</li>
              <li>Add products</li>
              <li>M‑Pesa or cash</li>
            </ul>
          </Card>

          <Card icon={Mail} title="Why Google Sign‑In?">
            <p>Secure login without passwords. Links your verified email for order notifications.</p>
            <ul className="list-disc list-inside mt-2 space-y-0.5 text-gray-100">
              <li>No passwords to reset</li>
              <li>Google protects your account</li>
              <li>One‑click from any device</li>
            </ul>
          </Card>
        </div>

        {/* Data table – concise */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="bg-orange-500/10 px-5 py-2 border-b border-white/10 flex items-center gap-2">
            <Eye className="w-4 h-4 text-orange-400" />
            <span className="font-medium text-white text-sm">Data Accessed & Usage</span>
          </div>
          <div>
            <div className="px-5 py-2 grid grid-cols-3 gap-4 text-xs text-gray-400 font-medium border-b border-white/10">
              <div>Data</div>
              <div>What We Access</div>
              <div>Purpose</div>
            </div>
            <DataRow label="Profile" access="Name" usage="Display in dashboard" />
            <DataRow label="Email" access="Gmail address" usage="Login & order receipts" />
            <DataRow label="OpenID" access="Auth token" usage="Password‑free verification" />
          </div>
        </div>

        {/* Footer – short + privacy link */}
        <div className="mt-6 text-center text-xs text-gray-400 space-y-2">
          <p>
            We <span className="text-white font-medium">never sell</span> your data. Delete your account anytime.
          </p>
          <p>
            OAuth scopes: <code className="bg-white/10 px-1 rounded">openid</code>, <code className="bg-white/10 px-1 rounded">email</code>, <code className="bg-white/10 px-1 rounded">profile</code>
          </p>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs"
          >
            Privacy Policy <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Optional magenta accent bar – using your global magenta variable */}
        <div className="mt-4 h-0.5 w-20 mx-auto rounded-full" style={{ backgroundColor: magentaColor }} />
      </div>
    </section>
  );
};

export default DataTransparencySection;