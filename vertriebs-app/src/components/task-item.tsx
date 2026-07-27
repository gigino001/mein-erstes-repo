import Link from "next/link";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { toggleTaskStatusAction, deleteTaskAction } from "@/app/(app)/aufgaben/actions";
import type { Task, User, Project, Customer } from "@/generated/prisma/client";

export type TaskWithRelations = Task & {
  assignedTo: User;
  project: (Project & { customer: Customer }) | null;
};

export function TaskItem({
  task,
  showAssignee,
  showProjectLink,
}: {
  task: TaskWithRelations;
  showAssignee?: boolean;
  showProjectLink?: boolean;
}) {
  const isDone = task.status === "ERLEDIGT";
  const isOverdue = !isDone && task.dueDate != null && task.dueDate.getTime() < Date.now();

  return (
    <li className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800">
      <form action={toggleTaskStatusAction.bind(null, task.id)}>
        <button
          type="submit"
          className={
            isDone
              ? "text-emerald-600"
              : "text-slate-400 hover:text-emerald-600"
          }
          aria-label={isDone ? "Als offen markieren" : "Als erledigt markieren"}
        >
          {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={isDone ? "text-slate-400 line-through" : "font-medium"}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {task.dueDate && (
            <span className={isOverdue ? "font-medium text-red-600" : undefined}>
              Fällig: {new Intl.DateTimeFormat("de-DE").format(task.dueDate)}
            </span>
          )}
          {showAssignee && <span>{task.assignedTo.name}</span>}
          {showProjectLink && task.project && (
            <Link
              href={`/projekte/${task.project.id}`}
              className="hover:text-emerald-600 hover:underline"
            >
              {task.project.customer.firstName} {task.project.customer.lastName}
            </Link>
          )}
        </div>
      </div>
      <form action={deleteTaskAction.bind(null, task.id)}>
        <button
          type="submit"
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Aufgabe löschen"
        >
          <Trash2 size={14} />
        </button>
      </form>
    </li>
  );
}
