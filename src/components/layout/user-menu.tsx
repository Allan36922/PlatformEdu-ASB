"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";

interface UserMenuProps {
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
}

export function UserMenu({ fullName, avatarUrl, role }: UserMenuProps) {
  const dashboardHref = role === "instructor" ? "/instructor" : "/estudiante";
  const initials = (fullName ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="rounded-full" aria-label="Menú de usuario">
            <Avatar>
              <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? "Usuario"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="truncate px-2 py-1.5 text-sm font-medium">{fullName ?? "Mi cuenta"}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href={dashboardHref}>
              <LayoutDashboard className="mr-2 size-4" /> Mi panel
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link href="/perfil">
              <UserIcon className="mr-2 size-4" /> Editar perfil
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <form action={signOutAction} className="w-full">
          <button
            type="submit"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <LogOut className="mr-2 size-4" /> Cerrar sesión
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
