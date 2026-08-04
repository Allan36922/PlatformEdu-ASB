import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 p-4">
      <Link href="/" className="text-xl font-bold tracking-tight">
        EduPlatform
      </Link>
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
