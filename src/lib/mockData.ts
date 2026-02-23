import {
  Account, Outcome, Quote, Backorder, Email, Prospect, Note, CalendarEvent,
  TerritorySection, RevenueTier,
} from "@/types/models";

// --- ACCOUNTS (subset of 1207 — we generate 50 named + fill rest) ---
const accountNames = [
  "Acme Corp","TechFlow Inc","Global Dynamics","Nexus Health","Summit Partners",
  "Ridgewell Supply","Cortland Manufacturing","Beacon Logistics","Pinnacle Foods","Ironclad Security",
  "Northstar Electronics","Vertex Pharma","Cascade Energy","Sapphire Media","Delta Fabrication",
  "Horizon Ag","Trident Marine","Elevate Fitness","Prism Analytics","Atlas Construction",
  "Sterling Automotive","Vanguard Insurance","Ember Creative","Quantum Systems","Solaris Power",
  "Apex Distribution","Cobalt Mining","Frostbite HVAC","Greenleaf Organics","Harbor Freight Co",
  "Keystone Bank","Lumen Optics","Monarch Textiles","Noble Gas Supply","Onyx Security",
  "Pacific Rim Trading","QuickSilver IT","Redwood Timber","SkyBridge Aviation","Titan Alloys",
  "Unified Health","Valor Defense","Windmill Energy","Xenon Labs","Yellowstone Tours",
  "Zenith Aerospace","BlueRidge Data","CrystalClear Water","DawnBreaker Solar","EagleEye Drones",
];

const cities: [number, number][] = [
  [40.7128, -74.006], [34.0522, -118.2437], [41.8781, -87.6298], [29.7604, -95.3698],
  [33.749, -84.388], [39.7392, -104.9903], [47.6062, -122.3321], [25.7617, -80.1918],
  [42.3601, -71.0589], [37.7749, -122.4194], [32.7157, -117.1611], [38.9072, -77.0369],
  [36.1627, -86.7816], [35.2271, -80.8431], [30.2672, -97.7431], [39.9612, -82.9988],
  [44.9778, -93.265], [36.1699, -115.1398], [43.0389, -87.9065], [28.5383, -81.3792],
];

function generateAccounts(): Account[] {
  const accounts: Account[] = [];
  for (let i = 0; i < 1207; i++) {
    const name = i < accountNames.length ? accountNames[i] : `Account #${i + 1}`;
    const city = cities[i % cities.length];
    const section = ((i % 9) + 1) as TerritorySection;
    const tierRoll = Math.random();
    const tier: RevenueTier = tierRoll < 0.15 ? "A" : tierRoll < 0.45 ? "B" : "C";
    const revenue = tier === "A" ? 500000 + Math.floor(Math.random() * 2000000) :
                    tier === "B" ? 100000 + Math.floor(Math.random() * 400000) :
                    10000 + Math.floor(Math.random() * 90000);
    accounts.push({
      id: `acc_${String(i).padStart(4, "0")}`,
      name,
      territorySection: section,
      revenueTier: tier,
      lastTouchDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString().slice(0, 10),
      lat: city[0] + (Math.random() - 0.5) * 2,
      lng: city[1] + (Math.random() - 0.5) * 2,
      revenue,
      openOutcomes: Math.floor(Math.random() * 4),
      openQuotes: Math.floor(Math.random() * 3),
    });
  }
  return accounts;
}

export const ACCOUNTS = generateAccounts();

