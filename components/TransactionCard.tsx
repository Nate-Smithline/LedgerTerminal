"use client";

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { Database } from "@/lib/types/database";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export interface TransactionUpdate {
  quick_label?: string;
  business_purpose?: string;
  notes?: string;
  deduction_percent?: number;
}

interface TransactionCardProps {
  transaction: Transaction;
  onSave: (data: TransactionUpdate) => Promise<void>;
  onMarkPersonal: () => Promise<void>;
  onCheckSimilar: (vendor: string, excludeId: string) => Promise<Transaction[]>;
  onApplyToAllSimilar: (transaction: Transaction, data: TransactionUpdate) => Promise<void>;
  onReanalyze?: (id: string) => Promise<void>;
  onOpenManage?: (transaction: Transaction) => void;
  isActive?: boolean;
  onFocus?: () => void;
  taxRate?: number;
}

export interface TransactionCardRef {
  selectLabel: (index: number) => void;
  markPersonal: () => void;
  focusBusiness: () => void;
  save: () => void;
  cycleDeduction: () => void;
  expand: () => void;
  nextStep: () => void;
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const SNAP_POINTS = [0, 25, 50, 75, 100];

export const TransactionCard = forwardRef<TransactionCardRef, TransactionCardProps>(
  function TransactionCard(
    { transaction, onSave, onMarkPersonal, onCheckSimilar, onApplyToAllSimilar, onReanalyze, onOpenManage, isActive, onFocus, taxRate = 0.24 },
    ref,
  ) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedLabel, setSelectedLabel] = useState(transaction.quick_label ?? "");
    const [businessPurpose, setBusinessPurpose] = useState(transaction.business_purpose ?? "");
    const [notes, setNotes] = useState(transaction.notes ?? "");
    const [deductionPct, setDeductionPct] = useState(
      transaction.deduction_percent ?? 100
    );
    const [saving, setSaving] = useState(false);
    const [approved, setApproved] = useState(false);
    const [closingIn, setClosingIn] = useState(5);
    const [showWriteIn, setShowWriteIn] = useState(false);
    const [similarTransactions, setSimilarTransactions] = useState<Transaction[]>([]);
    const [autoSort, setAutoSort] = useState(false);
    const [useAiEstimate, setUseAiEstimate] = useState(true);

    const businessRef = useRef<HTMLTextAreaElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const suggestions: string[] = Array.isArray(transaction.ai_suggestions)
      ? (transaction.ai_suggestions as string[])
      : [];

    const isMeal = transaction.is_meal || (transaction.category?.toLowerCase().includes("meal") ?? false);
    const isTravel = transaction.is_travel ?? false;
    const confidence = transaction.ai_confidence != null ? Number(transaction.ai_confidence) : null;
    const confPct = confidence != null ? Math.round(confidence * 100) : null;
    const hasCachedPattern = transaction.vendor_normalized != null;
    const amount = Math.abs(Number(transaction.amount));
    const deductibleAmount = (amount * deductionPct / 100);

