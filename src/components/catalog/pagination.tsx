import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CoursePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
}

export function CoursePagination({ page, pageSize, total, searchParams }: CoursePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Button variant="outline" size="sm" render={<Link href={hrefFor(page - 1)}>Anterior</Link>} />
      ) : (
        <Button variant="outline" size="sm" disabled>
          Anterior
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Button variant="outline" size="sm" render={<Link href={hrefFor(page + 1)}>Siguiente</Link>} />
      ) : (
        <Button variant="outline" size="sm" disabled>
          Siguiente
        </Button>
      )}
    </div>
  );
}
