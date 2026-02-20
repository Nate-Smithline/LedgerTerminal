"use client";

import { useState } from "react";
import type { Database } from "@/lib/types/database";
import { UploadModal } from "@/components/UploadModal";

type DataSource = Database["public"]["Tables"]["data_sources"]["Row"];

const ACCOUNT_TYPES = [
  { value: "checking", label: "Business Checking" },
  { value: "credit", label: "Business Credit Card" },
  { value: "savings", label: "Business Savings" },
  { value: "other", label: "Other" },
];

function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPES.find((a) => a.value === type)?.label ?? type;
}

function accountIcon(type: string): string {
  switch (type) {
    case "checking": return "🏦";
    case "credit": return "💳";
    case "savings": return "🏧";
    default: return "📄";
  }
}

export function DataSourcesClient({ initialSources }: { initialSources: DataSource[] }) {
  const [sources, setSources] = useState<DataSource[]>(initialSources);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [institution, setInstitution] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadSourceId, setUploadSourceId] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch("/api/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, account_type: accountType, institution: institution || undefined }),
    });

    if (res.ok) {
      const { data } = await res.json();
      setSources((prev) => [data, ...prev]);
      setName("");
      setInstitution("");
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function reloadSources() {
    const res = await fetch("/api/data-sources");
    if (res.ok) {
      const { data } = await res.json();
      setSources(data ?? []);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mono-dark">Data Sources</h1>
          <p className="text-sm text-mono-medium mt-1">
            Financial accounts that feed into your transactions
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary"
        >
          Add Account
        </button>
      </div>

      {/* Add Account Form */}
      {showAdd && (
        <div className="card p-6 space-y-4 animate-in">
          <h2 className="text-lg font-semibold text-mono-dark">New Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-mono-medium block mb-1">
                Account Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chase Business Checking"
                className="w-full border border-bg-tertiary rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-1 focus:ring-accent-sage/30 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-mono-medium block mb-1">
                Account Type *
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full border border-bg-tertiary rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-1 focus:ring-accent-sage/30 outline-none"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-mono-medium block mb-1">
                Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Chase, Amex"
                className="w-full border border-bg-tertiary rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-1 focus:ring-accent-sage/30 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={saving || !name.trim()} className="btn-primary disabled:opacity-40">
              {saving ? "Creating..." : "Create Account"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Source Cards */}
      {sources.length === 0 && !showAdd && (
        <div className="text-center py-20">
          <p className="text-base text-mono-medium mb-2">No data sources yet</p>
          <p className="text-sm text-mono-light">
            Add a financial account to start uploading transaction CSVs.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sources.map((source) => (
          <div key={source.id} className="card p-6 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{accountIcon(source.account_type)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-mono-dark">{source.name}</h3>
                <p className="text-xs text-mono-light">
                  {accountTypeLabel(source.account_type)}
                  {source.institution && ` · ${source.institution}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-mono-light">
              <span>{source.transaction_count} transactions</span>
              <span>
                {source.last_upload_at
                  ? `Last upload: ${new Date(source.last_upload_at).toLocaleDateString()}`
                  : "No uploads yet"}
              </span>
            </div>
            <button
              onClick={() => setUploadSourceId(source.id)}
              className="btn-secondary w-full text-sm"
            >
              Upload CSV
            </button>
          </div>
        ))}
      </div>

      {uploadSourceId && (
        <UploadModal
          dataSourceId={uploadSourceId}
          onClose={() => setUploadSourceId(null)}
          onCompleted={async () => {
            setUploadSourceId(null);
            await reloadSources();
          }}
        />
      )}
    </div>
  );
}