export const OUTCOMES: Outcome[] = [
  {
    id: "out_001", title: "Close Q1 Enterprise Deal — $250K ARR", accountId: "acc_0000", value: 250000, status: "Active",
    tasks: [
      { id: "t001", description: "Send revised proposal with updated pricing", owner: "Jack", status: "pending", constraint: true },
      { id: "t002", description: "Schedule technical deep-dive with CTO", owner: "Inside Sales", status: "done", constraint: false },
      { id: "t003", description: "Confirm budget approval from CFO", owner: "Customer", status: "pending", constraint: false },
    ],
    constraintOwner: "Jack", daysActive: 14, lastMovementDate: "2026-02-20", notes: ["Pricing needs executive sign-off"],
  },
  {
    id: "out_002", title: "Expand Pilot to Full Deployment — 500 Seats", accountId: "acc_0001", value: 180000, status: "Active",
    tasks: [
      { id: "t004", description: "Deliver integration documentation", owner: "Vendor", status: "pending", constraint: true },
      { id: "t005", description: "Run training session for ops team", owner: "Jack", status: "pending", constraint: false },
    ],
    constraintOwner: "Vendor", daysActive: 22, lastMovementDate: "2026-02-15", notes: [],
  },
  {
    id: "out_003", title: "Secure Multi-Year Renewal — Prevent Churn", accountId: "acc_0002", value: 320000, status: "At Risk",
    tasks: [
      { id: "t006", description: "Prepare ROI analysis from Year 1 data", owner: "Jack", status: "pending", constraint: true },
      { id: "t007", description: "Get legal review of new terms", owner: "Customer", status: "pending", constraint: false },
      { id: "t008", description: "Coordinate reference call with similar customer", owner: "Inside Sales", status: "pending", constraint: false },
    ],
    constraintOwner: "Jack", daysActive: 45, lastMovementDate: "2026-02-10", notes: ["Risk of churn if not renewed by Q2"],
  },
  {
    id: "out_004", title: "Win Competitive Displacement — Replace Legacy", accountId: "acc_0003", value: 150000, status: "Active",
    tasks: [
      { id: "t009", description: "Complete security questionnaire", owner: "Vendor", status: "done", constraint: false },
      { id: "t010", description: "Demo to selection committee", owner: "Jack", status: "pending", constraint: true },
    ],
    constraintOwner: "Jack", daysActive: 30, lastMovementDate: "2026-02-18", notes: [],
  },
  {
    id: "out_005", title: "Land Initial POC — New Logo Acquisition", accountId: "acc_0004", value: 75000, status: "Active",
    tasks: [
      { id: "t011", description: "Wait for Q2 budget cycle to open", owner: "Customer", status: "pending", constraint: true },
    ],
    constraintOwner: "Customer", daysActive: 60, lastMovementDate: "2026-01-25", notes: ["Budget locked until April"],
  },
  {
    id: "out_006", title: "Upsell Analytics Module — Tier A Priority", accountId: "acc_0005", value: 95000, status: "Verified",
    tasks: [
      { id: "t012", description: "Deliver SOW for analytics add-on", owner: "Jack", status: "done", constraint: false },
      { id: "t013", description: "Get PO from procurement", owner: "Customer", status: "done", constraint: true },
    ],
    constraintOwner: "Customer", daysActive: 10, lastMovementDate: "2026-02-22", notes: ["Verified — awaiting PO processing"],
  },
  {
    id: "out_007", title: "Resolve Service Escalation — Retention Risk", accountId: "acc_0006", value: 200000, status: "At Risk",
    tasks: [
      { id: "t014", description: "Root cause analysis on downtime incident", owner: "Vendor", status: "pending", constraint: true },
      { id: "t015", description: "Schedule executive apology call", owner: "Jack", status: "pending", constraint: false },
    ],
    constraintOwner: "Vendor", daysActive: 8, lastMovementDate: "2026-02-21", notes: ["Critical — customer threatening to leave"],
  },
  {
    id: "out_008", title: "Convert Pilot to Annual Contract", accountId: "acc_0007", value: 120000, status: "Active",
    tasks: [
      { id: "t016", description: "Collect pilot success metrics", owner: "Inside Sales", status: "pending", constraint: true },
      { id: "t017", description: "Draft annual pricing proposal", owner: "Jack", status: "pending", constraint: false },
    ],
    constraintOwner: "Inside Sales", daysActive: 18, lastMovementDate: "2026-02-17", notes: [],
  },
];

