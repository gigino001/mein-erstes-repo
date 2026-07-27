import { PageHeader } from "@/components/ui";
import { FundingForm } from "../funding-form";
import { createFundingProgramAction } from "../actions";

export default function NeuesFoerderprogrammPage() {
  return (
    <div>
      <PageHeader title="Neues Förderprogramm" />
      <div className="p-4 sm:p-8 max-w-2xl">
        <FundingForm action={createFundingProgramAction} />
      </div>
    </div>
  );
}