    useEffect(() => {
      onCheckSimilar(transaction.vendor, transaction.id).then((list) => {
        setSimilarTransactions(list ?? []);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (isMeal && !isTravel && transaction.deduction_percent === null) {
        setDeductionPct(50);
      }
    }, [isMeal, isTravel, transaction.deduction_percent]);

    useImperativeHandle(ref, () => ({
      selectLabel(index: number) {
        if (step === 2) {
          const allLabels = [...suggestions.filter((s) => s !== "Personal"), "Personal"];
          if (index < allLabels.length) {
            handleQuickAction(allLabels[index]);
          }
        }
      },
      markPersonal() { handleQuickAction("Personal"); },
      focusBusiness() {
        if (step === 1) setStep(2);
        setShowWriteIn(true);
        setTimeout(() => businessRef.current?.focus(), 50);
      },
      save() { handleNext(); },
      nextStep() { handleNext(); },
      cycleDeduction() {
        setDeductionPct((prev) => {
          const idx = SNAP_POINTS.indexOf(prev);
          return SNAP_POINTS[(idx + 1) % SNAP_POINTS.length];
        });
      },
      expand() {
        if (onOpenManage) onOpenManage(transaction);
      },
    }));

    const handleQuickAction = useCallback(
      (label: string) => {
        setSelectedLabel(label);
        if (!businessPurpose && label !== "Personal") {
          setBusinessPurpose(`${label} expense`);
        }
        if (label === "Personal") {
          setDeductionPct(0);
        }
      },
      [businessPurpose],
    );

    const saveData: TransactionUpdate = {
      quick_label: selectedLabel,
      business_purpose: selectedLabel === "Personal" ? "" : businessPurpose,
      notes,
      deduction_percent: deductionPct,
    };

    function handleNext() {
      if (step === 1) {
        setStep(2);
        return;
      }
      handleApprove();
    }

    async function handleApprove() {
      if (!selectedLabel && !businessPurpose && deductionPct === 100) {
        return;
      }
      setSaving(true);
      setApproved(true);

      let count = 5;
      setClosingIn(count);
      const timer = setInterval(() => {
        count--;
        setClosingIn(count);
        if (count <= 0) clearInterval(timer);
      }, 1000);

      setTimeout(async () => {
        clearInterval(timer);
        if (autoSort && similarTransactions.length > 0) {
          await onApplyToAllSimilar(transaction, saveData);
        }
        await onSave(saveData);
        setSaving(false);
      }, 1500);
    }

    async function handleMarkPersonalClick() {
      setSaving(true);
      await onMarkPersonal();
      setSaving(false);
    }

    useEffect(() => {
      if (isActive && cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [isActive]);

    if (approved) {
      return (
        <div
          ref={cardRef}
          className="card bg-accent-sage text-white px-6 py-5 animate-in"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{transaction.vendor}</p>
              <p className="text-xs text-white/70">{transaction.category ?? "Uncategorized"}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              -${amount.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-white/80 mt-3">
            Saved. Closing in {closingIn}
          </p>
        </div>
      );
    }

    return (
      <div
        ref={cardRef}
        onClick={() => onFocus?.()}
        className={`card transition-all duration-200 ${
          isActive
            ? "ring-1 ring-accent-sage/20 shadow-md px-6 py-5"
            : "opacity-50 hover:opacity-75 px-6 py-4 cursor-pointer"
        }`}
      >
        {/* Header: vendor name + category + amount */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-mono-dark">{transaction.vendor}</p>
              <span className="text-[11px] text-mono-light">{formatDate(transaction.date)}</span>
            </div>
            <p className="text-xs text-mono-light mt-0.5">
              {transaction.category ?? "Uncategorized"}
              {confPct != null && (
                <span className="ml-1.5 text-mono-light/50">{confPct}%</span>
              )}
            </p>
          </div>
          <span className="text-sm font-semibold text-mono-dark tabular-nums shrink-0">
            -${amount.toFixed(2)}
          </span>
        </div>

        {/* Only show full content for active card */}
        {!isActive && (
          <div className="mt-2 text-[11px] text-mono-light">
            Click to review
          </div>
        )}

        {isActive && (
          <div className="mt-4">
            {/* Previous Rule / AI Estimate toggle */}
            {hasCachedPattern && onReanalyze && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUseAiEstimate(false)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                    !useAiEstimate
                      ? "border-accent-sage bg-accent-sage/10 text-accent-sage"
                      : "border-bg-tertiary bg-white text-mono-light hover:text-mono-medium"
                  }`}
                >
                  Previous Rule
                </button>
                <button
                  type="button"
                  onClick={() => { setUseAiEstimate(true); onReanalyze(transaction.id); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                    useAiEstimate
                      ? "border-accent-sage bg-accent-sage/10 text-accent-sage"
                      : "border-bg-tertiary bg-white text-mono-light hover:text-mono-medium"
                  }`}
                >
                  AI Estimate
                </button>
              </div>
            )}

            {/* Meal cap warning */}
            {isMeal && !isTravel && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200/60 px-3.5 py-2.5 mb-4">
                <span className="text-amber-600 text-sm mt-0.5">!</span>
                <p className="text-xs text-amber-800">
                  Meals outside of travel are typically capped at 50%.
                </p>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= 1 ? "bg-accent-sage" : "bg-bg-tertiary"
              }`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= 2 ? "bg-accent-sage" : "bg-bg-tertiary"
              }`} />
            </div>

            {/* STEP 1: Deduction Amount */}
            {step === 1 && (
              <div className="space-y-4 animate-in">
                <div>
                  <p className="text-xs font-medium text-mono-medium mb-2">
                    What percent of this was for business?
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    {SNAP_POINTS.map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setDeductionPct(pt)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium border transition ${
                          deductionPct === pt
                            ? "border-accent-sage bg-accent-sage text-white"
                            : "border-bg-tertiary bg-white text-mono-medium hover:border-accent-sage/40"
                        }`}
                      >
                        {pt}%
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={deductionPct}
                      onChange={(e) => setDeductionPct(Number(e.target.value))}
                      className="flex-1 h-1.5 accent-accent-sage cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-mono-dark tabular-nums w-12 text-right">
                      {deductionPct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-mono-light mt-1.5">
                    ${deductibleAmount.toFixed(2)} deductible
                    <span className="ml-1">(saves ~${(deductibleAmount * taxRate).toFixed(2)})</span>
                  </p>
                </div>

                {/* Auto-sort checkbox */}
                {similarTransactions.length > 0 && (
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={autoSort}
                      onChange={(e) => setAutoSort(e.target.checked)}
                      className="h-4 w-4 rounded border-bg-tertiary text-accent-sage focus:ring-accent-sage/30"
                    />
                    <span className="text-xs text-mono-medium group-hover:text-mono-dark transition">
                      Also apply to {similarTransactions.length} other{similarTransactions.length === 1 ? "" : "s"} from {transaction.vendor}
                    </span>
                  </label>
                )}

                {/* Next button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent-sage/5 border border-accent-sage/20 px-4 py-2.5 text-xs font-medium text-accent-sage hover:bg-accent-sage/10 transition"
                  >
                    Next
                    <kbd className="kbd-hint ml-1">s</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenManage?.(transaction)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-white border border-bg-tertiary px-3 py-2.5 text-xs font-medium text-mono-medium hover:bg-bg-secondary transition"
                    title="View details"
                  >
                    <span className="material-symbols-rounded text-[16px]">open_in_new</span>
                    <kbd className="kbd-hint">Enter</kbd>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Reason / Label */}
            {step === 2 && (
              <div className="space-y-4 animate-in">
                {/* Quick label suggestions with keyboard hints */}
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-mono-medium mb-2">
                      Select a reason
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleQuickAction(s)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition flex items-center gap-1.5 ${
                            selectedLabel === s
                              ? "border-accent-sage bg-accent-sage text-white"
                              : "border-bg-tertiary bg-white text-mono-medium hover:border-accent-sage/40"
                          }`}
                        >
                          <kbd className={`kbd-hint ${selectedLabel === s ? "!bg-white/20 !text-white !border-white/30" : ""}`}>{i + 1}</kbd>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual write-in */}
                {!showWriteIn ? (
                  <button
                    type="button"
                    onClick={() => { setShowWriteIn(true); setTimeout(() => businessRef.current?.focus(), 50); }}
                    className="flex items-center gap-2 text-xs text-mono-light hover:text-mono-medium transition"
                  >
                    <kbd className="kbd-hint">w</kbd>
                    Click here to manually write in...
                  </button>
                ) : (
                  <div>
                    <textarea
                      ref={businessRef}
                      value={businessPurpose}
                      onChange={(e) => setBusinessPurpose(e.target.value)}
                      placeholder="Write your business purpose..."
                      className="w-full border border-bg-tertiary rounded-lg p-3 text-xs bg-white focus:ring-1 focus:ring-accent-sage/30 focus:border-accent-sage/40 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                )}

                {/* Auto-sort checkbox (carried forward) */}
                {similarTransactions.length > 0 && (
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={autoSort}
                      onChange={(e) => setAutoSort(e.target.checked)}
                      className="h-4 w-4 rounded border-bg-tertiary text-accent-sage focus:ring-accent-sage/30"
                    />
                    <span className="text-xs text-mono-medium group-hover:text-mono-dark transition">
                      Also apply to {similarTransactions.length} other{similarTransactions.length === 1 ? "" : "s"} from {transaction.vendor}
                    </span>
                  </label>
                )}

                {/* Action row */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-white border border-bg-tertiary px-3 py-2.5 text-xs font-medium text-mono-medium hover:bg-bg-secondary transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={saving || (!selectedLabel && !businessPurpose)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent-sage px-4 py-2.5 text-xs font-medium text-white hover:bg-accent-sage/90 transition disabled:opacity-40"
                  >
                    Next
                    <kbd className="kbd-hint !bg-white/20 !text-white !border-white/30 ml-1">s</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkPersonalClick}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-white border border-bg-tertiary px-3 py-2.5 text-xs font-medium text-mono-light hover:text-mono-dark hover:bg-bg-secondary transition"
                    title="Mark as personal"
                  >
                    <kbd className="kbd-hint">p</kbd>
                    Personal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);
