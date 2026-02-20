"use client";

import type { Database } from "@/lib/types/database";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface SimilarTransactionsPopupProps {
  vendor: string;
  transactions: Transaction[];
  quickLabel: string;
  businessPurpose: string;
  onCancel: () => void;
  onJustThisOne: () => void;
  onApplyToAll: () => void;
  applying?: boolean;
}

export function SimilarTransactionsPopup({
  vendor,
  transactions,
  quickLabel,
  businessPurpose,
  onCancel,
  onJustThisOne,
  onApplyToAll,
  applying = false,
}: SimilarTransactionsPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-mono-dark mb-4">
          Similar Transactions Found
        </h2>

        <p className="text-mono-medium mb-4">
          We found {transactions.length} more transaction
          {transactions.length === 1 ? "" : "s"} from {vendor}:
        </p>

        <ul className="space-y-2 mb-6 max-h-48 overflow-y-auto">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex justify-between text-sm border-b border-bg-tertiary/50 pb-2 last:border-0"
            >
              <span>{formatDate(t.date)}</span>
              <span className="font-medium">
                ${Math.abs(Number(t.amount)).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="bg-bg-secondary p-4 rounded-md mb-6">
          <p className="text-sm mb-2">
            <strong className="text-mono-dark">Category:</strong>{" "}
            <span className="text-mono-medium">{quickLabel}</span>
          </p>
          <p className="text-sm">
            <strong className="text-mono-dark">Purpose:</strong>{" "}
            <span className="text-mono-medium">
              {businessPurpose || "—"}
            </span>
          </p>
        </div>

        <p className="text-sm text-mono-medium mb-6">
          Apply this categorization to all of these transactions?
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1 min-w-[100px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onJustThisOne}
            className="btn-secondary flex-1 min-w-[100px]"
          >
            Just This One
          </button>
          <button
            type="button"
            onClick={onApplyToAll}
            disabled={applying}
            className="btn-primary flex-1 min-w-[100px]"
          >
            {applying ? "Applying…" : "Apply to All ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
