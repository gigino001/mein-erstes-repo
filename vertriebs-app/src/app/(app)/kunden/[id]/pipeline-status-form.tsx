import { Field, FormGrid, Select, TextInput } from "@/components/form";
import { Button } from "@/components/ui";
import { PIPELINE_STATUS } from "@/lib/options";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function PipelineStatusForm({
  pipelineStatus,
  followUpDate,
  action,
}: {
  pipelineStatus: string;
  followUpDate: Date | null;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-3">
      <FormGrid>
        <Field label="Interessenten-Status" htmlFor="pipelineStatus" full>
          <Select id="pipelineStatus" name="pipelineStatus" defaultValue={pipelineStatus}>
            {PIPELINE_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Wiedervorlage am" htmlFor="followUpDate" full>
          <TextInput
            id="followUpDate"
            name="followUpDate"
            type="date"
            defaultValue={toDateInputValue(followUpDate)}
          />
        </Field>
      </FormGrid>
      <Button type="submit" variant="secondary" className="w-full">
        Speichern
      </Button>
    </form>
  );
}