export const QUOTES: Quote[] = [
  { id: "q001", accountId: "acc_0000", linkedOutcomeId: "out_001", value: 250000, daysOpen: 14, status: "Quoted", nextAction: "Follow up on pricing" },
  { id: "q002", accountId: "acc_0001", linkedOutcomeId: "out_002", value: 180000, daysOpen: 22, status: "Follow-up", nextAction: "Send revised scope" },
  { id: "q003", accountId: "acc_0002", linkedOutcomeId: "out_003", value: 320000, daysOpen: 45, status: "Open", nextAction: "Prepare renewal offer" },
  { id: "q004", accountId: "acc_0003", linkedOutcomeId: "out_004", value: 150000, daysOpen: 10, status: "Quoted", nextAction: "Await committee decision" },
  { id: "q005", accountId: "acc_0005", linkedOutcomeId: "out_006", value: 95000, daysOpen: 5, status: "Closed Won", nextAction: "Process PO" },
  { id: "q006", accountId: "acc_0007", linkedOutcomeId: "out_008", value: 120000, daysOpen: 18, status: "Open", nextAction: "Draft proposal" },
];

export const BACKORDERS: Backorder[] = [
  { id: "bo001", accountId: "acc_0000", linkedOutcomeId: "out_001", value: 45000, daysOpen: 30, status: "Delayed", vendor: "Apex Mfg", shipDate: "2026-03-15", nextAction: "Escalate to vendor" },
  { id: "bo002", accountId: "acc_0001", linkedOutcomeId: "out_002", value: 22000, daysOpen: 12, status: "On Track", vendor: "Delta Parts", shipDate: "2026-03-01", nextAction: "Confirm shipping" },
  { id: "bo003", accountId: "acc_0006", linkedOutcomeId: "out_007", value: 68000, daysOpen: 8, status: "At Risk", vendor: "Pinnacle Supply", shipDate: "2026-03-10", nextAction: "Source alternative" },
];

export const EMAILS: Email[] = [
  { id: "e001", from: "sarah.chen@acme.com", subject: "RE: Updated Pricing Proposal", receivedAt: "2026-02-23T09:15:00", classificationTier: "Tier 1", linkedOutcomeId: "out_001", preview: "Hi Jack, the CFO reviewed the numbers and has a few questions about the licensing structure..." },
  { id: "e002", from: "marcus@techflow.io", subject: "Integration Timeline Question", receivedAt: "2026-02-23T08:42:00", classificationTier: "Tier 1", linkedOutcomeId: "out_002", preview: "Can we push the go-live date by two weeks? Our IT team needs more time for testing..." },
  { id: "e003", from: "priya.p@globaldyn.com", subject: "Renewal Discussion Follow-up", receivedAt: "2026-02-22T16:30:00", classificationTier: "Tier 1", linkedOutcomeId: "out_003", preview: "Thanks for the call yesterday. The team is still evaluating competitive options..." },
  { id: "e004", from: "info@vendorparts.com", subject: "Shipment Delay Notice", receivedAt: "2026-02-22T14:20:00", classificationTier: "Tier 2", linkedOutcomeId: null, preview: "Due to supply chain disruptions, your order #4521 will be delayed by approximately..." },
  { id: "e005", from: "newsletter@industry.com", subject: "Weekly Market Report", receivedAt: "2026-02-22T07:00:00", classificationTier: "Tier 3", linkedOutcomeId: null, preview: "This week's highlights: Q4 earnings exceeded expectations across..." },
  { id: "e006", from: "d.kim@nexushealth.org", subject: "Selection Committee Update", receivedAt: "2026-02-21T11:45:00", classificationTier: "Tier 1", linkedOutcomeId: "out_004", preview: "The committee met this morning. We're narrowing down to two finalists..." },
];

