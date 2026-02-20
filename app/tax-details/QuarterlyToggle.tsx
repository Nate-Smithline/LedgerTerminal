"use client";

interface QuarterlyToggleProps {
  value: number | null;
  onChange: (quarter: number | null) => void;
}

const QUARTERS = [
  { value: null, label: "Full Year" },
  { value: 1, label: "Q1", sub: "Jan – Mar" },
  { value: 2, label: "Q2", sub: "Apr – Jun" },
  { value: 3, label: "Q3", sub: "Jul – Sep" },
  { value: 4, label: "Q4", sub: "Oct – Dec" },
];

export function QuarterlyToggle({ value, onChange }: QuarterlyToggleProps) {
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  return (
    <div className="flex items-center gap-1.5">
      {QUARTERS.map((q) => {
        const isActive = value === q.value;
        const isCurrent = q.value === currentQuarter;
        return (
          <button
            key={q.label}
            onClick={() => onChange(q.value)}
            className={`btn-pill relative ${isActive ? "selected" : ""}`}
          >
            {q.label}
            {isCurrent && !isActive && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent-terracotta" />
            )}
          </button>
        );
      })}
    </div>
  );
}
