import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";

// Types
interface FollowUp {
  id: string;
  account: string;
  action: string;
  due_date: string;
  created: string;
  completed: boolean;
  completed_date?: string;
  type?: string;
  source?: string;
}

interface OutreachEntry {
  timestamp: string;
  account: string;
  type: "call" | "email" | "visit";
  notes: string;
}

interface DormantAccount {
  id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  last_activity?: string | null;
}

interface Scorecard {
  week_start: string;
  week_end: string;
  touches: {
    A: { actual: number; target: number };
    B: { actual: number; target: number };
    Whitespace: { actual: number; target: number };
    Dormant: { actual: number; target: number };
  };
  conversations: { actual: number; target: number };
}

// Follow-up type config
const FOLLOWUP_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  cq: { label: "Customer Quote", color: "text-blue-400", bg: "bg-blue-500/20" },
  vd: { label: "Vendor Delivery", color: "text-purple-400", bg: "bg-purple-500/20" },
  iq: { label: "Inside Question", color: "text-orange-400", bg: "bg-orange-500/20" },
  ii: { label: "Inside Issue", color: "text-red-400", bg: "bg-red-500/20" },
  ip: { label: "Inside Product", color: "text-pink-400", bg: "bg-pink-500/20" },
  vq: { label: "Vendor Quote", color: "text-green-400", bg: "bg-green-500/20" },
  ad: { label: "Admin", color: "text-gray-400", bg: "bg-gray-500/20" },
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function ProspectsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [outreachLog, setOutreachLog] = useState<OutreachEntry[]>([]);
  const [dormantAccounts, setDormantAccounts] = useState<DormantAccount[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"activity" | "name">("activity");

  // Forms
  const [newFollowUp, setNewFollowUp] = useState({ account: "", action: "", due_date: "", type: "cq" });
  const [newOutreach, setNewOutreach] = useState<{ account: string; type: string; notes: string }>({ account: "", type: "call", notes: "" });
  const [outreachDialogOpen, setOutreachDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  useEffect(() => {
    fetchData();
    fetchScorecard();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/prospects`);
      const data = await res.json();
      setFollowUps(data.follow_ups || []);
      setOutreachLog(data.outreach_log || []);
      setDormantAccounts(data.dormant_accounts || []);
    } catch (e) {
      console.error("Failed to fetch prospects:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchScorecard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/prospects/scorecard`);
      const data = await res.json();
      setScorecard(data);
    } catch (e) {
      console.error("Failed to fetch scorecard:", e);
    }
  };

  const handleCompleteFollowUp = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/prospects/follow-up/${id}/complete`, {
        method: "PATCH",
      });
      if (res.ok) {
        setFollowUps(followUps.map(f => f.id === id ? { ...f, completed: true, completed_date: new Date().toISOString() } : f));
      }
    } catch (e) {
      console.error("Failed to complete follow-up:", e);
    }
  };

  const handleAddFollowUp = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/prospects/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFollowUp),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowUps([...followUps, data.followup]);
        setNewFollowUp({ account: "", action: "", due_date: "", type: "cq" });
      }
    } catch (e) {
      console.error("Failed to add follow-up:", e);
    }
  };

  const handleLogOutreach = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/prospects/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: selectedAccount,
          type: newOutreach.type,
          notes: newOutreach.notes,
        }),
      });
      if (res.ok) {
        fetchScorecard();
        setOutreachDialogOpen(false);
        setNewOutreach({ account: "", type: "call", notes: "" });
      }
    } catch (e) {
      console.error("Failed to log outreach:", e);
    }
  };

  // Filter and sort follow-ups
  const pendingFollowUps = followUps.filter(f => !f.completed);
  const filteredFollowUps = typeFilter === "all" 
    ? pendingFollowUps 
    : pendingFollowUps.filter(f => f.type === typeFilter);

  // Sort follow-ups by due date (overdue first)
  const today = new Date().toISOString().split("T")[0];
  const sortedFollowUps = [...filteredFollowUps].sort((a, b) => {
    const aOverdue = a.due_date < today;
    const bOverdue = b.due_date < today;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.due_date.localeCompare(b.due_date);
  });

  // Sort dormant accounts
  const sortedDormant = [...dormantAccounts].sort((a, b) => {
    if (sortBy === "activity") {
      // Sort by last activity (null/never first, then oldest)
      if (!a.last_activity && !b.last_activity) return a.name.localeCompare(b.name);
      if (!a.last_activity) return -1;
      if (!b.last_activity) return 1;
      return a.last_activity.localeCompare(b.last_activity);
    }
    return a.name.localeCompare(b.name);
  });

  const getDueDateColor = (dueDate: string) => {
    if (dueDate < today) return "text-red-400";
    if (dueDate === today) return "text-yellow-400";
    return "text-green-400";
  };

  const getProgressPercent = (actual: number, target: number) => {
    return Math.min(100, Math.round((actual / target) * 100));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading prospects...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header with Scorecard */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">Prospects</h1>
            <p className="text-muted-foreground">Manage follow-ups and dormant accounts</p>
          </div>
          
          {/* Weekly Scorecard */}
          {scorecard && (
            <div className="bg-card rounded-lg p-4 border border-border min-w-[300px]">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Weekly Scorecard
              </h2>
              <div className="space-y-3">
                {Object.entries(scorecard.touches).map(([key, data]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{key} Touches</span>
                      <span className="text-foreground font-medium">{data.actual}/{data.target}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          key === "A" ? "bg-emerald-500" :
                          key === "B" ? "bg-blue-500" :
                          key === "Whitespace" ? "bg-purple-500" : "bg-orange-500"
                        )}
                        style={{ width: `${getProgressPercent(data.actual, data.target)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Conversations</span>
                    <span className="text-foreground font-medium">{scorecard.conversations.actual}/{scorecard.conversations.target}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${getProgressPercent(scorecard.conversations.actual, scorecard.conversations.target)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Active Follow-ups */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Active Follow-ups</h2>
              <p className="text-sm text-muted-foreground">{pendingFollowUps.length} pending</p>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(FOLLOWUP_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Follow-up
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Follow-up</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Account</label>
                      <Input 
                        value={newFollowUp.account}
                        onChange={e => setNewFollowUp({ ...newFollowUp, account: e.target.value })}
                        placeholder="Account name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Action</label>
                      <Input 
                        value={newFollowUp.action}
                        onChange={e => setNewFollowUp({ ...newFollowUp, action: e.target.value })}
                        placeholder="What needs to be done?"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Due Date</label>
                        <Input 
                          type="date"
                          value={newFollowUp.due_date}
                          onChange={e => setNewFollowUp({ ...newFollowUp, due_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <Select 
                          value={newFollowUp.type} 
                          onValueChange={v => setNewFollowUp({ ...newFollowUp, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FOLLOWUP_TYPES).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAddFollowUp} className="w-full">Add Follow-up</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="divide-y divide-border">
            {sortedFollowUps.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No pending follow-ups
              </div>
            ) : (
              sortedFollowUps.map(followUp => {
                const typeConfig = FOLLOWUP_TYPES[followUp.type || "cq"];
                const isOverdue = followUp.due_date < today;
                const isToday = followUp.due_date === today;
                
                return (
                  <div key={followUp.id} className="p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors">
                    <Checkbox 
                      checked={false}
                      onCheckedChange={() => handleCompleteFollowUp(followUp.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{followUp.account}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", typeConfig?.bg, typeConfig?.color)}>
                          {typeConfig?.label || followUp.type}
                        </span>
                        {isOverdue && <span className="text-xs text-red-400 font-medium">Overdue</span>}
                        {isToday && <span className="text-xs text-yellow-400 font-medium">Today</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{followUp.action}</p>
                    </div>
                    <div className={cn("text-sm font-medium", getDueDateColor(followUp.due_date))}>
                      {followUp.due_date}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Dormant/Cold Accounts */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Dormant/Cold Accounts</h2>
              <p className="text-sm text-muted-foreground">No activity in 90+ days • {dormantAccounts.length} accounts</p>
            </div>
            <Select value={sortBy} onValueChange={(v: "activity" | "name") => setSortBy(v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Last Activity</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {sortedDormant.map(account => (
              <div key={account.id} className="bg-background rounded-lg p-4 border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground truncate pr-2">{account.name}</h3>
                </div>
                
                {(account.city || account.state) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{[account.city, account.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                
                {account.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{account.phone}</span>
                  </div>
                )}
                
                <div className="text-sm mb-3">
                  <span className="text-muted-foreground">Last Activity: </span>
                  <span className={cn(
                    !account.last_activity && "text-red-400",
                    account.last_activity && "text-foreground"
                  )}>
                    {account.last_activity || "Never"}
                  </span>
                </div>
                
                <Dialog open={outreachDialogOpen && selectedAccount === account.name} onOpenChange={(open) => {
                  setOutreachDialogOpen(open);
                  if (open) setSelectedAccount(account.name);
                  else setSelectedAccount("");
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Log Outreach
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Outreach - {account.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <Select 
                          value={newOutreach.type} 
                          onValueChange={v => setNewOutreach({ ...newOutreach, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Call
                              </div>
                            </SelectItem>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                              </div>
                            </SelectItem>
                            <SelectItem value="visit">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Visit
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Notes</label>
                        <Textarea 
                          value={newOutreach.notes}
                          onChange={e => setNewOutreach({ ...newOutreach, notes: e.target.value })}
                          placeholder="What happened?"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleLogOutreach} className="w-full">Log Outreach</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
