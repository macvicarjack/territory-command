import { PROSPECTS } from "@/lib/mockData";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

function statusColor(status: string) {
  if (status === "Qualified") return "bg-status-verified/15 text-status-verified";
  if (status === "Contacted") return "bg-primary/15 text-primary";
  if (status === "Nurture") return "bg-status-waiting/15 text-status-waiting";
  return "bg-muted text-muted-foreground";
}

export default function ProspectsPage() {
  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <h1 className="mb-4 text-xl font-bold text-foreground">Prospects</h1>
        <div className="rounded-lg bg-card p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Next Action</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {PROSPECTS.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-accent">
                  <td className="px-3 py-2.5 font-medium text-foreground">{p.companyName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.contactName}</td>
                  <td className="px-3 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor(p.status))}>{p.status}</span></td>
                  <td className="px-3 py-2.5 text-foreground">{p.nextAction}</td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-muted-foreground">{p.notes}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.lastContactDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
