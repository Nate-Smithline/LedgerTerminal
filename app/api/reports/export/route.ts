import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { rateLimitForRequest, expensiveOpLimit } from "@/lib/middleware/rate-limit";

type TxRecord = Record<string, unknown> & { is_meal?: boolean; is_travel?: boolean; amount: string };

function deductibleAmount(t: TxRecord): number {
  const amt = Number(t.amount);
  if (t.is_travel) return amt;
  return t.is_meal ? amt * 0.5 : amt;
}

export async function GET(req: Request) {
  const authClient = await createSupabaseRouteClient();
  const auth = await requireAuth(authClient);
  if (!auth.authorized) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const userId = auth.userId;
  const { success: rlOk } = await rateLimitForRequest(req, userId, expensiveOpLimit);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  const supabase = authClient;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format"); // "csv" | "pdf"
  const taxYearParam = searchParams.get("tax_year");
  const taxYear = taxYearParam ? parseInt(taxYearParam, 10) : new Date().getFullYear();
  const typeFilter = searchParams.get("type"); // "expense" | "income" | empty = all

  const txCols = "transaction_type,date,vendor,amount,category,schedule_c_line,business_purpose,notes,is_meal,is_travel";
  let txQuery = (supabase as any)
    .from("transactions")
    .select(txCols)
    .eq("user_id", userId)
    .eq("tax_year", taxYear)
    .in("status", ["completed", "auto_sorted"])
    .order("date", { ascending: false });
  if (typeFilter === "expense" || typeFilter === "income") {
    txQuery = txQuery.eq("transaction_type", typeFilter);
  }
  const { data: transactions } = await txQuery;

  const deductionCols = "type,amount,tax_savings";
  const { data: deductions } = await (supabase as any)
    .from("deductions")
    .select(deductionCols)
    .eq("user_id", userId)
    .eq("tax_year", taxYear);

  if (format === "csv") {
    const headers = [
      "Type",
      "Date",
      "Vendor",
      "Amount",
      "Category",
      "Schedule C Line",
      "Business Purpose",
      "Notes",
    ];
    const rows = (transactions ?? []).map((t: Record<string, unknown>) => [
      (t.transaction_type as string) ?? "expense",
      t.date,
      t.vendor,
      t.amount,
      t.category ?? "",
      t.schedule_c_line ?? "",
      t.business_purpose ?? "",
      t.notes ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${taxYear}.csv"`,
      },
    });
  }

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(`${taxYear} Tax Summary`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Expenses & income — generated for your records`, 20, 28);

    const tableData = (transactions ?? []).map((t: TxRecord) => [
      String((t.transaction_type as string) ?? "expense").slice(0, 8),
      String(t.date),
      String(t.vendor).slice(0, 22),
      `$${Number(t.amount).toFixed(2)}`,
      String(t.category ?? "").slice(0, 12),
      String(t.business_purpose ?? "").slice(0, 25),
    ]);

    autoTable(doc, {
      startY: 36,
      head: [["Type", "Date", "Vendor", "Amount", "Category", "Purpose"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [63, 81, 71] },
    });

    const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    const finalY = lastTable?.finalY ?? 36;
    doc.setFontSize(12);
    doc.text("Additional Deductions", 20, finalY + 15);
    (deductions ?? []).forEach((d: { type: string; amount: string; tax_savings: string }, i: number) => {
      doc.setFontSize(10);
      doc.text(
        `${d.type}: $${Number(d.amount).toFixed(2)} (saves $${Number(d.tax_savings).toFixed(2)})`,
        20,
        finalY + 22 + i * 6
      );
    });

    const buf = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tax-deductions-${taxYear}.pdf"`,
      },
    });
  }

  return NextResponse.json(
    { error: "Use ?format=csv or ?format=pdf" },
    { status: 400 }
  );
}
