import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "instructor" && profile?.role !== "admin") redirect("/estudiante");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-8 flex gap-6 border-b text-sm font-medium">
        <Link href="/instructor" className="border-b-2 border-transparent pb-3 hover:border-foreground">
          Panel
        </Link>
        <Link
          href="/instructor/cursos"
          className="border-b-2 border-transparent pb-3 hover:border-foreground"
        >
          Mis cursos
        </Link>
      </nav>
      {children}
    </div>
  );
}
