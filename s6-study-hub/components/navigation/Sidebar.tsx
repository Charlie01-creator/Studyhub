"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, PencilLine, MessageCircle, User, Calendar, Layers, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/papers", label: "Past Papers", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: PencilLine },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/discuss", label: "Discuss", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-ink/10 bg-white md:flex md:flex-col">
      <div className="px-5 py-6">
        <span className="font-display text-lg font-semibold text-ink">S6 Study Hub</span>
        <p className="mt-0.5 text-xs text-slate">UACE 2026</p>
      </div>
      <nav aria-label="Primary" className="flex-1 px-3">
        <ul className="space-y-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-marker-green-soft text-marker-green" : "text-slate hover:bg-chalk-dim hover:text-ink"
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
          {isAdmin && (
            <li className="mt-4 border-t border-ink/10 pt-4">
              <Link
                href="/admin/papers"
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin") ? "bg-marker-amber-soft text-[#8A5A00]" : "text-slate hover:bg-chalk-dim hover:text-ink"
                )}
              >
                <ShieldCheck size={18} aria-hidden="true" />
                Admin: Papers
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
