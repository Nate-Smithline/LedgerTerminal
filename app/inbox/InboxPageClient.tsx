"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Database } from "@/lib/types/database";
import { normalizeVendor } from "@/lib/vendor-matching";
import { UploadModal } from "@/components/UploadModal";
import { TransactionCard } from "@/components/TransactionCard";
import type { TransactionUpdate, TransactionCardRef } from "@/components/TransactionCard";
import { TransactionDetailPanel } from "@/components/TransactionDetailPanel";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface InboxPageClientProps {
  initialYear: number;
  initialPendingCount: number;
  initialTransactions: Transaction[];
  userId: string;
  taxRate?: number;
}

async function fetchTransactions(params: Record<string, string>): Promise<Transaction[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/transactions?${qs}`);
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

async function fetchCount(params: Record<string, string>): Promise<number> {
  const qs = new URLSearchParams({ ...params, count_only: "true" }).toString();
  const res = await fetch(`/api/transactions?${qs}`);
  if (!res.ok) return 0;
  const body = await res.json();
  return body.count ?? 0;
}

export function InboxPageClient({
  initialYear,
  initialPendingCount,
  initialTransactions,
  userId,
  taxRate = 0.24,
}: InboxPageClientProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [manageTx, setManageTx] = useState<Transaction | null>(null);

  const [aiProgress, setAiProgress] = useState<{ completed: number; total: number; current: string } | null>(null);

  const cardRefs = useRef<Map<string, TransactionCardRef>>(new Map());

  const reloadInbox = useCallback(async () => {
    const [txs, count] = await Promise.all([
      fetchTransactions({
        tax_year: String(selectedYear),
        status: "pending",
        transaction_type: "expense",
        limit: "50",
      }),
      fetchCount({
        tax_year: String(selectedYear),
        status: "pending",
        transaction_type: "expense",
      }),
    ]);
    setTransactions(txs);
    setPendingCount(count);
  }, [selectedYear]);

  async function runBackgroundAI(txIds: string[]) {
    if (txIds.length === 0) return;
    setAiProgress({ completed: 0, total: txIds.length, current: "Starting..." });

    try {
      const res = await fetch("/api/transactions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: txIds }),
      });

      if (!res.ok) {
        setAiProgress(null);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line) as Record<string, unknown>;
              if (event.type === "progress") {
                setAiProgress({
                  completed: (event.completed as number) ?? 0,
                  total: (event.total as number) ?? txIds.length,
                  current: (event.current as string) ?? "",
                });
              } else if (event.type === "success") {
                setTransactions((prev) =>
                  prev.map((t) =>
                    t.id === event.id
                      ? {
                          ...t,
                          category: (event.category as string) ?? t.category,
                          schedule_c_line: (event.line as string) ?? t.schedule_c_line,
                          ai_confidence: (event.confidence as number) ?? t.ai_confidence,
                          ai_suggestions: (event.quickLabels as string[]) ?? t.ai_suggestions,
                          deduction_percent: (event.deductionPct as number) ?? t.deduction_percent,
                          is_meal: (event.isMeal as boolean) ?? t.is_meal,
                          is_travel: (event.isTravel as boolean) ?? t.is_travel,
                        }
                      : t,
                  ),
                );
              } else if (event.type === "done") {
                setAiProgress(null);
                const s = (event.successful as number) ?? 0;
                const c = (event.cachedCount as number) ?? 0;
                if (c > 0) {
                  setToast(`${s} categorized (${c} from cache)`);
                } else if (s > 0) {
                  setToast(`${s} categorized by AI`);
                }
                setTimeout(() => setToast(null), 4000);
                await reloadInbox();
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setAiProgress(null);
    }
  }

  async function handleReanalyze(id: string) {
    try {
      const res = await fetch("/api/transactions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: [id] }),
      });
      if (!res.ok) return;

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line) as Record<string, unknown>;
              if (event.type === "success") {
                setToast(`Categorized: ${event.category}`);
                setTimeout(() => setToast(null), 3000);
              }
              if (event.type === "done") await reloadInbox();
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setToast("Re-analysis failed");
      setTimeout(() => setToast(null), 3000);
    }
  }

  useEffect(() => {
    setLoading(true);
    reloadInbox().finally(() => setLoading(false));
  }, [reloadInbox]);

  async function handleSave(
    id: string,
    update: {
      quick_label?: string;
      business_purpose?: string;
      notes?: string;
      status?: "completed" | "personal";
      deduction_percent?: number;
    },
  ) {
    await fetch("/api/transactions/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...update }),
    });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setPendingCount((prev) => Math.max(prev - 1, 0));
  }

  async function handleMarkPersonal(id: string) {
    await handleSave(id, { status: "personal", deduction_percent: 0 });
  }

  const handleCheckSimilar = useCallback(
    async (vendor: string, excludeId: string): Promise<Transaction[]> => {
      return fetchTransactions({
        tax_year: String(selectedYear),
        status: "pending",
        transaction_type: "expense",
        vendor_normalized: normalizeVendor(vendor),
        exclude_id: excludeId,
      });
    },
    [selectedYear],
  );

  const handleApplyToAllSimilar = useCallback(
    async (transaction: Transaction, data: TransactionUpdate) => {
      const res = await fetch("/api/transactions/auto-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorNormalized: transaction.vendor_normalized ?? normalizeVendor(transaction.vendor),
          quickLabel: data.quick_label,
          businessPurpose: data.business_purpose,
          category: transaction.category ?? undefined,
          deductionPercent: data.deduction_percent,
          taxYear: selectedYear,
        }),
      });
      if (!res.ok) throw new Error("Failed to apply to all");
      const { updatedCount } = await res.json();
      setToast(`${updatedCount} transaction${updatedCount === 1 ? "" : "s"} auto-sorted`);
      setTimeout(() => setToast(null), 4000);
      await reloadInbox();
    },
    [selectedYear, reloadInbox],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const activeCard = transactions[activeIdx] ? cardRefs.current.get(transactions[activeIdx].id) : null;

      switch (e.key) {
        case "j":
          e.preventDefault();
          setActiveIdx((prev) => Math.min(prev + 1, transactions.length - 1));
          break;
        case "k":
          e.preventDefault();
          setActiveIdx((prev) => Math.max(prev - 1, 0));
          break;
        case "1": case "2": case "3": case "4":
          e.preventDefault();
          activeCard?.selectLabel(Number(e.key) - 1);
          break;
        case "p":
          e.preventDefault();
          activeCard?.markPersonal();
          break;
        case "w":
          e.preventDefault();
          activeCard?.focusBusiness();
          break;
        case "b":
          e.preventDefault();
          activeCard?.focusBusiness();
          break;
        case "s":
          e.preventDefault();
          activeCard?.save();
          break;
        case "d":
          e.preventDefault();
          activeCard?.cycleDeduction();
          break;
        case "u":
          e.preventDefault();
          setUploadOpen(true);
          break;
        case "Enter":
          e.preventDefault();
          activeCard?.expand();
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts((v) => !v);
          break;
        case "Escape":
          if (manageTx) {
            setManageTx(null);
          } else {
            setShowShortcuts(false);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIdx, transactions, manageTx]);

  useEffect(() => {
    if (activeIdx >= transactions.length && transactions.length > 0) {
      setActiveIdx(transactions.length - 1);
    }
  }, [transactions.length, activeIdx]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-mono-dark">Inbox</h1>
        <p className="text-sm text-mono-medium mt-1">
          {pendingCount} {pendingCount === 1 ? "item" : "items"} to review
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          className="bg-white border border-bg-tertiary/60 rounded-full px-4 py-2 text-sm text-mono-dark"
        >
          <option value={selectedYear}>{selectedYear}</option>
          <option value={selectedYear - 1}>{selectedYear - 1}</option>
          <option value={selectedYear - 2}>{selectedYear - 2}</option>
        </select>
        <button
          onClick={() => setUploadOpen(true)}
          className="btn-primary"
        >
          Upload CSV
        </button>
        <button
          onClick={() => setShowShortcuts((v) => !v)}
          className="btn-secondary text-xs"
          title="Keyboard shortcuts"
        >
          <kbd className="kbd-hint mr-1.5">?</kbd> Shortcuts
        </button>
      </div>

      {/* Background AI progress banner */}
      {aiProgress && (
        <div className="card px-5 py-3 flex items-center gap-4">
          <div className="h-2 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full bg-accent-sage transition-all duration-300"
              style={{ width: `${aiProgress.total > 0 ? Math.round((aiProgress.completed / aiProgress.total) * 100) : 0}%` }}
            />
          </div>
          <span className="text-xs text-accent-sage font-medium shrink-0 tabular-nums">
            AI: {aiProgress.completed}/{aiProgress.total}
          </span>
          <span className="text-xs text-mono-light truncate max-w-[200px]">{aiProgress.current}</span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="rounded-lg bg-accent-sage px-4 py-2.5 text-sm font-medium text-white">
          {toast}
        </div>
      )}

      {/* Keyboard shortcut overlay */}
      {showShortcuts && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-mono-dark">Keyboard Shortcuts</h3>
            <button onClick={() => setShowShortcuts(false)} className="text-xs text-mono-light hover:text-mono-dark">
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {[
              ["j / k", "Navigate up/down"],
              ["Enter", "Open detail panel"],
              ["1-4", "Select reason"],
              ["p", "Mark as personal"],
              ["w", "Write in purpose"],
              ["d", "Cycle deduction %"],
              ["s", "Next / Save"],
              ["u", "Upload CSV"],
              ["?", "Toggle this help"],
              ["Esc", "Close overlays"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-3 py-0.5">
                <kbd className="kbd-hint min-w-[2.5rem] text-center">
                  {key}
                </kbd>
                <span className="text-mono-medium">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      {loading && (
        <p className="text-sm text-mono-medium py-12 text-center">Loading transactions...</p>
      )}

      {!loading && transactions.length === 0 && (
        <div className="text-center py-20">
          <p className="text-base text-mono-medium mb-2">No pending transactions</p>
          <p className="text-sm text-mono-light">
            Upload a CSV to get started, or check All Activity for reviewed items.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {transactions.map((t, i) => (
          <TransactionCard
            key={t.id}
            ref={(el) => {
              if (el) cardRefs.current.set(t.id, el);
              else cardRefs.current.delete(t.id);
            }}
            transaction={t}
            isActive={i === activeIdx}
            onFocus={() => setActiveIdx(i)}
            taxRate={taxRate}
            onSave={async (data) =>
              handleSave(t.id, {
                quick_label: data.quick_label,
                business_purpose: data.business_purpose,
                notes: data.notes,
                status: data.quick_label === "Personal" ? "personal" : "completed",
                deduction_percent: data.deduction_percent,
              })
            }
            onMarkPersonal={async () => handleMarkPersonal(t.id)}
            onCheckSimilar={handleCheckSimilar}
            onApplyToAllSimilar={handleApplyToAllSimilar}
            onReanalyze={handleReanalyze}
            onOpenManage={(tx) => setManageTx(tx)}
          />
        ))}
      </div>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onCompleted={async (result) => {
            setUploadOpen(false);
            await reloadInbox();

            if (result?.transactionIds && result.transactionIds.length > 0) {
              runBackgroundAI(result.transactionIds);
            } else if (result) {
              let msg = `${result.imported ?? 0} imported`;
              if ((result.aiProcessed ?? 0) > 0) msg += `, ${result.aiProcessed} categorized`;
              setToast(msg);
              setTimeout(() => setToast(null), 4000);
            }
          }}
        />
      )}

      {/* Transaction Detail Panel (Notion-style sidebar) */}
      {manageTx && (
        <TransactionDetailPanel
          transaction={manageTx}
          onClose={() => setManageTx(null)}
          onReanalyze={handleReanalyze}
          onMarkPersonal={async () => {
            await handleMarkPersonal(manageTx.id);
            setManageTx(null);
          }}
          taxRate={taxRate}
        />
      )}
    </div>
  );
}
