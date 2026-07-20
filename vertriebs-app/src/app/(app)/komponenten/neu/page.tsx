import { PageHeader } from "@/components/ui";
import { ComponentForm } from "../component-form";
import { createComponentAction } from "../actions";

export default function NeueKomponentePage() {
  return (
    <div>
      <PageHeader title="Neue Komponente" />
      <div className="p-4 sm:p-8 max-w-2xl">
        <ComponentForm action={createComponentAction} />
      </div>
    </div>
  );
}
