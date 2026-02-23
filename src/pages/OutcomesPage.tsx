import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, AlertCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  description: string;
  owner: string;
  status: "pending" | "completed";
  age_days: number;
  created_date: string;
}

interface Outcome {
  id: string;
  customer_name: string;
  title: string;
  status: "active" | "at_risk" | "completed" | "deferred";
  tasks: Task[];
  constraint_task_id: string | null;
  revenue_ytd: number;
  tier: "A" | "B" | "C";
  created_date: string;
}

interface DashboardData {
  outcomes: Outcome[];
}

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "at_risk":
      return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    case "completed":
      return "bg-slate-500/15 text-slate-400 border-slate-500/20";
    case "deferred":
      return "bg-purple-500/15 text-purple-400 border-purple-500/20";
    default:
      return "bg-slate-500/15 text-slate-400 border-slate-500/20";
  }
}

function getStatusDot(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "at_risk":
      return "bg-amber-500";
    case "completed":
      return "bg-slate-500";
    case "deferred":
      return "bg-purple-500";
    default:
      return "bg-slate-500";
  }
}

function getOwnerColor(owner: string): string {
  const lower = owner.toLowerCase();
  if (lower === "jack") {
    return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  }
  if (lower === "customer") {
    return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  }
  if (lower === "vendor") {
    return "bg-purple-500/15 text-purple-400 border-purple-500/20";
  }
  return "bg-slate-500/15 text-slate-400 border-slate-500/20";
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "A":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold";
    case "B":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30 font-semibold";
    case "C":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30 font-semibold";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function calculateOutcomeAge(outcome: Outcome): number {
  const created = new Date(outcome.created_date);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export default function OutcomesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["outcomes-dashboard"],
    queryFn: async () => {
      const res = await fetch(`${FLASK_TUNNEL}/api/territory/dashboard`);
      if (!res.ok) throw new Error("Failed to fetch outcomes");
      return res.json();
    },
    refetchInterval: 60000,
    retry: 2,
  });

  const outcomes = dashboard?.outcomes || [];

  // Get unique owners from tasks for filter
  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    outcomes.forEach((o) => {
      // Find constraint task owner
      if (o.constraint_task_id) {
        const constraintTask = o.tasks.find((t) => t.id === o.constraint_task_id);
        if (constraintTask) {
          owners.add(constraintTask.owner);
        }
      }
    });
    return Array.from(owners).sort();
  }, [outcomes]);

  // Filter and sort outcomes
  const filteredAndSortedOutcomes = useMemo(() => {
    let filtered = outcomes;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Filter by constraint owner
    if (ownerFilter !== "all") {
      filtered = filtered.filter((o) => {
        if (!o.constraint_task_id) return false;
        const constraintTask = o.tasks.find((t) => t.id === o.constraint_task_id);
        return constraintTask?.owner === ownerFilter;
      });
    }

    // Sort: At Risk first, then Active, then by revenue descending
    return [...filtered].sort((a, b) => {
      const statusPriority: Record<string, number> = { at_risk: 0, active: 1, deferred: 2, completed: 3 };
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return b.revenue_ytd - a.revenue_ytd;
    });
  }, [outcomes, statusFilter, ownerFilter]);

  const toggleTask = (taskId: string) => {
    setCheckedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading outcomes...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-muted-foreground">Failed to load outcomes</p>
            <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Outcomes</h1>
            <p className="text-sm text-muted-foreground">
              {outcomes.length} total · {filteredAndSortedOutcomes.length} showing
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="completed">Completed</option>
              <option value="deferred">Deferred</option>
            </select>

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Constraint Owners</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Outcomes Grid */}
        {filteredAndSortedOutcomes.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">No outcomes match your filters</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedOutcomes.map((outcome) => {
              const constraintTask = outcome.constraint_task_id
                ? outcome.tasks.find((t) => t.id === outcome.constraint_task_id)
                : null;
              const outcomeAge = calculateOutcomeAge(outcome);

              return (
                <Card
                  key={outcome.id}
                  className={cn(
                    "overflow-hidden border-border bg-card transition-shadow hover:shadow-md",
                    outcome.status === "at_risk" && "border-amber-500/30 ring-1 ring-amber-500/20"
                  )}
                >
                  <CardHeader className="space-y-3 pb-3">
                    {/* Customer Name + Badges Row */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-foreground line-clamp-1">
                        {outcome.customer_name}
                      </h2>
                      <div className="flex shrink-0 gap-1.5">
                        <Badge variant="outline" className={cn("text-xs", getTierColor(outcome.tier))}>
                          {outcome.tier}
                        </Badge>
                      </div>
                    </div>

                    {/* Revenue Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono">
                        {formatCurrency(outcome.revenue_ytd)}
                      </Badge>
                    </div>

                    {/* Outcome Title */}
                    <p className="text-sm text-foreground/90 line-clamp-2">{outcome.title}</p>

                    {/* Status + Age Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", getStatusDot(outcome.status))} />
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", getStatusColor(outcome.status))}>
                          {outcome.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{outcomeAge}d</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="border-t border-border pt-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Tasks
                      </p>

                      {/* Tasks List */}
                      <div className="space-y-2">
                        {outcome.tasks.map((task) => {
                          const isConstraint = task.id === outcome.constraint_task_id;
                          const isChecked = task.status === "completed" || checkedTasks.has(task.id);

                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "flex items-start gap-2 rounded-md p-1.5 transition-colors",
                                isConstraint && "bg-amber-500/5 border border-amber-500/20",
                                !isConstraint && "hover:bg-accent"
                              )}
                            >
                              <Checkbox
                                id={task.id}
                                checked={isChecked}
                                onCheckedChange={() => toggleTask(task.id)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <label
                                  htmlFor={task.id}
                                  className={cn(
                                    "block cursor-pointer text-xs leading-relaxed",
                                    isChecked && "text-muted-foreground line-through",
                                    !isChecked && "text-foreground"
                                  )}
                                >
                                  {task.description}
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                  {isConstraint && (
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[10px] px-1.5 py-0", getOwnerColor(task.owner))}
                                  >
                                    {task.owner}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {task.age_days}d
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Constraint Summary */}
                      {constraintTask && (
                        <div className="mt-3 rounded-md bg-amber-500/5 border border-amber-500/20 p-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            <span className="font-medium uppercase tracking-wide">Current Constraint</span>
                          </div>
                          <p className="mt-1 text-xs text-foreground/90 line-clamp-1">
                            {constraintTask.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
