import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/get-current-user";
import { LandingPage } from "./LandingPage";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (userId) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
