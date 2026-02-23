import { QUOTES, BACKORDERS, getAccountName, formatCurrency } from "@/lib/mockData";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

function quoteStatusColor(status: string) {
  if (status === "Closed Won") return "bg-status-verified/15 text-status-verified";
  if (status === "Closed Lost") return "bg-status-risk/15 text-status-risk";
  if (status === "Follow-up") return "bg-status-waiting/15 text-status-waiting";
  return "bg-primary/15 text-primary";
}

function boStatusColor(status: string) {
  if (status === "Delayed") return "bg-status-risk/15 text-status-risk";
  if (status === "At Risk") return "bg-status-waiting/15 text-status-waiting";
  return "bg-status-verified/15 text-status-verified";
}

export default function PipelinePage() {
  // Empty state
  if (QUOTES.length === 0 && BACKORDERS.length === 0) {
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
        <h1 className="mb-6 text-xl font-bold text-foreground">Pipeline — Money Board</h1>

        {/* Quotes */}
        <div className="mb-6 rounded-lg bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">Quotes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2 text-right">Days Open</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Next Action</th>
                  <th className="px-3 py-2">Linked Outcome</th>
                </tr>
              </thead>
              <tbody>
                {QUOTES.map((q) => (
                  <tr key={q.id} className="border-b border-border/50 hover:bg-accent">
                    <td className="px-3 py-2.5 font-medium text-foreground">{getAccountName(q.accountId)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">{formatCurrency(q.value)}</td>
                    <td className={cn("px-3 py-2.5 text-right font-mono", q.daysOpen > 30 ? "text-status-risk" : "text-muted-foreground")}>{q.daysOpen}</td>
                    <td className="px-3 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", quoteStatusColor(q.status))}>{q.status}</span></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{q.nextAction}</td>
                    <td className="px-3 py-2.5 text-xs text-primary">{q.linkedOutcomeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Backorders */}
        <div className="rounded-lg bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">Backorders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Ship Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {BACKORDERS.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-accent">
                    <td className="px-3 py-2.5 font-medium text-foreground">{getAccountName(b.accountId)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{b.vendor}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">{formatCurrency(b.value)}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{b.shipDate}</td>
                    <td className="px-3 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", boStatusColor(b.status))}>{b.status}</span></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{b.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
