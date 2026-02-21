export type TaskOwner = "Jack" | "Vendor" | "Inside Sales" | "Customer";
export type TaskStatus = "pending" | "done";
export type OutcomeStatus = "active" | "deferred" | "completed";

export interface Task {
  id: string;
  description: string;
  owner: TaskOwner;
  status: TaskStatus;
}

export interface Outcome {
  id: string;
  customer_name: string;
  contact_name: string;
  title: string;
  status: OutcomeStatus;
  tasks: Task[];
  constraint_task_id: string;
}
