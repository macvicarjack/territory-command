export type TaskOwner = "Jack" | "Vendor" | "Inside Sales" | "Customer";
export type TaskStatus = "pending" | "done";
export type OutcomeStatus = "Active" | "At Risk" | "Verified";
export type RevenueTier = "A" | "B" | "C";
export type TerritorySection = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type QuoteStatus = "Open" | "Quoted" | "Follow-up" | "Closed Won" | "Closed Lost";
export type BackorderStatus = "On Track" | "At Risk" | "Delayed";
export type EmailTier = "Tier 1" | "Tier 2" | "Tier 3";
export type ProspectStatus = "New" | "Contacted" | "Qualified" | "Nurture";

export interface Task {
  id: string;
  description: string;
  owner: TaskOwner;
  status: TaskStatus;
  constraint: boolean;
}

export interface Outcome {
  id: string;
  title: string;
  accountId: string;
  value: number;
  status: OutcomeStatus;
  tasks: Task[];
  constraintOwner: TaskOwner;
  daysActive: number;
  lastMovementDate: string;
  notes: string[];
}

export interface Account {
  id: string;
  name: string;
  territorySection: TerritorySection;
  revenueTier: RevenueTier;
  lastTouchDate: string;
  lat: number;
  lng: number;
  revenue: number;
  openOutcomes: number;
  openQuotes: number;
}

export interface Quote {
  id: string;
  accountId: string;
  linkedOutcomeId: string;
  value: number;
  daysOpen: number;
  status: QuoteStatus;
  nextAction: string;
}

export interface Backorder {
  id: string;
  accountId: string;
  linkedOutcomeId: string;
  value: number;
  daysOpen: number;
  status: BackorderStatus;
  vendor: string;
  shipDate: string;
  nextAction: string;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  classificationTier: EmailTier;
  linkedOutcomeId: string | null;
  preview: string;
}

export interface Prospect {
  id: string;
  companyName: string;
  contactName: string;
  nextAction: string;
  notes: string;
  status: ProspectStatus;
  lastContactDate: string;
}

export interface Note {
  id: string;
  accountId: string | null;
  outcomeId: string | null;
  content: string;
  createdAt: string;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  accountId: string;
  date: string;
  time: string;
  type: "Meeting" | "Call" | "Visit" | "Follow-up";
  section: TerritorySection;
}
