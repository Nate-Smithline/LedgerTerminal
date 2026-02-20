import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/get-current-user";
import { ActivityPageClient } from "./ActivityPageClient";

export default async function ActivityPage() {
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
    .order("date", { ascending: false })
    .limit(100);

  const { count: totalCount } = await (db as any)
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tax_year", currentYear);

  return (
    <ActivityPageClient
      initialTransactions={transactions ?? []}
      initialTotalCount={totalCount ?? 0}
      initialYear={currentYear}
      userId={userId}
    />
  );
}
