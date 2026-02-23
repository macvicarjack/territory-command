import { useState, useEffect, useMemo } from "react";
import { Search, ArrowUpDown, MapPin, Building2, Phone, Calendar, Briefcase } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  industry?: string;
  type?: string;
  lastActivity?: string;
  section?: number;
}

type SortField = 'name' | 'city' | 'state' | 'industry' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

// Helper to format phone number
function formatPhone(phone?: string) {
  if (!phone) return '-';
  return phone;
}

// Helper to format date
function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Get color based on last activity recency
function getActivityColor(dateStr?: string): string {
  if (!dateStr) return 'text-red-400';
  
  const date = new Date(dateStr);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 30) return 'text-green-400';
  if (daysDiff < 90) return 'text-yellow-400';
  return 'text-red-400';
}

function getActivityBg(dateStr?: string): string {
  if (!dateStr) return 'bg-red-500/10';
  
  const date = new Date(dateStr);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 30) return 'bg-green-500/10';
  if (daysDiff < 90) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

export default function TerritoryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [geocodedCount, setGeocodedCount] = useState(0);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        // Try geocoded endpoint first
        let response = await fetch(`${FLASK_TUNNEL}/api/salesforce/accounts-geo`);
        
        if (!response.ok) {
          // Fallback to regular accounts endpoint
          response = await fetch(`${FLASK_TUNNEL}/api/salesforce/accounts`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const data = await response.json();
        setAccounts(data.accounts || []);
        setGeocodingInProgress(data.geocoding_in_progress || false);
        setGeocodedCount(data.geocoded || 0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, []);

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = accounts.filter(a => 
        a.name?.toLowerCase().includes(query) ||
        a.city?.toLowerCase().includes(query) ||
        a.state?.toLowerCase().includes(query) ||
        a.industry?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    return filtered;
  }, [accounts, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button 
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={cn("h-3 w-3", sortField === field && "text-primary")} />
    </button>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center text-red-400">
            <p>Error loading accounts: {error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Territory Accounts
            </h1>
            <p className="text-sm text-muted-foreground">
              {accounts.length.toLocaleString()} total accounts
              {geocodingInProgress && (
                <span className="ml-2 text-yellow-400">• Geocoding in progress ({geocodedCount} done)</span>
              )}
            </p>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-md border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center border-b border-border bg-card px-4 py-3 text-xs">
          <div className="flex-1 min-w-[200px]">
            <SortButton field="name">Account</SortButton>
          </div>
          <div className="w-[140px] shrink-0">
            <SortButton field="city">Location</SortButton>
          </div>
          <div className="w-[120px] shrink-0">
            <SortButton field="industry">Industry</SortButton>
          </div>
          <div className="w-[120px] shrink-0">
            <SortButton field="lastActivity">Last Activity</SortButton>
          </div>
          <div className="w-[140px] shrink-0">Phone</div>
          <div className="w-[60px] shrink-0 text-center">Map</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {filteredAccounts.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">No accounts found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-foreground">{account.name}</div>
                    {account.website && (
                      <a 
                        href={account.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {account.website.replace(/^https?:\/\//, '').slice(0, 40)}
                      </a>
                    )}
                  </div>
                  
                  <div className="w-[140px] shrink-0 text-sm text-muted-foreground">
                    {account.city && account.state ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {account.city}, {account.state}
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                  
                  <div className="w-[120px] shrink-0 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {account.industry || '-'}
                    </span>
                  </div>
                  
                  <div className="w-[120px] shrink-0">
                    {account.lastActivity ? (
                      <span className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit",
                        getActivityBg(account.lastActivity),
                        getActivityColor(account.lastActivity)
                      )}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(account.lastActivity)}
                      </span>
                    ) : (
                      <span className="text-xs text-red-400 px-2 py-1 rounded-full bg-red-500/10">
                        No activity
                      </span>
                    )}
                  </div>
                  
                  <div className="w-[140px] shrink-0 text-sm text-muted-foreground">
                    {account.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(account.phone)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                  
                  <div className="w-[60px] shrink-0 text-center">
                    {account.lat && account.lng ? (
                      <a
                        href={`https://maps.google.com/?q=${account.lat},${account.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="View on map"
                      >
                        <MapPin className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-muted text-muted-foreground" title="Not geocoded">
                        <MapPin className="h-4 w-4 opacity-50" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
          <span>Showing {filteredAccounts.length.toLocaleString()} of {accounts.length.toLocaleString()} accounts</span>
          {geocodedCount > 0 && (
            <span>{geocodedCount.toLocaleString()} accounts geocoded</span>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
