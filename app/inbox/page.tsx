import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/get-current-user";
import type { Database } from "@/lib/types/database";
import { InboxPageClient } from "./InboxPageClient";

type Transaction =
  Database["public"]["Tables"]["transactions"]["Row"];

export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) redirect("/login");

  const currentYear = new Date().getFullYear();
  const db = supabase;

  const { data: transactions } = await (db as any)
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("tax_year", currentYear)
    .eq("status", "pending")
    .eq("transaction_type", "expense")
    .order("date", { ascending: false })
    .limit(20);

  const { count: pendingCount } = await (db as any)
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tax_year", currentYear)
    .eq("status", "pending")
    .eq("transaction_type", "expense");

  // Fetch user's tax rate for this year
  const { data: taxYearRow } = await (db as any)
    .from("tax_year_settings")
    .select("tax_rate")
    .eq("user_id", userId)
    .eq("tax_year", currentYear)
    .single();

  const taxRate = taxYearRow ? Number(taxYearRow.tax_rate) : 0.24;

  return (
    <InboxPageClient
      initialYear={currentYear}
      initialPendingCount={pendingCount ?? 0}
      initialTransactions={transactions ?? []}
      userId={userId}
      taxRate={taxRate}
    />
  );
}

