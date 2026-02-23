import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  description: string;
  owner: string;
  status: string;
  age_days: number;
  created_date: string;
}

interface Outcome {
  id: string;
  customer_name: string;
  title: string;
  constraint_task_id: string;
  tasks: Task[];
}

interface DashboardData {
  outcomes: Outcome[];
}

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${FLASK_TUNNEL}/api/territory/dashboard`);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

function getUrgencyColor(days: number): string {
  if (days < 7) return "text-green-400";
  if (days < 14) return "text-yellow-400";
  return "text-red-400";
}

function getUrgencyBg(days: number): string {
  if (days < 7) return "bg-green-500/10 border-green-500/20";
  if (days < 14) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

export default function WaitingRoomPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["territory-dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 60000, // Refresh every minute
  });

  // Filter outcomes where constraint task owner is NOT Jack
  const waitingItems = data?.outcomes
    .map((outcome) => {
      const constraintTask = outcome.tasks.find(
        (t) => t.id === outcome.constraint_task_id
      );
      if (constraintTask && constraintTask.owner.toLowerCase() !== "jack") {
        return {
          outcome,
          task: constraintTask,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.task.age_days - a.task.age_days) || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading waiting room...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-400">Error loading data</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error).message}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Empty state
  if (waitingItems.length === 0) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6">
          <h1 className="mb-4 text-xl font-bold text-foreground">Waiting Room</h1>
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border border-dashed border-muted-foreground/30">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Nothing waiting on others</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                All tasks are with Jack or complete
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Waiting Room</h1>
          <p className="text-sm text-muted-foreground">
            Waiting on {waitingItems.length} item{waitingItems.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-3">
          {waitingItems.map(({ outcome, task }) => (
            <div
              key={outcome.id}
              className={cn(
                "rounded-lg border p-4 transition-colors hover:bg-accent/50",
                getUrgencyBg(task.age_days)
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {outcome.customer_name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {outcome.title}
                  </p>
                </div>
                <div className={cn("text-sm font-medium whitespace-nowrap", getUrgencyColor(task.age_days))}>
                  {task.age_days} day{task.age_days !== 1 ? "s" : ""} waiting
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm">
                  <span className="text-muted-foreground">Waiting on:</span>{" "}
                  <span className="font-medium text-foreground capitalize">
                    {task.owner}
                  </span>
                  <span className="text-muted-foreground"> — </span>
                  <span className="text-foreground">{task.description}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
