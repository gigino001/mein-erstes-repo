import { Field, FormGrid, TextInput, Textarea, Select } from "@/components/form";
import { Button } from "@/components/ui";
import type { User } from "@/generated/prisma/client";

export function TaskForm({
  action,
  users,
  defaultAssigneeId,
  projects,
}: {
  action: (formData: FormData) => void;
  users: User[];
  defaultAssigneeId: string;
  projects?: Array<{ id: string; label: string }>;
}) {
  return (
    <form action={action} className="space-y-3">
      <FormGrid>
        <Field label="Titel" htmlFor="title" full>
          <TextInput id="title" name="title" required />
        </Field>
        <Field label="Empfänger" htmlFor="assignedToId">
          <Select id="assignedToId" name="assignedToId" defaultValue={defaultAssigneeId}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fällig am" htmlFor="dueDate">
          <TextInput id="dueDate" name="dueDate" type="date" />
        </Field>
        {projects && (
          <Field label="Vorgang (optional)" htmlFor="projectId" full>
            <Select id="projectId" name="projectId" defaultValue="">
              <option value="">– kein Bezug –</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Beschreibung (optional)" htmlFor="description" full>
          <Textarea id="description" name="description" rows={2} />
        </Field>
      </FormGrid>
      <Button type="submit" variant="secondary">
        + Aufgabe hinzufügen
      </Button>
    </form>
  );
}
