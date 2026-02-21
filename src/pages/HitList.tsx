import { useQuery } from "@tanstack/react-query";
import { fetchOutcomes } from "@/lib/api";
import OutcomeCard from "@/components/OutcomeCard";
import { Link } from "react-router-dom";
import { Plus, Crosshair, Clock, CheckCircle2 } from "lucide-react";
import { Outcome } from "@/types/outcome";

function groupOutcomes(outcomes: Outcome[]) {
  const active = outcomes.filter((o) => o.status === "active");
  const deferred = outcomes.filter((o) => o.status === "deferred");
  const completed = outcomes.filter((o) => o.status === "completed");

  // Sort active: Jack-owned constraints first
  active.sort((a, b) => {
    const aConstraint = a.tasks.find((t) => t.id === a.constraint_task_id);
    const bConstraint = b.tasks.find((t) => t.id === b.constraint_task_id);
    const aJack = aConstraint?.owner === "Jack" ? 0 : 1;
    const bJack = bConstraint?.owner === "Jack" ? 0 : 1;
    return aJack - bJack;
  });

  return { active, deferred, completed };
}

export default function HitList() {
  const { data: outcomes = [], isLoading } = useQuery({
    queryKey: ["outcomes"],
    queryFn: fetchOutcomes,
  });

  const { active, deferred, completed } = groupOutcomes(outcomes);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Crosshair className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-mono text-lg font-bold uppercase tracking-wider text-foreground">
                Territory Command
              </h1>
              <p className="text-xs text-muted-foreground">
                {active.length} active · {deferred.length} deferred
              </p>
            </div>
          </div>
          <Link
            to="/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Lead</span>
          </Link>
        </div>
      </header>

      <main className="container py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="font-mono text-sm text-muted-foreground">Loading outcomes...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Outcomes */}
            {active.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" />
                  <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Active ({active.length})
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((o) => (
                    <OutcomeCard key={o.id} outcome={o} />
                  ))}
                </div>
              </section>
            )}

            {/* Deferred */}
            {deferred.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Deferred ({deferred.length})
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {deferred.map((o) => (
                    <OutcomeCard key={o.id} outcome={o} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-status-done" />
                  <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Completed ({completed.length})
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {completed.map((o) => (
                    <OutcomeCard key={o.id} outcome={o} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
