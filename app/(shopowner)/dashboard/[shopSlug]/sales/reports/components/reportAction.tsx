// app/(dashboard)/[shopSlug]/reports/components/reportAction.tsx
"use client";

import { useState, RefObject } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  targetRef: RefObject<HTMLDivElement | null>;
  filename: string;
}

export default function ReportActions({ targetRef, filename }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!targetRef.current) {
      setError("Report is not ready yet");
      return;
    }
    setDownloading(true);
    setError(null);

    try {
      // Dynamic import keeps the library out of the initial bundle
      const { default: html2PDF } = await import("jspdf-html2canvas-up");

      await html2PDF(targetRef.current, {
        jsPDF: {
          format: "a4",
        },
        imageType: "image/jpeg",
        output: filename,
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="mt-6">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-magenta-dark text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {downloading ? "Generating…" : "Download PDF"}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </section>
  );
}