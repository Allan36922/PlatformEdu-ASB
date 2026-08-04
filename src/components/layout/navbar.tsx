import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null; role: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          EduPlatform
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/cursos" className="text-muted-foreground transition-colors hover:text-foreground">
            Explorar cursos
          </Link>
          {profile?.role === "instructor" && (
            <Link
              href="/instructor"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Panel de instructor
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user && profile ? (
            <UserMenu fullName={profile.full_name} avatarUrl={profile.avatar_url} role={profile.role} />
          ) : (
            <>
              <Button variant="ghost" render={<Link href="/login">Iniciar sesión</Link>} />
              <Button render={<Link href="/signup">Registrarse</Link>} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
