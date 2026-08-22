"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, PencilLine, MessageCircle, User } from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/papers", label: "Papers", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: PencilLine },
  { href: "/discuss", label: "Discuss", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "tap-target flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                  active ? "text-marker-green" : "text-slate hover:text-ink"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
