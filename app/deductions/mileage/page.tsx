import Link from "next/link";

export default function MileagePage() {
  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold text-mono-dark mb-2">
          Mileage Deduction
        </h1>
        <p className="text-mono-medium text-sm">
          Business mileage at IRS rate (e.g. $0.67/mile)
        </p>
      </div>
      <div className="card p-6">
        <p className="text-mono-medium mb-4">
          Mileage calculator coming soon. Track miles and multiply by the
          current IRS business rate.
        </p>
        <Link href="/deductions" className="btn-secondary text-sm">
          ← Back to Deductions
        </Link>
      </div>
    </div>
  );
}
