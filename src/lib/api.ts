import { Outcome } from "@/types/outcome";

const N8N_BRIDGE = "https://pavilion-desired-facilitate-blue.trycloudflare.com/webhook/lovable-territory-data";

export async function fetchOutcomes(): Promise<Outcome[]> {
  try {
    const res = await fetch(N8N_BRIDGE);
    if (!res.ok) throw new Error(`Bridge returned ${res.status}`);
    const data = await res.json();
    const outcomes = data.outcomes || [];
    return outcomes.map((o: any) => ({
      id: o.id || `out_${Math.random().toString(36).substr(2, 9)}`,
      customer_name: o.customer_name || "Unknown",
      contact_name: o.contact_name || "",
      title: o.title || "",
      status: o.status || "active",
      tasks: (o.tasks || []).map((t: any) => ({
        id: t.id || `task_${Math.random().toString(36).substr(2, 9)}`,
        description: t.description || "",
        owner: t.owner || "Jack",
        status: t.status || "pending",
      })),
      constraint_task_id: o.constraint_task_id || o.tasks?.[0]?.id || "",
    }));
  } catch (err) {
    console.error("Failed to fetch from n8n bridge:", err);
    return [];
  }
}

export async function createOutcome(data: {
  customer_name: string;
  title: string;
  first_task: string;
}): Promise<Outcome> {
  const newOutcome: Outcome = {
    id: `out_${Date.now()}`,
    customer_name: data.customer_name,
    contact_name: "",
    title: data.title,
    status: "active",
    tasks: [{
      id: `task_${Date.now()}`,
      description: data.first_task,
      owner: "Jack",
      status: "pending",
    }],
    constraint_task_id: `task_${Date.now()}`,
  };
  return Promise.resolve(newOutcome);
}

export async function toggleTaskStatus(taskId: string): Promise<void> {
  return Promise.resolve();
}

export async function addTaskToOutcome(
  outcomeId: string,
  task: { description: string; owner: string }
): Promise<void> {
  return Promise.resolve();
}
