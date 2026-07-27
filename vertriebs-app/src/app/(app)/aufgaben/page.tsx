import Link from "next/link";
import { clsx } from "clsx";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { labelFor, AUFTRAGSVARIANTEN } from "@/lib/options";
import { createTaskAction } from "./actions";

export default async function AufgabenPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { filter } = await searchParams;
  const showAll = filter === "alle";

  const [tasks, users, projects] = await Promise.all([
    prisma.task.findMany({
      where: showAll ? {} : { assignedToId: session.user.id },
      include: { assignedTo: true, project: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({
      include: { customer: true, variants: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const openTasks = tasks.filter((t) => t.status === "OFFEN");
  const doneTasks = tasks.filter((t) => t.status === "ERLEDIGT");

  const projectOptions = projects.map((p) => ({
    id: p.id,
    label: `${p.customer.firstName} ${p.customer.lastName} – ${p.variants
      .map((v) => labelFor(AUFTRAGSVARIANTEN, v.variantType))
      .join(", ")}`,
  }));

  const boundCreate = createTaskAction.bind(null, null);

  return (
    <div>
      <PageHeader title="Aufgaben" description="Deine To-dos und die des Teams" />
      <div className="max-w-2xl space-y-4 p-4 sm:p-8">
        <div className="flex gap-2">
          <Link
            href="/aufgaben"
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              !showAll
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Meine Aufgaben
          </Link>
          <Link
            href="/aufgaben?filter=alle"
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              showAll
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Alle Aufgaben
          </Link>
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            Offen ({openTasks.length})
          </h2>
          {openTasks.length === 0 ? (
            <p className="text-sm text-slate-400">Keine offenen Aufgaben.</p>
          ) : (
            <ul className="space-y-1.5">
              {openTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  showAssignee={showAll}
                  showProjectLink
                />
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <TaskForm
              action={boundCreate}
              users={users}
              defaultAssigneeId={session.user.id}
              projects={projectOptions}
            />
          </div>
        </Card>

        {doneTasks.length > 0 && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">
              Erledigt ({doneTasks.length})
            </h2>
            <ul className="space-y-1.5">
              {doneTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  showAssignee={showAll}
                  showProjectLink
                />
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
