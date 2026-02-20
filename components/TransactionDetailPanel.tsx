"use client";

import { useEffect, useRef } from "react";
import type { Database } from "@/lib/types/database";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface TransactionDetailPanelProps {
  transaction: Transaction;
  onClose: () => void;
  onReanalyze?: (id: string) => Promise<void>;
  onMarkPersonal?: () => Promise<void>;
  taxRate?: number;
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-bg-tertiary/20">
      <span className="text-xs text-mono-light w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-sm text-mono-dark">{children}</div>
    </div>
  );
}

function Tag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "sage" | "amber" | "red" }) {
  const colors = {
    default: "bg-bg-tertiary/40 text-mono-medium",
    sage: "bg-accent-sage/10 text-accent-sage",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

export function TransactionDetailPanel({
  transaction,
  onClose,
  onReanalyze,
  onMarkPersonal,
  taxRate = 0.24,
}: TransactionDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const amount = Math.abs(Number(transaction.amount));
  const deductionPct = transaction.deduction_percent ?? 100;
  const deductibleAmount = amount * deductionPct / 100;
  const confidence = transaction.ai_confidence != null ? Number(transaction.ai_confidence) : null;
  const confPct = confidence != null ? Math.round(confidence * 100) : null;

  const statusVariant = (s: string | null): "default" | "sage" | "amber" | "red" => {
    if (s === "completed" || s === "auto_sorted") return "sage";
    if (s === "pending") return "amber";
    if (s === "personal") return "red";
    return "default";
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-md bg-white border-l border-bg-tertiary/40 shadow-xl h-full overflow-y-auto animate-in"
        style={{ animation: "slideInRight 0.2s ease-out" }}
      >
        {/* Panel header */}
        <div className="sticky top-0 z-10 bg-white border-b border-bg-tertiary/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-mono-dark truncate">{transaction.vendor}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-bg-secondary flex items-center justify-center transition"
          >
            <span className="material-symbols-rounded text-[18px] text-mono-light">close</span>
          </button>
        </div>

        {/* Properties */}
        <div className="px-6 py-4">
          <PropertyRow label="Vendor">
            <span className="font-medium">{transaction.vendor}</span>
          </PropertyRow>

          <PropertyRow label="Date">
            {formatDate(transaction.date)}
          </PropertyRow>

          <PropertyRow label="Amount">
            <span className="font-semibold tabular-nums">${amount.toFixed(2)}</span>
          </PropertyRow>

          <PropertyRow label="Type">
            <Tag>{transaction.transaction_type === "income" ? "Income" : "Expense"}</Tag>
          </PropertyRow>

          <PropertyRow label="Status">
            <Tag variant={statusVariant(transaction.status)}>
              {transaction.status === "auto_sorted" ? "Auto-sorted" : (transaction.status ?? "Pending")}
            </Tag>
          </PropertyRow>

          <PropertyRow label="Category">
            {transaction.category ? (
              <Tag variant="sage">{transaction.category}</Tag>
            ) : (
              <span className="text-mono-light text-xs">Uncategorized</span>
            )}
          </PropertyRow>

          {transaction.schedule_c_line && (
            <PropertyRow label="Schedule C Line">
              <span className="text-xs">{transaction.schedule_c_line}</span>
            </PropertyRow>
          )}

          <PropertyRow label="Deduction">
            <div>
              <span className="font-semibold tabular-nums">{deductionPct}%</span>
              <span className="text-xs text-mono-light ml-2">
                (${deductibleAmount.toFixed(2)} deductible, saves ~${(deductibleAmount * taxRate).toFixed(2)})
              </span>
            </div>
          </PropertyRow>

          {confPct != null && (
            <PropertyRow label="AI Confidence">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-sage transition-all"
                    style={{ width: `${confPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums">{confPct}%</span>
              </div>
            </PropertyRow>
          )}

          {transaction.ai_reasoning && (
            <PropertyRow label="AI Reasoning">
              <p className="text-xs text-mono-medium leading-relaxed">{transaction.ai_reasoning}</p>
            </PropertyRow>
          )}

          {transaction.business_purpose && (
            <PropertyRow label="Business Purpose">
              <p className="text-xs">{transaction.business_purpose}</p>
            </PropertyRow>
          )}

          {transaction.quick_label && (
            <PropertyRow label="Label">
              <Tag variant="sage">{transaction.quick_label}</Tag>
            </PropertyRow>
          )}

          {transaction.description && (
            <PropertyRow label="Description">
              <p className="text-xs text-mono-medium">{transaction.description}</p>
            </PropertyRow>
          )}

          {transaction.notes && (
            <PropertyRow label="Notes">
              <p className="text-xs text-mono-medium">{transaction.notes}</p>
            </PropertyRow>
          )}

          <PropertyRow label="Source">
            <span className="text-xs text-mono-medium">{transaction.source ?? "CSV Upload"}</span>
          </PropertyRow>

          {transaction.vendor_normalized && (
            <PropertyRow label="Vendor Key">
              <span className="text-xs text-mono-light font-mono">{transaction.vendor_normalized}</span>
            </PropertyRow>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-bg-tertiary/20 space-y-2">
          {onReanalyze && (
            <button
              type="button"
              onClick={() => onReanalyze(transaction.id)}
              className="w-full flex items-center gap-2.5 rounded-lg border border-bg-tertiary px-4 py-2.5 text-xs font-medium text-mono-medium hover:bg-bg-secondary transition"
            >
              <span className="material-symbols-rounded text-[16px]">auto_awesome</span>
              Re-analyze with AI
            </button>
          )}
          {onMarkPersonal && (
            <button
              type="button"
              onClick={onMarkPersonal}
              className="w-full flex items-center gap-2.5 rounded-lg border border-bg-tertiary px-4 py-2.5 text-xs font-medium text-mono-light hover:text-mono-dark hover:bg-bg-secondary transition"
            >
              <span className="material-symbols-rounded text-[16px]">person_off</span>
              Mark as personal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
