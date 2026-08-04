import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>;
}
