import { OUTCOMES, QUOTES, BACKORDERS, ACCOUNTS, CALENDAR_EVENTS, getAccountName, formatCurrency } from "@/lib/mockData";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, DollarSign, Target, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function HomePage() {
  const openQuotesValue = QUOTES.filter((q) => q.status !== "Closed Won" && q.status !== "Closed Lost").reduce((s, q) => s + q.value, 0);
  const backordersValue = BACKORDERS.reduce((s, b) => s + b.value, 0);
  const activeOutcomes = OUTCOMES.filter((o) => o.status === "Active" || o.status === "At Risk");
  const jackOverdue = OUTCOMES.filter((o) => {
    const ct = o.tasks.find((t) => t.constraint);
    return ct && ct.owner === "Jack" && ct.status === "pending";
  });

  // Top constraints by value + age
  const topConstraints = [...OUTCOMES]
    .filter((o) => o.status !== "Verified")
    .sort((a, b) => (b.value * b.daysActive) - (a.value * a.daysActive))
    .slice(0, 5);

  // Aging risk
  const agingRisk = [...OUTCOMES]
    .filter((o) => o.status !== "Verified")
    .sort((a, b) => b.daysActive - a.daysActive)
    .slice(0, 5);

  const todayEvents = CALENDAR_EVENTS.filter((e) => e.date === "2026-02-23");
  const jackTasks = OUTCOMES.flatMap((o) =>
    o.tasks.filter((t) => t.owner === "Jack" && t.status === "pending").map((t) => ({ outcome: o, task: t }))
  ).slice(0, 6);

  const kpis = [
    { label: "Open Quotes", value: formatCurrency(openQuotesValue), icon: DollarSign, color: "text-primary" },
    { label: "Backorders", value: formatCurrency(backordersValue), icon: AlertTriangle, color: "text-status-waiting" },
    { label: "Active Outcomes", value: activeOutcomes.length, icon: Target, color: "text-foreground" },
    { label: "Jack Blockers", value: jackOverdue.length, icon: Clock, color: "text-status-risk" },
  ];

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <h1 className="mb-6 text-xl font-bold text-foreground">Command Center</h1>

        {/* KPI Strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg bg-card p-4 glow-hover">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="mt-1.5 text-2xl font-bold text-foreground">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Break These Constraints Today */}
          <div className="rounded-lg bg-card p-4">
            <h2 className="mb-3 text-sm font-bold text-foreground">Break These Constraints Today</h2>
            <div className="space-y-1.5">
              {topConstraints.map((o) => {
                const ct = o.tasks.find((t) => t.constraint);
                return (
                  <Link key={o.id} to={`/outcomes/${o.id}`} className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${o.constraintOwner === "Jack" ? "bg-status-risk" : "bg-status-waiting"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{ct?.description}</p>
                      <p className="text-[10px] text-muted-foreground">{getAccountName(o.accountId)} · {formatCurrency(o.value)} · {o.daysActive}d</p>
                    </div>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Aging Risk */}
          <div className="rounded-lg bg-card p-4">
            <h2 className="mb-3 text-sm font-bold text-foreground">Aging Risk</h2>
            <div className="space-y-1.5">
              {agingRisk.map((o) => (
                <Link key={o.id} to={`/outcomes/${o.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <span className="text-xs font-mono font-bold text-status-risk">{o.daysActive}d</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{o.title}</p>
                    <p className="text-[10px] text-muted-foreground">{getAccountName(o.accountId)} · {formatCurrency(o.value)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Today Panel */}
          <div className="space-y-4">
            {/* Meetings */}
            <div className="rounded-lg bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">Today's Schedule</h2>
              {todayEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events today.</p>
              ) : (
                <div className="space-y-1.5">
                  {todayEvents.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                      <span className="text-xs font-mono text-primary">{e.time}</span>
                      <p className="truncate text-xs text-foreground">{e.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jack's Action List */}
            <div className="rounded-lg bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">Your Action List</h2>
              <div className="space-y-1">
                {jackTasks.map(({ outcome, task }) => (
                  <div key={task.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">{task.description}</p>
                      <p className="text-[10px] text-muted-foreground">{getAccountName(outcome.accountId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
