import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { formatCurrency } from "@/lib/utils";
import { Loader2, DollarSign, Briefcase, FileText, TrendingUp, Calendar, Building2, Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

// API base URL - uses the Flask tunnel

interface Opportunity {
  Id: string;
  Name: string;
  AccountId: string;
  AccountName: string;
  Amount: number;
  StageName: string;
  CloseDate: string;
  CreatedDate: string;
  Description: string;
  NextStep: string;
  Probability: number;
}

interface Quote {
  id: string;
  customer: string;
  title: string;
  revenue: number;
  age_days: number;
  status: string;
}

interface PipelineData {
  pipeline: Opportunity[];
  count: number;
  total_value: number;
}

interface QuotesSummary {
  total_quotes: number;
  total_value: number;
  quotes: Quote[];
}

// Stage color mapping
const stageColors: Record<string, { bg: string; text: string; bar: string }> = {
  "Prospecting": { bg: "bg-blue-500/15", text: "text-blue-400", bar: "bg-blue-500" },
  "Investigate": { bg: "bg-blue-500/15", text: "text-blue-400", bar: "bg-blue-500" },
  "Qualification": { bg: "bg-yellow-500/15", text: "text-yellow-400", bar: "bg-yellow-500" },
  "Probe": { bg: "bg-yellow-500/15", text: "text-yellow-400", bar: "bg-yellow-500" },
  "Proposal": { bg: "bg-orange-500/15", text: "text-orange-400", bar: "bg-orange-500" },
  "Apply": { bg: "bg-orange-500/15", text: "text-orange-400", bar: "bg-orange-500" },
  "Negotiation": { bg: "bg-red-500/15", text: "text-red-400", bar: "bg-red-500" },
  "Convince": { bg: "bg-red-500/15", text: "text-red-400", bar: "bg-red-500" },
  "Tie Up": { bg: "bg-red-500/15", text: "text-red-400", bar: "bg-red-500" },
  "Closed Won": { bg: "bg-green-500/15", text: "text-green-400", bar: "bg-green-500" },
  "Closed Lost": { bg: "bg-gray-500/15", text: "text-gray-400", bar: "bg-gray-500" },
};

function getStageColor(stageName: string) {
  return stageColors[stageName] || { bg: "bg-slate-500/15", text: "text-slate-400", bar: "bg-slate-500" };
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calculateDaysUntil(dateStr: string) {
  if (!dateStr) return null;
  const close = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  colorClass 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl bg-card p-5 border border-border/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("rounded-lg p-2.5", colorClass)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  const stageColors = getStageColor(opp.StageName);
  const daysUntil = calculateDaysUntil(opp.CloseDate);
  
  return (
    <div className="rounded-xl bg-card p-5 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{opp.Name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{opp.AccountName || "—"}</span>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", stageColors.bg, stageColors.text)}>
          {opp.StageName}
        </span>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(opp.Amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Close Date</p>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={cn(
              "text-sm font-medium",
              daysUntil !== null && daysUntil < 7 ? "text-red-400" : "text-foreground"
            )}>
              {formatDate(opp.CloseDate)}
            </span>
          </div>
          {daysUntil !== null && (
            <p className={cn(
              "text-xs mt-0.5",
              daysUntil < 0 ? "text-red-400" : daysUntil < 7 ? "text-yellow-400" : "text-muted-foreground"
            )}>
              {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
            </p>
          )}
        </div>
      </div>
      
      {/* Probability bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Probability</span>
          <span className="font-medium text-foreground">{opp.Probability}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", stageColors.bar)}
            style={{ width: `${opp.Probability}%` }}
          />
        </div>
      </div>
      
      {opp.NextStep && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Step</p>
              <p className="text-sm text-foreground mt-0.5">{opp.NextStep}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <div className="rounded-xl bg-card p-5 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{quote.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{quote.customer}</span>
          </div>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
          quote.status === "active" ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"
        )}>
          {quote.status}
        </span>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(quote.revenue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Age</p>
          <p className={cn(
            "text-sm font-medium",
            quote.age_days > 30 ? "text-red-400" : quote.age_days > 14 ? "text-yellow-400" : "text-foreground"
          )}>
            {quote.age_days} days
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<"projects" | "quotes">("projects");
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [quotesData, setQuotesData] = useState<QuotesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both endpoints in parallel
        const [pipelineRes, quotesRes] = await Promise.all([
          fetch(`${API_BASE}/api/salesforce/pipeline`),
          fetch(`${API_BASE}/api/territory/quotes-summary`)
        ]);
        
        if (!pipelineRes.ok) {
          const errData = await pipelineRes.json().catch(() => ({}));
          throw new Error(errData.error || `Pipeline API error: ${pipelineRes.status}`);
        }
        
        if (!quotesRes.ok) {
          const errData = await quotesRes.json().catch(() => ({}));
          throw new Error(errData.error || `Quotes API error: ${quotesRes.status}`);
        }
        
        const pipeline = await pipelineRes.json();
        const quotes = await quotesRes.json();
        
        setPipelineData(pipeline);
        setQuotesData(quotes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Calculate KPIs
  const totalPipelineValue = pipelineData?.total_value || 0;
  const projectCount = pipelineData?.count || 0;
  const quoteCount = quotesData?.total_quotes || 0;
  const totalQuotesValue = quotesData?.total_value || 0;
  const avgDealSize = projectCount > 0 ? totalPipelineValue / projectCount : 0;
  const combinedValue = totalPipelineValue + totalQuotesValue;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading pipeline data...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground">Salesforce opportunities and open quotes</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Pipeline"
            value={formatCurrency(combinedValue)}
            subtitle={`${projectCount} projects + ${quoteCount} quotes`}
            icon={DollarSign}
            colorClass="bg-emerald-500"
          />
          <KPICard
            title="SF Opportunities"
            value={projectCount.toString()}
            subtitle={formatCurrency(totalPipelineValue)}
            icon={Briefcase}
            colorClass="bg-blue-500"
          />
          <KPICard
            title="Open Quotes"
            value={quoteCount.toString()}
            subtitle={formatCurrency(totalQuotesValue)}
            icon={FileText}
            colorClass="bg-purple-500"
          />
          <KPICard
            title="Avg Deal Size"
            value={formatCurrency(avgDealSize)}
            subtitle="Per opportunity"
            icon={TrendingUp}
            colorClass="bg-orange-500"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("projects")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "projects"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Projects ({projectCount})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("quotes")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "quotes"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quotes ({quoteCount})
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === "projects" && (
          <div>
            {pipelineData?.pipeline.length === 0 ? (
              <div className="rounded-xl bg-card p-12 text-center border border-border/50">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No SF opportunities found</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  No open opportunities over $2,500 found in Salesforce. 
                  Opportunities will appear here when they meet the criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {pipelineData?.pipeline.map((opp) => (
                  <OpportunityCard key={opp.Id} opp={opp} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "quotes" && (
          <div>
            {quotesData?.quotes.length === 0 ? (
              <div className="rounded-xl bg-card p-12 text-center border border-border/50">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No open quotes</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  No active quotes found in the outcomes data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {quotesData?.quotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
