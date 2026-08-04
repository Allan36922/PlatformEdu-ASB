import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} EduPlatform. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <Link href="/cursos" className="hover:text-foreground">
            Explorar cursos
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Enseña en EduPlatform
          </Link>
        </div>
      </div>
    </footer>
  );
}
