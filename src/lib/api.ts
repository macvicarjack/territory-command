import { Outcome } from "@/types/outcome";

const API_BASE = "/api";

// Mock data for development — remove when backend is live
const MOCK_OUTCOMES: Outcome[] = [
  {
    id: "out_001",
    customer_name: "Acme Corp",
    contact_name: "Sarah Chen",
    title: "Close Q1 Enterprise Deal — $250K ARR",
    status: "active",
    tasks: [
      { id: "task_001", description: "Send revised proposal with updated pricing", owner: "Jack", status: "pending" },
      { id: "task_002", description: "Schedule technical deep-dive with CTO", owner: "Inside Sales", status: "done" },
      { id: "task_003", description: "Confirm budget approval from CFO", owner: "Customer", status: "pending" },
    ],
    constraint_task_id: "task_001",
  },
  {
    id: "out_002",
    customer_name: "TechFlow Inc",
    contact_name: "Marcus Rivera",
    title: "Expand Pilot to Full Deployment — 500 Seats",
    status: "active",
    tasks: [
      { id: "task_004", description: "Deliver integration documentation", owner: "Vendor", status: "pending" },
      { id: "task_005", description: "Run training session for ops team", owner: "Jack", status: "pending" },
    ],
    constraint_task_id: "task_004",
  },
  {
    id: "out_003",
    customer_name: "Global Dynamics",
    contact_name: "Priya Patel",
    title: "Secure Multi-Year Renewal — Prevent Churn",
    status: "active",
    tasks: [
      { id: "task_006", description: "Prepare ROI analysis from Year 1 data", owner: "Jack", status: "pending" },
      { id: "task_007", description: "Get legal review of new terms", owner: "Customer", status: "pending" },
      { id: "task_008", description: "Coordinate reference call with similar customer", owner: "Inside Sales", status: "pending" },
    ],
    constraint_task_id: "task_006",
  },
  {
    id: "out_004",
    customer_name: "Nexus Health",
    contact_name: "David Kim",
    title: "Win Competitive Displacement — Replace Legacy System",
    status: "active",
    tasks: [
      { id: "task_009", description: "Complete security questionnaire", owner: "Vendor", status: "done" },
      { id: "task_010", description: "Demo to selection committee", owner: "Jack", status: "pending" },
    ],
    constraint_task_id: "task_010",
  },
  {
    id: "out_005",
    customer_name: "Summit Partners",
    contact_name: "Lisa Wang",
    title: "Land Initial POC — New Logo Acquisition",
    status: "deferred",
    tasks: [
      { id: "task_011", description: "Wait for Q2 budget cycle to open", owner: "Customer", status: "pending" },
    ],
    constraint_task_id: "task_011",
  },
];

let mockData = [...MOCK_OUTCOMES];
const USE_MOCK = true; // Set to false when backend is ready

export async function fetchOutcomes(): Promise<Outcome[]> {
  if (USE_MOCK) return Promise.resolve(mockData);
  const res = await fetch(`${API_BASE}/outcomes`);
  if (!res.ok) throw new Error("Failed to fetch outcomes");
  return res.json();
}

export async function createOutcome(data: {
  customer_name: string;
  title: string;
  first_task: string;
}): Promise<Outcome> {
  if (USE_MOCK) {
    const newOutcome: Outcome = {
      id: `out_${String(mockData.length + 1).padStart(3, "0")}`,
      customer_name: data.customer_name,
      contact_name: "",
      title: data.title,
      status: "active",
      tasks: [
        {
          id: `task_${Date.now()}`,
          description: data.first_task,
          owner: "Jack",
          status: "pending",
        },
      ],
      constraint_task_id: `task_${Date.now()}`,
    };
    mockData = [newOutcome, ...mockData];
    return Promise.resolve(newOutcome);
  }
  const res = await fetch(`${API_BASE}/outcomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create outcome");
  return res.json();
}

export async function toggleTaskStatus(taskId: string): Promise<void> {
  if (USE_MOCK) {
    mockData = mockData.map((o) => ({
      ...o,
      tasks: o.tasks.map((t) =>
        t.id === taskId ? { ...t, status: t.status === "done" ? "pending" : "done" } : t
      ),
    }));
    return Promise.resolve();
  }
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to update task");
}

export async function addTaskToOutcome(
  outcomeId: string,
  task: { description: string; owner: string }
): Promise<void> {
  if (USE_MOCK) {
    mockData = mockData.map((o) => {
      if (o.id !== outcomeId) return o;
      const newTask = {
        id: `task_${Date.now()}`,
        description: task.description,
        owner: task.owner as any,
        status: "pending" as const,
      };
      return { ...o, tasks: [...o.tasks, newTask] };
    });
    return Promise.resolve();
  }
  // Implement real API call when backend supports it
}
