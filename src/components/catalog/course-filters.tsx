"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courseCategories } from "@/lib/validations/course";

const LEVELS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

const SORTS = [
  { value: "popular", label: "Más populares" },
  { value: "newest", label: "Más recientes" },
  { value: "rating", label: "Mejor valorados" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

const RATINGS = [
  { value: "4.5", label: "4.5 y más" },
  { value: "4", label: "4.0 y más" },
  { value: "3", label: "3.0 y más" },
];

export function CourseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParam("search", search || null);
      }
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
      <div className="relative flex-1 lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cursos..."
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get("category") ?? "all"}
        onValueChange={(value) => updateParam("category", value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full lg:w-48">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {courseCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("level") ?? "all"}
        onValueChange={(value) => updateParam("level", value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue placeholder="Nivel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los niveles</SelectItem>
          {LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("minRating") ?? "all"}
        onValueChange={(value) => updateParam("minRating", value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue placeholder="Valoración" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Cualquier valoración</SelectItem>
          {RATINGS.map((rating) => (
            <SelectItem key={rating.value} value={rating.value}>
              {rating.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") ?? "popular"}
        onValueChange={(value) => updateParam("sort", value === "popular" ? null : value)}
      >
        <SelectTrigger className="w-full lg:w-52">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          {SORTS.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
