"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import type { Subject } from "@/lib/papers/types";

export default function PapersFilters({
  subjects,
  years,
}: {
  subjects: Subject[];
  years: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", search);
  }

  const activeSubject = searchParams.get("subject") ?? "";
  const activeYear = searchParams.get("year") ?? "";
  const activePaperNumber = searchParams.get("paper") ?? "";
  const hasActiveFilters = activeSubject || activeYear || activePaperNumber || searchParams.get("q");

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearchSubmit} className="relative" role="search">
        <label htmlFor="paper-search" className="sr-only">Search papers</label>
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate" aria-hidden="true" />
        <input
          id="paper-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search papers by title…"
          className="tap-target w-full rounded-card border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm focus-visible:outline-marker-green"
        />
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter papers">
        <select
          aria-label="Filter by subject"
          value={activeSubject}
          onChange={(e) => updateParam("subject", e.target.value)}
          className="tap-target shrink-0 rounded-chip border border-ink/15 bg-white px-3 text-sm"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter by year"
          value={activeYear}
          onChange={(e) => updateParam("year", e.target.value)}
          className="tap-target shrink-0 rounded-chip border border-ink/15 bg-white px-3 text-sm"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          aria-label="Filter by paper number"
          value={activePaperNumber}
          onChange={(e) => updateParam("paper", e.target.value)}
          className="tap-target shrink-0 rounded-chip border border-ink/15 bg-white px-3 text-sm"
        >
          <option value="">All papers</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>Paper {n}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              startTransition(() => router.push(pathname));
            }}
            className="tap-target flex shrink-0 items-center gap-1 rounded-chip bg-chalk-dim px-3 text-sm font-medium text-ink"
          >
            <X size={14} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {isPending ? "Updating results…" : ""}
      </p>
    </div>
  );
}
