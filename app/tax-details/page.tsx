import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/get-current-user";
import { TaxDetailsClient } from "./TaxDetailsClient";

export default async function TaxDetailsPage() {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) redirect("/login");

  const currentYear = new Date().getFullYear();

  return <TaxDetailsClient defaultYear={currentYear} />;
}
