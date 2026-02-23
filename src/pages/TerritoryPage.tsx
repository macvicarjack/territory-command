import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ACCOUNTS, formatCurrency } from "@/lib/mockData";
import { TerritorySection, Account } from "@/types/models";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const sections: TerritorySection[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function tierColor(tier: string) {
  if (tier === "A") return "bg-status-risk/15 text-status-risk";
  if (tier === "B") return "bg-status-waiting/15 text-status-waiting";
  return "bg-muted text-muted-foreground";
}

export default function TerritoryPage() {
  const [selectedSection, setSelectedSection] = useState<TerritorySection | null>(null);
  const filtered = selectedSection ? ACCOUNTS.filter((a) => a.territorySection === selectedSection) : ACCOUNTS;
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  // Empty state
  if (ACCOUNTS.length === 0) {
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
        {/* Sections sidebar */}
        <div className="w-48 shrink-0 border-r border-border bg-card p-3">
          <h2 className="mb-3 text-sm font-bold text-foreground">Sections</h2>
          <button
            onClick={() => setSelectedSection(null)}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors",
              !selectedSection ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            All ({ACCOUNTS.length})
          </button>
          {sections.map((s) => {
            const ct = ACCOUNTS.filter((a) => a.territorySection === s).length;
            return (
              <button
                key={s}
                onClick={() => setSelectedSection(s)}
                className={cn(
                  "mb-0.5 w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors",
                  selectedSection === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                Section {s} <span className="text-muted-foreground">({ct})</span>
              </button>
            );
          })}
        </div>

        {/* Account table (virtualized) */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Territory</h1>
            <span className="text-xs text-muted-foreground">{filtered.length} accounts</span>
          </div>
          {/* Header row */}
          <div className="flex border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="w-[200px] shrink-0">Account</span>
            <span className="w-[60px] shrink-0 text-center">Tier</span>
            <span className="w-[100px] shrink-0 text-right">Revenue</span>
            <span className="w-[90px] shrink-0 text-center">Last Touch</span>
            <span className="w-[80px] shrink-0 text-center">Outcomes</span>
            <span className="w-[80px] shrink-0 text-center">Quotes</span>
            <span className="w-[60px] shrink-0 text-center">Sec.</span>
          </div>
          <div ref={parentRef} className="h-[calc(100%-80px)] overflow-auto scrollbar-thin">
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const a = filtered[virtualRow.index];
                return (
                  <div
                    key={a.id}
                    className="absolute left-0 top-0 flex w-full items-center border-b border-border/30 px-3 py-2 text-xs hover:bg-accent"
                    style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <span className="w-[200px] shrink-0 truncate font-medium text-foreground">{a.name}</span>
                    <span className="w-[60px] shrink-0 text-center"><span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", tierColor(a.revenueTier))}>{a.revenueTier}</span></span>
                    <span className="w-[100px] shrink-0 text-right font-mono text-muted-foreground">{formatCurrency(a.revenue)}</span>
                    <span className="w-[90px] shrink-0 text-center text-muted-foreground">{a.lastTouchDate.slice(5)}</span>
                    <span className="w-[80px] shrink-0 text-center text-foreground">{a.openOutcomes}</span>
                    <span className="w-[80px] shrink-0 text-center text-foreground">{a.openQuotes}</span>
                    <span className="w-[60px] shrink-0 text-center text-muted-foreground">{a.territorySection}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
