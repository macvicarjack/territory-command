import { OUTCOMES, getAccountName, formatCurrency } from "@/lib/mockData";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

export default function WaitingRoomPage() {
  // All tasks waiting on others (not Jack, not done)
  const waitingTasks = OUTCOMES.flatMap((o) =>
    o.tasks
      .filter((t) => t.owner !== "Jack" && t.status === "pending")
      .map((t) => ({ outcome: o, task: t }))
  );

  // Group by owner
  const grouped = waitingTasks.reduce<Record<string, typeof waitingTasks>>((acc, item) => {
    const key = item.task.owner;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // Sort each group by value * days
  Object.values(grouped).forEach((arr) =>
    arr.sort((a, b) => (b.outcome.value * b.outcome.daysActive) - (a.outcome.value * a.outcome.daysActive))
  );

  const ownerColor: Record<string, string> = {
    Customer: "text-status-waiting",
    Vendor: "text-primary",
    "Inside Sales": "text-muted-foreground",
  };

  // Empty state
  if (OUTCOMES.length === 0) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No data yet — connect this page to real data.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <h1 className="mb-4 text-xl font-bold text-foreground">Waiting Room</h1>
        <p className="mb-6 text-xs text-muted-foreground">Tasks waiting on others, grouped by owner, sorted by value × days waiting.</p>

        <div className="grid gap-4 lg:grid-cols-3">
          {Object.entries(grouped).map(([owner, items]) => (
            <div key={owner} className="rounded-lg bg-card p-4">
              <h2 className={cn("mb-3 text-sm font-bold", ownerColor[owner] ?? "text-foreground")}>{owner}</h2>
              <div className="space-y-1.5">
                {items.map(({ outcome, task }) => (
                  <div key={task.id} className="rounded-md px-2.5 py-2 hover:bg-accent">
                    <p className="text-xs text-foreground">{task.description}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {getAccountName(outcome.accountId)} · {formatCurrency(outcome.value)} · {outcome.daysActive}d
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
