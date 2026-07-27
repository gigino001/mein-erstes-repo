import { FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import { AutoSubmitFileInput } from "@/components/auto-submit-file-input";
import { uploadDocumentAction, deleteDocumentAction } from "./document-actions";
import type { RequiredPhotoType, Document as DocumentModel } from "@/generated/prisma/client";

export function PhotosSection({
  projectId,
  requiredPhotoTypes,
  documents,
}: {
  projectId: string;
  requiredPhotoTypes: RequiredPhotoType[];
  documents: DocumentModel[];
}) {
  const byRequiredType = new Map(
    documents.filter((d) => d.requiredPhotoTypeId).map((d) => [d.requiredPhotoTypeId!, d])
  );
  const freeDocuments = documents.filter((d) => !d.requiredPhotoTypeId);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-500">Fotos</h2>

      {requiredPhotoTypes.length === 0 ? (
        <p className="text-sm text-slate-400">
          Für diese Auftragsvariante(n) sind keine Pflichtfotos hinterlegt.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {requiredPhotoTypes.map((type) => {
            const doc = byRequiredType.get(type.id);
            return (
              <li
                key={type.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {doc ? (
                    <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/documents/${doc.id}`}
                        alt={type.label}
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    </a>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--border)] text-slate-300">
                      <FileText size={16} />
                    </span>
                  )}
                  <span className="truncate">{type.label}</span>
                </span>
                {doc ? (
                  <form action={deleteDocumentAction.bind(null, projectId, doc.id)}>
                    <button
                      type="submit"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Foto löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                ) : (
                  <form
                    action={uploadDocumentAction.bind(null, projectId, type.id)}
                    encType="multipart/form-data"
                  >
                    <AutoSubmitFileInput accept="image/*" capture />
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Weitere Dokumente
        </h3>
        {freeDocuments.length === 0 ? (
          <p className="mb-3 text-sm text-slate-400">Keine weiteren Dokumente.</p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {freeDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <a
                  href={`/api/documents/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-emerald-600 hover:underline"
                >
                  {doc.fileName}
                </a>
                <form action={deleteDocumentAction.bind(null, projectId, doc.id)}>
                  <button
                    type="submit"
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Dokument löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={uploadDocumentAction.bind(null, projectId, null)} encType="multipart/form-data">
          <AutoSubmitFileInput />
        </form>
      </div>
    </Card>
  );
}
