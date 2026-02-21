import { Outcome, Task } from "@/types/outcome";
import { Target, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface OutcomeCardProps {
  outcome: Outcome;
}

function getConstraintTask(outcome: Outcome): Task | undefined {
  return outcome.tasks.find((t) => t.id === outcome.constraint_task_id);
}

function isJackOwned(task: Task | undefined): boolean {
  return task?.owner === "Jack";
}

export default function OutcomeCard({ outcome }: OutcomeCardProps) {
  const constraint = getConstraintTask(outcome);
  const jackOwned = isJackOwned(constraint);
  const doneTasks = outcome.tasks.filter((t) => t.status === "done").length;

  return (
    <Link
      to={`/outcome/${outcome.id}`}
      className={`block rounded-lg border p-4 transition-all hover:scale-[1.01] hover:shadow-lg animate-slide-up ${
        jackOwned
          ? "border-owner-jack/30 bg-owner-jack-bg"
          : "border-owner-other/20 bg-owner-other-bg"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {outcome.customer_name}
          </p>
          <h3 className="mt-1 font-semibold leading-tight text-foreground">
            {outcome.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-xs text-muted-foreground">
            {doneTasks}/{outcome.tasks.length}
          </span>
          <Target className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {constraint && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 ${
            jackOwned
              ? "border-owner-jack/20 bg-owner-jack-bg"
              : "border-owner-other/15 bg-owner-other-bg"
          }`}
        >
          {constraint.status === "done" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-done" />
          ) : (
            <AlertTriangle
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                jackOwned ? "text-owner-jack animate-pulse-glow" : "text-owner-other"
              }`}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-foreground">
              {constraint.description}
            </p>
            <p className={`mt-1 font-mono text-xs ${
              jackOwned ? "text-owner-jack" : "text-owner-other"
            }`}>
              {constraint.owner}
              {constraint.status === "done" && (
                <span className="ml-2 text-status-done">✓ Done</span>
              )}
            </p>
          </div>
        </div>
      )}
    </Link>
  );
}
