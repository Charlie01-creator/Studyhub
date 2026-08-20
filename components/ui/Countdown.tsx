"use client";

import { useEffect, useState } from "react";

function daysUntil(examDateISO: string): number {
  const now = new Date();
  const exam = new Date(examDateISO);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / msPerDay));
}

/**
 * Scoreboard-style countdown — the mono digits evoke an exam-hall clock.
 * `examDateISO` and `isConfirmed` come from `exam_configuration`
 * (admin-editable). Until an admin has verified the real date against an
 * official UNEB timetable and set is_confirmed=true, this deliberately does
 * NOT show a specific day count — showing a plausible-looking number for an
 * unverified date risks students trusting it as official.
 */
export function Countdown({
  examDateISO,
  examLabel,
  isConfirmed,
}: {
  examDateISO: string | null;
  examLabel: string;
  isConfirmed: boolean;
}) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!examDateISO || !isConfirmed) return;
    setDays(daysUntil(examDateISO));
    const id = setInterval(() => setDays(daysUntil(examDateISO)), 1000 * 60 * 60);
    return () => clearInterval(id);
  }, [examDateISO, isConfirmed]);

  return (
    <div className="rounded-card bg-ink px-5 py-4 text-chalk">
      <p className="text-xs font-medium uppercase tracking-wide text-chalk/60">{examLabel}</p>
      {isConfirmed && examDateISO ? (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-4xl font-semibold tabular-nums" aria-live="polite">
            {days === null ? "--" : days}
          </span>
          <span className="text-sm font-medium text-chalk/70">days left</span>
        </div>
      ) : (
        <p className="mt-1 text-sm font-medium text-marker-amber">
          Exam date to be confirmed — check back once UNEB publishes the official timetable.
        </p>
      )}
    </div>
  );
}
