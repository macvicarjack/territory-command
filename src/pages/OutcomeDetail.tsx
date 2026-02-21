import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOutcomes, toggleTaskStatus, addTaskToOutcome } from "@/lib/api";
import { Task, TaskOwner } from "@/types/outcome";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  AlertTriangle,
  User,
} from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

const OWNERS: TaskOwner[] = ["Jack", "Vendor", "Inside Sales", "Customer"];

export default function OutcomeDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState<TaskOwner>("Jack");

  const { data: outcomes = [] } = useQuery({
    queryKey: ["outcomes"],
    queryFn: fetchOutcomes,
  });

  const outcome = outcomes.find((o) => o.id === id);

  const toggleMutation = useMutation({
    mutationFn: toggleTaskStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outcomes"] }),
  });

  const addMutation = useMutation({
    mutationFn: (task: { description: string; owner: string }) =>
      addTaskToOutcome(id!, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
      setNewTaskDesc("");
      setShowAddTask(false);
    },
  });

  if (!outcome) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Outcome not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const constraint = outcome.tasks.find((t) => t.id === outcome.constraint_task_id);

  function handleAddTask() {
    if (!newTaskDesc.trim()) return;
    addMutation.mutate({ description: newTaskDesc.trim(), owner: newTaskOwner });
  }

  function getTaskStyle(task: Task) {
    if (task.status === "done") return "bg-status-done-bg";
    if (task.owner === "Jack") return "bg-owner-jack-bg";
    return "bg-owner-other-bg";
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {outcome.customer_name}
              {outcome.contact_name && ` · ${outcome.contact_name}`}
            </p>
            <h1 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {outcome.title}
            </h1>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase ${
                outcome.status === "active"
                  ? "bg-primary/10 text-primary"
                  : outcome.status === "deferred"
                  ? "bg-owner-other/10 text-owner-other"
                  : "bg-status-done/10 text-status-done"
              }`}
            >
              {outcome.status}
            </span>
          </div>

          {/* Constraint */}
          {constraint && constraint.status !== "done" && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-owner-jack-bg p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-constraint" />
              <div>
                <p className="text-xs font-semibold uppercase text-constraint">Blocker</p>
                <p className="mt-1 text-sm text-foreground">{constraint.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">Owner: {constraint.owner}</p>
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks ({outcome.tasks.length})
            </h2>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>

          {showAddTask && (
            <div className="mb-4 rounded-lg bg-card p-4">
              <input
                type="text"
                placeholder="Task description..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="w-full rounded-md bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {OWNERS.map((owner) => (
                    <button
                      key={owner}
                      onClick={() => setNewTaskOwner(owner)}
                      className={`rounded-md px-3 py-1 text-xs transition-colors ${
                        newTaskOwner === owner
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {owner}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskDesc.trim()}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {outcome.tasks.map((task) => {
              const isConstraint = task.id === outcome.constraint_task_id;
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 rounded-lg p-3 transition-all ${getTaskStyle(task)}`}
                >
                  <button
                    onClick={() => toggleMutation.mutate(task.id)}
                    className="mt-0.5 shrink-0"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-status-done" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        task.status === "done"
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {task.description}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          task.owner === "Jack" && task.status !== "done"
                            ? "text-owner-jack"
                            : "text-muted-foreground"
                        }`}
                      >
                        <User className="mr-1 inline h-3 w-3" />
                        {task.owner}
                      </span>
                      {isConstraint && task.status !== "done" && (
                        <span className="text-xs text-constraint">⚡ BLOCKER</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
