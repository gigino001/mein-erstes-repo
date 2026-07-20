"use client";

import { Trash2 } from "lucide-react";
import { deleteComponentAction } from "./actions";

export function DeleteComponentButton({ componentId }: { componentId: string }) {
  return (
    <form
      action={deleteComponentAction.bind(null, componentId)}
      onSubmit={(e) => {
        if (!confirm("Diese Komponente wirklich löschen?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Löschen"
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}
