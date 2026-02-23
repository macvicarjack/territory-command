import { EMAILS, OUTCOMES } from "@/lib/mockData";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, Link as LinkIcon } from "lucide-react";

function tierColor(tier: string) {
  if (tier === "Tier 1") return "bg-status-risk/15 text-status-risk";
  if (tier === "Tier 2") return "bg-status-waiting/15 text-status-waiting";
  return "bg-muted text-muted-foreground";
}

export default function EmailBridgePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = EMAILS.find((e) => e.id === selectedId);
  const linkedOutcome = selected?.linkedOutcomeId ? OUTCOMES.find((o) => o.id === selected.linkedOutcomeId) : null;

  // Empty state
  if (EMAILS.length === 0) {
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
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Email list */}
        <div className="flex-1 overflow-auto p-4">
          <h1 className="mb-4 text-xl font-bold text-foreground">Email Bridge</h1>
          <div className="space-y-1">
            {EMAILS.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
                  selectedId === e.id && "bg-accent"
                )}
              >
                <span className={cn("mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold", tierColor(e.classificationTier))}>{e.classificationTier}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{e.from}</span>
                    {e.linkedOutcomeId && <LinkIcon className="h-3 w-3 text-primary" />}
                  </div>
                  <p className="text-xs text-foreground">{e.subject}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{e.preview}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(e.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 border-l border-border bg-card p-4 overflow-auto">
            <h2 className="text-sm font-bold text-foreground">{selected.subject}</h2>
            <p className="mt-1 text-xs text-muted-foreground">From: {selected.from}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(selected.receivedAt).toLocaleString()}</p>

            <div className="mt-4 rounded-md bg-accent p-3">
              <p className="text-xs text-foreground">{selected.preview}</p>
            </div>

            {linkedOutcome && (
              <div className="mt-4">
                <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Linked Outcome</h3>
                <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2">
                  <p className="text-xs font-medium text-foreground">{linkedOutcome.title}</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" />
                Create Task
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
