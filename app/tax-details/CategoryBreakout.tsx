"use client";

import { useState } from "react";

interface CategoryBreakoutProps {
  categoryBreakdown: Record<string, number>;
  transactions: Array<{
    id: string;
    vendor: string;
    amount: string | number;
    date: string;
    category: string | null;
  }>;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const BAR_COLORS = [
  "bg-accent-sage",
  "bg-accent-navy",
  "bg-accent-warm",
  "bg-accent-terracotta",
  "bg-accent-sage/60",
  "bg-accent-navy/60",
  "bg-accent-warm/60",
  "bg-accent-terracotta/60",
];

export function CategoryBreakout({ categoryBreakdown, transactions }: CategoryBreakoutProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const total = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0);

  if (sorted.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-mono-dark mb-2">Category Breakout</h3>
        <p className="text-sm text-mono-light text-center py-8">
          No expense categories to display yet.
        </p>
      </div>
    );
  }

  const maxAmount = sorted[0]?.[1] ?? 1;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-mono-dark">Category Breakout</h3>
          <p className="text-xs text-mono-light mt-0.5">Expense distribution by category</p>
        </div>
        <p className="text-sm font-medium text-mono-dark tabular-nums">
          {formatCurrency(total)} total
        </p>
      </div>

      <div className="space-y-2">
        {sorted.map(([category, amount], i) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          const barWidth = (amount / maxAmount) * 100;
          const isExpanded = expandedCategory === category;
          const catTxs = isExpanded
            ? transactions.filter((t) => (t.category || "Uncategorized") === category)
            : [];

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-mono-dark font-medium truncate flex-1 text-left">
                    {category}
                  </span>
                  <span className="text-xs text-mono-light ml-2 tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-mono-dark ml-3 tabular-nums">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </button>

              {isExpanded && catTxs.length > 0 && (
                <div className="ml-4 mt-2 mb-3 space-y-1 animate-in">
                  {catTxs.slice(0, 15).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-1.5 px-2 text-xs rounded hover:bg-bg-secondary/60 transition-colors"
                    >
                      <span className="text-mono-medium truncate flex-1 mr-3">
                        {tx.vendor}
                      </span>
                      <span className="text-mono-light shrink-0 mr-3">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-mono-dark font-medium tabular-nums shrink-0">
                        {formatCurrency(Math.abs(Number(tx.amount)))}
                      </span>
                    </div>
                  ))}
                  {catTxs.length > 15 && (
                    <p className="text-xs text-mono-light px-2">
                      + {catTxs.length - 15} more
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
