import { clsx } from "clsx";

/**
 * UACE point-based grades, best (D1) to weakest (F9).
 * Used as the mastery/performance indicator throughout the app instead of
 * a generic progress bar — students already read this scale instinctively.
 */
export type UaceGrade = "D1" | "D2" | "C3" | "C4" | "C5" | "C6" | "P7" | "P8" | "F9";

const TIER: Record<UaceGrade, "strong" | "mid" | "weak"> = {
  D1: "strong",
  D2: "strong",
  C3: "mid",
  C4: "mid",
  C5: "mid",
  C6: "mid",
  P7: "weak",
  P8: "weak",
  F9: "weak",
};

const TIER_STYLES = {
  strong: "bg-marker-green-soft text-marker-green",
  mid: "bg-marker-amber-soft text-[#8A5A00]",
  weak: "bg-marker-red-soft text-marker-red",
};

export function GradeChip({
  grade,
  label,
  className,
}: {
  grade: UaceGrade;
  label?: string;
  className?: string;
}) {
  const tier = TIER[grade];
  return (
    <span
      className={clsx(
        "inline-flex animate-tick-in items-center gap-1.5 rounded-chip px-2.5 py-1 font-mono text-xs font-semibold",
        TIER_STYLES[tier],
        className
      )}
    >
      {grade}
      {label && <span className="font-body font-normal opacity-80">{label}</span>}
    </span>
  );
}

/** Converts a 0-100 accuracy score to an approximate UACE grade for display. */
export function scoreToGrade(accuracyPercent: number): UaceGrade {
  if (accuracyPercent >= 90) return "D1";
  if (accuracyPercent >= 80) return "D2";
  if (accuracyPercent >= 70) return "C3";
  if (accuracyPercent >= 60) return "C4";
  if (accuracyPercent >= 50) return "C5";
  if (accuracyPercent >= 40) return "C6";
  if (accuracyPercent >= 30) return "P7";
  if (accuracyPercent >= 20) return "P8";
  return "F9";
}
