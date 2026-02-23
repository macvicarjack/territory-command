import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  description: string;
  owner: string;
  status: string;
  age_days: number;
  created_date: string;
}

interface Outcome {
  id: string;
  customer_name: string;
  title: string;
  constraint_task_id: string;
  tasks: Task[];
  revenue_ytd?: number;
  tier?: "A" | "B" | "C";
}

interface DashboardData {
  outcomes: Outcome[];
}

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

type SortOption = "age" | "owner" | "revenue";
type GroupOption = "none" | "owner";

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${FLASK_TUNNEL}/api/territory/dashboard`);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

function getUrgencyColor(days: number): string {
  if (days < 7) return "text-green-400";
  if (days < 14) return "text-yellow-400";
  return "text-red-400";
}

function getUrgencyBg(days: number): string {
  if (days < 7) return "bg-green-500/10 border-green-500/20";
  if (days < 14) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getOwnerColor(owner: string): string {
  const lower = owner.toLowerCase();
  if (lower === "jack") return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (lower === "customer") return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  if (lower === "vendor") return "bg-purple-500/15 text-purple-400 border-purple-500/20";
  if (lower === "inside sales") return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
  return "bg-slate-500/15 text-slate-400 border-slate-500/20";
}

interface WaitingItem {
  outcome: Outcome;
  task: Task;
}

export default function WaitingRoomPage() {
  const [sortBy, setSortBy] = useState<SortOption>("age");
  const [groupBy, setGroupBy] = useState<GroupOption>("none");

  const { data, isLoading, error } = useQuery({
    queryKey: ["territory-dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
  });

  // Filter outcomes where constraint task owner is NOT Jack
  const waitingItems: WaitingItem[] = useMemo(() => {
    const items = data?.outcomes
      .map((outcome) => {
        const constraintTask = outcome.tasks.find(
          (t) => t.id === outcome.constraint_task_id
        );
        if (constraintTask && constraintTask.owner.toLowerCase() !== "jack") {
          return { outcome, task: constraintTask };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null) || [];

    // Sort based on selected option
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case "owner":
          return a.task.owner.localeCompare(b.task.owner);
        case "age":
          return b.task.age_days - a.task.age_days; // Oldest first
        case "revenue":
          return (b.outcome.revenue_ytd || 0) - (a.outcome.revenue_ytd || 0); // Highest first
        default:
          return 0;
      }
    });
  }, [data?.outcomes, sortBy]);

  // Group by owner if selected
  const groupedItems = useMemo(() => {
    if (groupBy !== "owner") return null;

    const groups: Record<string, WaitingItem[]> = {};
    waitingItems.forEach((item) => {
      const owner = item.task.owner;
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push(item);
    });

    // Sort groups by owner name
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [waitingItems, groupBy]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading waiting room...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-400">Error loading data</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error).message}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Empty state
  if (waitingItems.length === 0) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Waiting Room</h1>
            <p className="text-sm text-muted-foreground">Nothing waiting on others</p>
          </div>
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">All tasks are with Jack or complete</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const renderItem = ({ outcome, task }: WaitingItem) => (
    <div
      key={outcome.id}
      className={cn(
        "rounded-lg border p-4 transition-colors hover:bg-accent/50",
        getUrgencyBg(task.age_days)
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {outcome.customer_name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {outcome.title}
          </p>
        </div>
        <div className={cn("text-sm font-medium whitespace-nowrap", getUrgencyColor(task.age_days))}>
          {task.age_days} day{task.age_days !== 1 ? "s" : ""} waiting
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px]", getOwnerColor(task.owner))}>
            {task.owner}
          </Badge>
          <span className="text-sm text-foreground">{task.description}</span>
        </div>
        {(outcome.revenue_ytd || outcome.tier) && (
          <div className="mt-2 text-xs text-muted-foreground">
            {outcome.tier && <span>Tier {outcome.tier}</span>}
            {outcome.tier && outcome.revenue_ytd && <span> · </span>}
            {outcome.revenue_ytd && (
              <span>${(outcome.revenue_ytd / 1000).toFixed(0)}K Rev</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Waiting Room</h1>
            <p className="text-sm text-muted-foreground">
              Waiting on {waitingItems.length} item{waitingItems.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Group By */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupOption)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="none">No Grouping</option>
              <option value="owner">Group by Owner</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="age">Sort: By Age</option>
              <option value="owner">Sort: By Owner</option>
              <option value="revenue">Sort: By Revenue</option>
            </select>
          </div>
        </div>

        {groupBy === "owner" && groupedItems ? (
          /* Grouped View */
          <div className="space-y-6">
            {groupedItems.map(([owner, items]) => (
              <div key={owner}>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", getOwnerColor(owner))}>
                    {owner}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map(({ outcome, task }) => renderItem({ outcome, task }))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat List View */
          <div className="space-y-3">
            {waitingItems.map(({ outcome, task }) => renderItem({ outcome, task }))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
