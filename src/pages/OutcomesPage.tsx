import { useState } from "react";
import { OUTCOMES, getAccountName, formatCurrency } from "@/lib/mockData";
import { Outcome } from "@/types/models";
import AppLayout from "@/components/AppLayout";
import { X, CheckCircle2, Circle, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function statusColor(status: string) {
  if (status === "At Risk") return "bg-status-risk/15 text-status-risk";
  if (status === "Verified") return "bg-status-verified/15 text-status-verified";
  return "bg-primary/15 text-primary";
}

function ownerColor(owner: string) {
  return owner === "Jack" ? "text-status-risk" : "text-status-waiting";
}

export default function OutcomesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = OUTCOMES.find((o) => o.id === selectedId);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Table */}
        <div className={cn("flex-1 overflow-auto p-4", selected && "hidden lg:block")}>
          <h1 className="mb-4 text-xl font-bold text-foreground">Outcomes</h1>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Blocking Constraint</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2 text-right">Days</th>
                  <th className="px-3 py-2">Last Move</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {OUTCOMES.map((o) => {
                  const ct = o.tasks.find((t) => t.constraint);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedId(o.id)}
                      className={cn(
                        "cursor-pointer border-b border-border/50 transition-colors hover:bg-accent",
                        selectedId === o.id && "bg-accent"
                      )}
                    >
                      <td className="max-w-[200px] truncate px-3 py-2.5 font-medium text-foreground">{o.title}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{getAccountName(o.accountId)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-foreground">{formatCurrency(o.value)}</td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-foreground">{ct?.description ?? "—"}</td>
                      <td className={cn("px-3 py-2.5 font-medium", ownerColor(o.constraintOwner))}>{o.constraintOwner}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{o.daysActive}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{o.lastMovementDate}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor(o.status))}>{o.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Drawer */}
        {selected && (
          <div className="w-full border-l border-border bg-card lg:w-[400px]">
            <div className="flex h-full flex-col overflow-auto p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor(selected.status))}>{selected.status}</span>
                  <h2 className="mt-2 text-sm font-bold text-foreground">{selected.title}</h2>
                  <p className="text-xs text-muted-foreground">{getAccountName(selected.accountId)} · {formatCurrency(selected.value)}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks */}
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tasks</h3>
              <div className="mb-4 space-y-1">
                {/* Constraint pinned */}
                {selected.tasks.filter((t) => t.constraint).map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-md border border-status-risk/20 bg-status-risk-bg px-2.5 py-2">
                    {t.status === "done" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-status-done" /> : <Circle className="mt-0.5 h-3.5 w-3.5 text-status-risk" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">⚡ Constraint · {t.owner}</p>
                    </div>
                  </div>
                ))}
                {selected.tasks.filter((t) => !t.constraint).map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-md px-2.5 py-2 hover:bg-accent">
                    {t.status === "done" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-status-done" /> : <Circle className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs", t.status === "done" ? "text-muted-foreground line-through" : "text-foreground")}>{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{t.owner}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Notes</h3>
              <div className="mb-4 space-y-1.5">
                {selected.notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No notes yet.</p>
                ) : (
                  selected.notes.map((n, i) => (
                    <p key={i} className="rounded-md bg-accent px-2.5 py-2 text-xs text-foreground">{n}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
