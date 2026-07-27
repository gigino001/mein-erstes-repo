"use client";

export function AutoSubmitFileInput({
  accept,
  capture,
}: {
  accept?: string;
  capture?: boolean;
}) {
  return (
    <input
      type="file"
      name="file"
      accept={accept}
      capture={capture ? "environment" : undefined}
      required
      className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}
