import { CALENDAR_EVENTS, ACCOUNTS, OUTCOMES, getAccountName } from "@/lib/mockData";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEK_DATES = ["2026-02-23", "2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27"];

export default function CalendarPage() {
  // Tier A accounts with pending constraints today
  const todayTierA = ACCOUNTS
    .filter((a) => a.revenueTier === "A")
    .map((a) => {
      const outcomes = OUTCOMES.filter((o) => o.accountId === a.id && o.status !== "Verified");
      const constraint = outcomes.flatMap((o) => o.tasks.filter((t) => t.constraint && t.status === "pending"));
      return { account: a, constraint: constraint[0] };
    })
    .filter((x) => x.constraint);

  // Empty state
  if (CALENDAR_EVENTS.length === 0 && ACCOUNTS.length === 0) {
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
        {/* Week view */}
        <div className="flex-1 overflow-auto p-4">
          <h1 className="mb-4 text-xl font-bold text-foreground">Calendar</h1>
          <div className="grid grid-cols-5 gap-3">
            {WEEK_DAYS.map((day, i) => {
              const date = WEEK_DATES[i];
              const events = CALENDAR_EVENTS.filter((e) => e.date === date);
              const isToday = date === "2026-02-23";
              return (
                <div key={day} className="rounded-lg bg-card p-3">
                  <div className={cn("mb-3 flex items-center gap-2", isToday && "text-primary")}>
                    <span className="text-sm font-bold">{day}</span>
                    <span className="text-xs text-muted-foreground">{date.slice(5)}</span>
                    {isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No events</p>
                  ) : (
                    <div className="space-y-1.5">
                      {events.map((e) => (
                        <div key={e.id} className="rounded-md bg-accent px-2.5 py-2">
                          <p className="text-xs font-medium text-foreground">{e.title}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-primary">{e.time}</span>
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-semibold",
                              e.type === "Visit" ? "bg-status-verified/15 text-status-verified" :
                              e.type === "Meeting" ? "bg-primary/15 text-primary" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {e.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-72 border-l border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">Tier A — Pending Constraints</h2>
          <div className="space-y-2">
            {todayTierA.length === 0 ? (
              <p className="text-xs text-muted-foreground">No pending constraints</p>
            ) : (
              todayTierA.map(({ account, constraint }) => (
                <div key={account.id} className="rounded-md bg-accent p-2.5">
                  <p className="text-xs font-medium text-foreground">{account.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{constraint?.title}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
