"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { SignaturePad } from "./signature-pad";

export function SignatureSection({
  offerId,
  offerNumber,
  signedAt,
  saveAction,
  deleteAction,
}: {
  offerId: string;
  offerNumber: string;
  signedAt: Date | null;
  saveAction: (dataUrl: string) => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const showPad = !signedAt || isEditing;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-500">Unterschrift</h2>
      <p className="mb-4 text-xs text-slate-400">
        Auftragsbestätigung zu {offerNumber}. Mit der Unterschrift werden alle
        Leistungen des Vorgangs auf den Status &bdquo;Auftrag&ldquo; gesetzt.
      </p>

      {showPad ? (
        <SignaturePad
          onSave={async (dataUrl) => {
            await saveAction(dataUrl);
            setIsEditing(false);
          }}
          onCancel={signedAt ? () => setIsEditing(false) : undefined}
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border)] bg-white p-2">
            <Image
              src={`/api/signatures/${offerId}`}
              alt="Unterschrift des Kunden"
              width={600}
              height={160}
              unoptimized
              className="h-32 w-full object-contain"
            />
          </div>
          <p className="text-xs text-slate-400">
            Unterschrieben am{" "}
            {new Intl.DateTimeFormat("de-DE", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(signedAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
              Neu unterschreiben
            </Button>
            <form action={deleteAction}>
              <Button type="submit" variant="ghost">
                <Trash2 size={16} />
                Unterschrift entfernen
              </Button>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
