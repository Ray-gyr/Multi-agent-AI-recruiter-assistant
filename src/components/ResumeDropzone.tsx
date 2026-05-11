"use client";

import { useRef, useState } from "react";

export function ResumeDropzone({
  disabled = false,
  onFilesAccepted,
  onRejected,
}: {
  disabled?: boolean;
  onFilesAccepted: (files: File[]) => void;
  onRejected: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function processFiles(fileList: FileList | null) {
    if (!fileList || disabled) {
      return;
    }

    const files = Array.from(fileList);
    const pdfs = files.filter(isPdfFile);
    const rejectedCount = files.length - pdfs.length;

    if (rejectedCount > 0) {
      onRejected(`${rejectedCount} file${rejectedCount === 1 ? "" : "s"} ignored. Upload PDFs only.`);
    }

    if (pdfs.length > 0) {
      onFilesAccepted(pdfs);
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        processFiles(event.dataTransfer.files);
      }}
      className={[
        "rounded-lg border-2 border-dashed bg-white p-8 text-center transition",
        disabled
          ? "border-zinc-200 opacity-70"
          : isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-zinc-300 hover:border-emerald-400 hover:bg-emerald-50/40",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          processFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <div className="mx-auto grid size-14 place-items-center rounded-lg bg-zinc-100 text-sm font-black text-zinc-700">
        PDF
      </div>
      <h2 className="mt-4 text-lg font-semibold text-zinc-950">Drop resumes here</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        Upload one or more PDF resumes, up to 10 MB each. Text is extracted once and cached
        for candidate drill-downs.
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        Choose PDF files
      </button>
    </div>
  );
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
