import { PageHeader } from "@/components/ui";
import { CustomerForm } from "./customer-form";

export default function NeuerKundePage() {
  return (
    <div>
      <PageHeader
        title="Neuer Kunde"
        description="Erfasse die Kontaktdaten – die technischen Details folgen im nächsten Schritt."
      />
      <div className="p-4 sm:p-8 max-w-2xl">
        <CustomerForm />
      </div>
    </div>
  );
}
