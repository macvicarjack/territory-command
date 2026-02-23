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

const fallbackSummary = {
  total_active_outcomes: 7,
  total_jack_blockers: 3,
  open_quotes_total: 1000000,
  backorders_total: 135000,
};

const fallbackConstraints = [
  { customer: "Global Dynamics", task: "Prepare ROI analysis from Year 1 data", revenue: 320000, tier: "A", age_days: 45 },
  { customer: "Nexus Health", task: "Demo to selection committee", revenue: 150000, tier: "A", age_days: 30 },
  { customer: "Summit Partners", task: "Wait for Q2 budget cycle to open", revenue: 75000, tier: "B", age_days: 60 },
  { customer: "TechFlow Inc", task: "Deliver integration documentation", revenue: 180000, tier: "A", age_days: 22 },
  { customer: "Acme Corp", task: "Send revised proposal with updated pricing", revenue: 250000, tier: "A", age_days: 14 },
];

const fallbackAgingRisks = [
  { title: "Land Initial POC — New Logo Acquisition", customer: "Summit Partners", revenue: 75000, age_days: 68 },
  { title: "Secure Multi-Year Renewal — Prevent Churn", customer: "Global Dynamics", revenue: 320000, age_days: 45 },
  { title: "Win Competitive Displacement — Replace Legacy", customer: "Nexus Health", revenue: 150000, age_days: 30 },
  { title: "Expand Pilot to Full Deployment — 500 Seats", customer: "TechFlow Inc", revenue: 180000, age_days: 22 },
  { title: "Convert Pilot to Annual Contract", customer: "Beacon Logistics", revenue: 120000, age_days: 18 },
];

const fallbackSchedule = [
  { time: "09:00", label: "Acme Corp — Pricing Review" },
  { time: "11:00", label: "TechFlow — Integration Check-in" },
  { time: "14:00", label: "Nexus Health — Demo Prep" },
];

const fallbackActions = [
  { task: "Send revised proposal with updated pricing", customer: "Acme Corp" },
  { task: "Run training session for ops team", customer: "TechFlow Inc" },
  { task: "Prepare ROI analysis from Year 1 data", customer: "Global Dynamics" },
  { task: "Demo to selection committee", customer: "Nexus Health" },
  { task: "Schedule executive apology call", customer: "Cortland Manufacturing" },
  { task: "Draft annual pricing proposal", customer: "Beacon Logistics" },
];

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

export default function HitList() {
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


  const summary = dashboard?.data?.summary || fallbackSummary;
  const constraints = dashboard?.data?.top_constraints || (dashboard ? [] : fallbackConstraints);
  const agingRisks = dashboard?.data?.aging_risks || (dashboard ? [] : fallbackAgingRisks);
  const schedule = dashboard?.data?.schedule || (dashboard ? [] : fallbackSchedule);
  const actions = dashboard?.data?.action_list || (dashboard ? [] : fallbackActions);


  if (isLoading && !isError) {
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
              <h2 className="mb-4 text-base font-bold text-foreground">Today's Schedule</h2>
              <div className="space-y-2.5">
                {schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="shrink-0 font-mono text-xs font-semibold text-primary">{s.time}</span>
                    <p className="text-sm text-foreground">{s.label}</p>
                  </div>
                ))}
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
