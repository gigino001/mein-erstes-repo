import { Card } from "@/components/ui";
import { TaskForm } from "@/components/task-form";
import { TaskItem, type TaskWithRelations } from "@/components/task-item";
import { createTaskAction } from "@/app/(app)/aufgaben/actions";
import type { User } from "@/generated/prisma/client";

export function TaskSection({
  projectId,
  tasks,
  users,
  currentUserId,
}: {
  projectId: string;
  tasks: TaskWithRelations[];
  users: User[];
  currentUserId: string;
}) {
  const openTasks = tasks.filter((t) => t.status === "OFFEN");
  const doneTasks = tasks.filter((t) => t.status === "ERLEDIGT");
  const boundCreate = createTaskAction.bind(null, projectId);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold text-slate-500">Aufgaben</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400">
          Noch keine Aufgaben für diesen Vorgang.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {[...openTasks, ...doneTasks].map((task) => (
            <TaskItem key={task.id} task={task} showAssignee />
          ))}
        </ul>
      )}
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <TaskForm action={boundCreate} users={users} defaultAssigneeId={currentUserId} />
      </div>
    </Card>
  );
}
