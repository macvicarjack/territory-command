import { useState } from "react";
import { NOTES, getAccountName, OUTCOMES } from "@/lib/mockData";
import AppLayout from "@/components/AppLayout";
import { Search } from "lucide-react";

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const filtered = NOTES.filter((n) =>
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  // Empty state
  if (NOTES.length === 0) {
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
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Notes</h1>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="h-8 w-56 rounded-md border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((n) => {
            const accountName = n.accountId ? getAccountName(n.accountId) : null;
            const outcomeName = n.outcomeId ? OUTCOMES.find((o) => o.id === n.outcomeId)?.title : null;
            return (
              <div key={n.id} className="rounded-lg bg-card p-4">
                <p className="text-sm text-foreground">{n.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {accountName && <span className="text-[10px] text-primary">{accountName}</span>}
                  {outcomeName && <span className="max-w-[200px] truncate text-[10px] text-muted-foreground">→ {outcomeName}</span>}
                  <span className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                  {n.tags.map((t) => (
                    <span key={t} className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