export const PROSPECTS: Prospect[] = [
  { id: "p001", companyName: "Frontier Logistics", contactName: "Amy Torres", nextAction: "Schedule intro call", notes: "Referred by Beacon Logistics", status: "New", lastContactDate: "2026-02-20" },
  { id: "p002", companyName: "Crestview Medical", contactName: "Dr. James Park", nextAction: "Send capabilities deck", notes: "Met at trade show", status: "Contacted", lastContactDate: "2026-02-18" },
  { id: "p003", companyName: "Bridgewater Mfg", contactName: "Tom Hendricks", nextAction: "Follow up on proposal interest", notes: "Potential $200K opportunity", status: "Qualified", lastContactDate: "2026-02-15" },
  { id: "p004", companyName: "Silverline Tech", contactName: "Raj Patel", nextAction: "Nurture — check in Q2", notes: "Not ready yet, revisit after funding round", status: "Nurture", lastContactDate: "2026-02-10" },
  { id: "p005", companyName: "Oakmont Foods", contactName: "Linda Cho", nextAction: "Send case study", notes: "Interested in distribution solution", status: "Contacted", lastContactDate: "2026-02-22" },
];

export const NOTES: Note[] = [
  { id: "n001", accountId: "acc_0000", outcomeId: "out_001", content: "CFO wants 15% volume discount — need VP approval before re-quoting.", createdAt: "2026-02-22T14:00:00", tags: ["pricing", "escalation"] },
  { id: "n002", accountId: "acc_0002", outcomeId: "out_003", content: "Competitor pricing leaked — they're 20% under. Need ROI justification.", createdAt: "2026-02-20T10:30:00", tags: ["competitive", "risk"] },
  { id: "n003", accountId: "acc_0006", outcomeId: "out_007", content: "Downtime incident root cause: vendor firmware bug. Patch ETA 2 weeks.", createdAt: "2026-02-21T16:00:00", tags: ["escalation", "vendor"] },
  { id: "n004", accountId: "acc_0003", outcomeId: "out_004", content: "Selection committee likes our security posture. Weak on analytics vs competitor.", createdAt: "2026-02-19T09:00:00", tags: ["competitive"] },
  { id: "n005", accountId: null, outcomeId: null, content: "Territory 3 has highest concentration of Tier A accounts — prioritize visits next week.", createdAt: "2026-02-18T08:00:00", tags: ["territory", "planning"] },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "cal001", title: "Acme Corp — Pricing Review", accountId: "acc_0000", date: "2026-02-23", time: "09:00", type: "Meeting", section: 1 },
  { id: "cal002", title: "TechFlow — Integration Check-in", accountId: "acc_0001", date: "2026-02-23", time: "11:00", type: "Call", section: 2 },
  { id: "cal003", title: "Nexus Health — Demo Prep", accountId: "acc_0003", date: "2026-02-23", time: "14:00", type: "Meeting", section: 4 },
  { id: "cal004", title: "Cortland Mfg — Site Visit", accountId: "acc_0006", date: "2026-02-24", time: "10:00", type: "Visit", section: 7 },
  { id: "cal005", title: "Global Dynamics — Renewal Follow-up", accountId: "acc_0002", date: "2026-02-24", time: "15:00", type: "Follow-up", section: 3 },
  { id: "cal006", title: "Beacon Logistics — Quarterly Review", accountId: "acc_0007", date: "2026-02-25", time: "09:30", type: "Meeting", section: 8 },
  { id: "cal007", title: "Ridgewell Supply — Contract Review", accountId: "acc_0005", date: "2026-02-25", time: "13:00", type: "Meeting", section: 6 },
  { id: "cal008", title: "Summit Partners — Budget Discussion", accountId: "acc_0004", date: "2026-02-26", time: "10:00", type: "Call", section: 5 },
];

// Helper to get account name by ID
export function getAccountName(accountId: string): string {
  return ACCOUNTS.find((a) => a.id === accountId)?.name ?? "Unknown";
}

export function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}
