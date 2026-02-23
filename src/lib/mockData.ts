// All mock data has been removed. Pages should fetch real data from the API.
// These empty exports prevent import errors during the transition.

export const ACCOUNTS: any[] = [];
export const OUTCOMES: any[] = [];
export const QUOTES: any[] = [];
export const BACKORDERS: any[] = [];
export const EMAILS: any[] = [];
export const CALENDAR_EVENTS: any[] = [];
export const PROSPECTS: any[] = [];
export const NOTES: any[] = [];

export function getAccountName(id: string): string { return "Unknown"; }
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
