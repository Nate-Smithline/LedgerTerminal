"use client";

import { useState } from "react";

interface PdfExportModalProps {
  open: boolean;
  onClose: () => void;
  taxYear: number;
  quarter: number | null;
  filingType: string | null;
}

export function PdfExportModal({
  open,
  onClose,
  taxYear,
  quarter,
  filingType,
}: PdfExportModalProps) {
  const [includeScheduleC, setIncludeScheduleC] = useState(true);
  const [includeScheduleSE, setIncludeScheduleSE] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isScheduleCFiler =
    !filingType ||
    filingType === "sole_proprietor" ||
    filingType === "Sole Proprietor" ||
    filingType === "single_llc" ||
    filingType === "Single-member LLC";

  function handleDownload() {
    setLoading(true);
    const params = new URLSearchParams({
      format: "pdf",
      tax_year: String(taxYear),
    });
    if (quarter) params.set("quarter", String(quarter));
    if (includeScheduleC) params.set("schedule_c", "true");
    if (includeScheduleSE) params.set("schedule_se", "true");
    if (includeCategories) params.set("categories", "true");

    window.open(`/api/reports/export?${params.toString()}`, "_blank");
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative card p-8 w-full max-w-md animate-in mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-mono-dark">Generate PDF</h2>
          <button
            onClick={onClose}
            className="text-mono-light hover:text-mono-medium transition-colors"
          >
            <span className="material-symbols-rounded text-[20px]">close</span>
          </button>
        </div>

        <p className="text-sm text-mono-medium mb-6">
          Select which sections to include in your {taxYear}
          {quarter ? ` Q${quarter}` : ""} tax report.
        </p>

        <div className="space-y-3 mb-8">
          {isScheduleCFiler && (
            <>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-bg-secondary/60 transition-colors">
                <input
                  type="checkbox"
                  checked={includeScheduleC}
                  onChange={(e) => setIncludeScheduleC(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent-sage"
                />
                <div>
                  <p className="text-sm font-medium text-mono-dark">Schedule C Summary</p>
                  <p className="text-xs text-mono-light">Line-by-line expense breakdown</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-bg-secondary/60 transition-colors">
                <input
                  type="checkbox"
                  checked={includeScheduleSE}
                  onChange={(e) => setIncludeScheduleSE(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent-sage"
                />
                <div>
                  <p className="text-sm font-medium text-mono-dark">Schedule SE</p>
                  <p className="text-xs text-mono-light">Self-employment tax calculation</p>
                </div>
              </label>
            </>
          )}

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-bg-secondary/60 transition-colors">
            <input
              type="checkbox"
              checked={includeCategories}
              onChange={(e) => setIncludeCategories(e.target.checked)}
              className="w-4 h-4 rounded accent-accent-sage"
            />
            <div>
              <p className="text-sm font-medium text-mono-dark">Category Breakout</p>
              <p className="text-xs text-mono-light">Expense distribution by category</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
