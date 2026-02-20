import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/get-current-user";
import { DataSourcesClient } from "./DataSourcesClient";

export default async function DataSourcesPage() {
  const authClient = await createSupabaseServerClient();
  const userId = await getCurrentUserId(authClient);

  if (!userId) redirect("/login");

  const supabase = authClient;

  const { data: sources } = await (supabase as any)
    .from("data_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return <DataSourcesClient initialSources={sources ?? []} />;
}
