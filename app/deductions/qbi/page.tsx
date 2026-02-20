import Link from "next/link";

export default function QBIPage() {
  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold text-mono-dark mb-2">QBI Deduction</h1>
        <p className="text-mono-medium text-sm">
          Qualified business income deduction (Section 199A)
        </p>
      </div>
      <div className="card p-6">
        <p className="text-mono-medium mb-4">
          QBI calculator coming soon. Use your tax preparer or tax software for
          this deduction.
        </p>
        <Link href="/deductions" className="btn-secondary text-sm">
          ← Back to Deductions
        </Link>
      </div>
    </div>
  );
}
