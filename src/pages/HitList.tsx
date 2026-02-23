import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  DollarSign,
  AlertTriangle,
  Target,
  Clock,
  Circle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

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
      age_days?: number;
    }>;
    aging_risks?: Array<{
      title: string;
      customer: string;
      revenue: number;
      age_days: number;
    }>;
    schedule?: Array<{
      time: string;
      label: string;
    }>;
    action_list?: Array<{
      task: string;
      customer: string;
    }>;
  };
}

interface CalendarEvent {
  Id: string;
  Subject: string;
  StartDateTime: string;
  EndDateTime: string;
  Account?: {
    Name: string;
  };
}

const fallbackSummary = {
  open_quotes_total: 0,
  backorders_total: 0,
  total_active_outcomes: 0,
  total_jack_blockers: 0,
};
const fallbackConstraints: any[] = [];
const fallbackAgingRisks: any[] = [];
const fallbackSchedule: any[] = [];
const fallbackActions: any[] = [];

function formatCurrency(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function getAgeDayColor(days: number) {
  if (days >= 60) return "text-red-400";
  if (days >= 30) return "text-yellow-400";
  return "text-orange-400";
}

function getConstraintDot(age_days?: number) {
  if (!age_days) return "bg-owner-jack";
  if (age_days >= 30) return "bg-red-400";
  return "bg-yellow-400";
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function HitList() {
  const { data: dashboard, isLoading: dashboardLoading, isError: dashboardError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      console.log("FETCHING FROM N8N...");
      const res = await fetch(`${FLASK_TUNNEL}/api/territory/hitlist`);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      console.log("API DATA RECEIVED:", json);
      return json;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Fetch today's calendar events from Salesforce
  const today = new Date().toISOString().split("T")[0];
  const { data: calendarEvents, isLoading: calendarLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar", today],
    queryFn: async () => {
      const res = await fetch(`${FLASK_TUNNEL}/api/salesforce/calendar?start=${today}&end=${today}`);
      if (!res.ok) throw new Error("Calendar API error");
      const json = await res.json();
      return json.events || json.data || [];
    },
    refetchInterval: 60000,
    retry: 1,
    enabled: !dashboardLoading,
  });

  const summary = dashboard?.data?.summary || fallbackSummary;
  const constraints = dashboard?.data?.top_constraints || (dashboard ? [] : fallbackConstraints);
  const agingRisks = dashboard?.data?.aging_risks || (dashboard ? [] : fallbackAgingRisks);
  const schedule = dashboard?.data?.schedule || (dashboard ? [] : fallbackSchedule);
  const actions = dashboard?.data?.action_list || (dashboard ? [] : fallbackActions);

  // Use real calendar events if available, otherwise fallback to placeholder schedule
  const displaySchedule = calendarEvents && calendarEvents.length > 0
    ? calendarEvents
        .sort((a, b) => new Date(a.StartDateTime).getTime() - new Date(b.StartDateTime).getTime())
        .map((event) => ({
          time: formatTime(event.StartDateTime),
          label: `${event.Subject}${event.Account ? ` — ${event.Account.Name}` : ""}`,
        }))
    : schedule.map((s) => ({ time: s.time, label: s.label }));

  if (dashboardLoading && !dashboardError) {
    return (
      <AppLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <h1 className="mb-5 text-xl font-bold text-foreground">Command Center</h1>

        {/* KPI Strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="OPEN QUOTES" value={formatCurrency(summary.open_quotes_total)} icon={<DollarSign className="h-4 w-4 text-primary" />} />
          <KpiCard label="BACKORDERS" value={formatCurrency(summary.backorders_total)} icon={<AlertTriangle className="h-4 w-4 text-yellow-400" />} />
          <KpiCard label="ACTIVE OUTCOMES" value={String(summary.total_active_outcomes)} icon={<Target className="h-4 w-4 text-muted-foreground" />} />
          <KpiCard label="JACK BLOCKERS" value={String(summary.total_jack_blockers)} icon={<Clock className="h-4 w-4 text-red-400" />} />
        </div>

        {/* 3-Column Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Break These Constraints Today */}
          <div className="rounded-lg bg-card p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">Break These Constraints Today</h2>
            <div className="space-y-3">
              {constraints.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${getConstraintDot(c.age_days)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{c.task}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.customer} · {formatCurrency(c.revenue)} · {c.age_days || 0}d
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aging Risk */}
          <div className="rounded-lg bg-card p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">Aging Risk</h2>
            <div className="space-y-3">
              {agingRisks.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 text-xs font-bold tabular-nums ${getAgeDayColor(r.age_days)}`}>
                    {r.age_days}d
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.customer} · {formatCurrency(r.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Schedule + Action List */}
          <div className="space-y-4">
            {/* Today's Schedule */}
            <div className="rounded-lg bg-card p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Today&apos;s Schedule
                {calendarLoading && <span className="ml-2 text-xs text-muted-foreground">(loading...)</span>}
                {calendarEvents && calendarEvents.length > 0 && (
                  <span className="ml-2 text-xs text-emerald-400">({calendarEvents.length} events)</span>
                )}
              </h2>
              <div className="space-y-2.5">
                {displaySchedule.length > 0 ? (
                  displaySchedule.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="shrink-0 font-mono text-xs font-semibold text-primary">{s.time}</span>
                      <p className="text-sm text-foreground">{s.label}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No events scheduled for today</p>
                )}
              </div>
            </div>

            {/* Your Action List */}
            <div className="rounded-lg bg-card p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">Your Action List</h2>
              <div className="space-y-2.5">
                {actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{a.task}</p>
                      <p className="text-xs text-muted-foreground">{a.customer}</p>
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

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
