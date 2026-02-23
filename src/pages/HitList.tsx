import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOutcomes, toggleTaskStatus } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  ClipboardList,
  MapPin,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Outcome, Task } from "@/types/outcome";
import DashboardLayout from "@/components/DashboardLayout";

function getJackTasks(outcomes: Outcome[]): { outcome: Outcome; task: Task }[] {
  return outcomes
    .filter((o) => o.status === "active")
    .flatMap((o) =>
      o.tasks
        .filter((t) => t.owner === "Jack" && t.status === "pending")
        .map((t) => ({ outcome: o, task: t }))
    )
    .slice(0, 6);
}

function getPipelineDeals(outcomes: Outcome[]) {
  return outcomes.filter((o) => o.status === "active" || o.status === "deferred");
}

function getStatusTag(outcome: Outcome) {
  const constraint = outcome.tasks.find((t) => t.id === outcome.constraint_task_id);
  if (!constraint) return { label: "Active", color: "bg-primary/15 text-primary" };
  if (constraint.status === "done") return { label: "Progressing", color: "bg-status-done/15 text-status-done" };
  if (constraint.owner === "Jack") return { label: "Follow-up", color: "bg-owner-jack/15 text-owner-jack" };
  return { label: "Waiting", color: "bg-owner-other/15 text-owner-other" };
}

const recentActivity = [
  { text: "Sent revised proposal to Acme Corp", time: "2h ago" },
  { text: "Completed security review for Nexus Health", time: "5h ago" },
  { text: "Added new lead: Summit Partners", time: "1d ago" },
  { text: "Closed integration docs for TechFlow", time: "2d ago" },
];


interface DashboardData {
  status: string;
  data: {
    summary: {
      total_active_outcomes: number;
      total_jack_blockers: number;
      open_quotes_total: number;
      backorders_total: number;
    };
    top_constraints: Array<{
      customer: string;
      task: string;
      revenue: number;
      tier: string;
    }>;
  };
}

export default function HitList() {
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("https://roofingsalessystems.app.n8n.cloud/webhook/lovable-territory-data");
      if (!res.ok) throw new Error("API error");
      return res.json();
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const fallbackSummary = {
    total_active_outcomes: 12,
    total_jack_blockers: 3,
    open_quotes_total: 8,
    backorders_total: 2,
  };

  const fallbackConstraints = [
    { customer: "Acme Corp", task: "Send revised proposal with updated pricing", revenue: 45000, tier: "A" },
    { customer: "Nexus Health", task: "Complete security review documentation", revenue: 32000, tier: "A" },
    { customer: "Summit Partners", task: "Schedule follow-up demo with CTO", revenue: 28000, tier: "B" },
    { customer: "TechFlow Inc", task: "Deliver integration specs to engineering", revenue: 19000, tier: "B" },
  ];

  const summary = dashboard?.data?.summary || fallbackSummary;
  const topConstraints = dashboard?.data?.top_constraints || fallbackConstraints;

  const outcomes: any[] = [];

  const toggleMutation = useMutation({
    mutationFn: toggleTaskStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outcomes"] }),
  });

  const jackTasks = getJackTasks(outcomes);
  const pipeline = getPipelineDeals(outcomes);
  const active = outcomes.filter((o) => o.status === "active");
  const totalTasks = outcomes.reduce((sum, o) => sum + o.tasks.length, 0);
  const doneTasks = outcomes.reduce((sum, o) => sum + o.tasks.filter((t) => t.status === "done").length, 0);
  const jackBlockers = outcomes.filter((o) => {
    const c = o.tasks.find((t) => t.id === o.constraint_task_id);
    return c && c.owner === "Jack" && c.status === "pending";
  }).length;

  if (isLoading && !isError) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.total_active_outcomes} active deals · {summary.total_jack_blockers} blockers on you
            </p>
          </div>
          <Link
            to="/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>

        {/* Metrics Strip */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Deals", value: summary.total_active_outcomes, icon: TrendingUp },
            { label: "Your Blockers", value: summary.total_jack_blockers, icon: Clock },
            { label: "Open Quotes", value: summary.open_quotes_total, icon: FileText },
            { label: "Backorders", value: summary.backorders_total, icon: Activity },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-card p-4 glow-hover"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Grid: 3 columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today Panel */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-card p-5">
              <h2 className="mb-4 text-lg font-bold text-foreground">Today</h2>
              {topConstraints.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending tasks. Nice work.</p>
              ) : (
                <div className="space-y-2">
                  {topConstraints.map((c, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent"
                    >
                      <div className="mt-1.5 shrink-0">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground">
                          {c.task}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {c.customer} · {c.tier}-tier
                        </p>
                      </div>
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-owner-jack" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 rounded-lg bg-card p-5">
              <h2 className="mb-4 text-lg font-bold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: ClipboardList, label: "Add Task" },
                  { icon: MapPin, label: "Log Visit" },
                  { icon: FileText, label: "New Quote" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 rounded-lg bg-accent p-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <action.icon className="h-5 w-5" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Panel */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Pipeline</h2>
                <span className="text-xs text-muted-foreground">{pipeline.length} deals</span>
              </div>
              <div className="space-y-1">
                {pipeline.map((o) => {
                  const tag = getStatusTag(o);
                  const doneCt = o.tasks.filter((t) => t.status === "done").length;
                  return (
                    <Link
                      key={o.id}
                      to={`/outcome/${o.id}`}
                      className="group flex items-center gap-4 rounded-md px-3 py-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {o.customer_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {o.title}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${tag.color}`}>
                        {tag.label}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {doneCt}/{o.tasks.length}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="mt-4 rounded-lg bg-card p-5">
              <h2 className="mb-4 text-lg font-bold text-foreground">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
