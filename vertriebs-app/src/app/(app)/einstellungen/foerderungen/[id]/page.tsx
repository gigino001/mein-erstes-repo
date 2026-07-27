import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { FundingForm } from "../funding-form";
import { updateFundingProgramAction } from "../actions";

export default async function FoerderprogrammBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await prisma.fundingProgram.findUnique({ where: { id } });
  if (!program) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={program.name} />
      <div className="p-4 sm:p-8 max-w-2xl">
        <FundingForm
          action={updateFundingProgramAction.bind(null, program.id)}
          existing={program}
        />
      </div>
    </div>
  );
}
