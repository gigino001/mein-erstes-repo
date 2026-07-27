"use client";

import { useRef } from "react";

export function StatusSelect({
  projectId,
  statuses,
  currentStatusId,
  action,
}: {
  projectId: string;
  statuses: { id: string; name: string }[];
  currentStatusId: string;
  action: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <select
        name="statusId"
        defaultValue={currentStatusId}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium outline-none focus:border-emerald-600"
      >
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>
    </form>
  );
}
