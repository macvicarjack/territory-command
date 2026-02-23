import { Outcome } from "@/types/outcome";

const API_URL = "https://roofingsalessystems.app.n8n.cloud/webhook/lovable-territory-data";

export async function fetchOutcomes(): Promise<any> {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("Failed to fetch territory data from n8n bridge");
  }
  return res.json();
}

export async function toggleTaskStatus(taskId: string): Promise<void> {
  console.log("Toggle task logic will be wired to n8n in the next sprint:", taskId);
}

export async function createOutcome(data: any): Promise<any> {
  console.log("Create outcome logic will be wired to n8n in the next sprint:", data);
}
