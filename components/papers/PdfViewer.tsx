"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

/**
 * Renders a PDF inline via the browser's native viewer (iframe) rather than
 * a heavy JS PDF-rendering library — keeps the bundle small for low-end
 * Android/low-data users. Falls back to an explicit "open in new tab" link
 * if the inline viewer fails (some mobile browsers, particularly older
 * Android WebViews, don't render PDFs in an iframe reliably).
 */
export function PdfViewer({ url, title }: { url: string; title: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative overflow-hidden rounded-card border border-ink/10 bg-chalk-dim">
      {status === "loading" && (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-2 text-slate">
          <Loader2 size={24} className="animate-spin" aria-hidden="true" />
          <p className="text-sm">Loading document…</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertTriangle size={24} className="text-marker-red" aria-hidden="true" />
          <p className="text-sm font-medium text-ink">Couldn&apos;t display this document here.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target inline-flex items-center gap-1.5 rounded-card bg-marker-green px-4 py-2 text-sm font-semibold text-white"
          >
            Open in new tab <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}

      <iframe
        src={url}
        title={title}
        className={status === "loaded" ? "h-[70vh] w-full" : "sr-only h-0 w-0"}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
      {/*
        Known limitation: iframe onLoad fires once the request completes,
        even if the browser then fails to *render* the PDF inline (e.g. some
        Android WebViews silently show a blank frame instead of throwing).
        onError only catches network-level failures. The "open in new tab"
        link is always shown once loaded specifically as a safety net for
        that gap, not just a nicety.
      */}

      {status === "loaded" && (
        <div className="border-t border-ink/10 bg-white px-3 py-2 text-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-marker-green underline underline-offset-2"
          >
            Open full screen in a new tab
          </a>
        </div>
      )}
    </div>
  );
}
