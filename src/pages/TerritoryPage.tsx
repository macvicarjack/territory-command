import { useState, useEffect, useMemo } from "react";
import { Search, ArrowUpDown, MapPin, Building2, Phone, Calendar, Briefcase, Filter } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface Account {
  Id: string;
  Name: string;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingPostalCode?: string;
  BillingLatitude?: number;
  BillingLongitude?: number;
  Phone?: string;
  Website?: string;
  Industry?: string;
  Type?: string;
  LastActivityDate?: string;
  AnnualRevenue?: number;
  // Mapped fields
  city?: string;
  state?: string;
  street?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  name?: string;
  id?: string;
  phone?: string;
  website?: string;
  industry?: string;
  type?: string;
  lastActivity?: string;
  revenue?: number;
}

type SortField = 'name' | 'city' | 'state' | 'industry' | 'lastActivity' | 'tier' | 'revenue' | 'section';
type SortDirection = 'asc' | 'desc';

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

// Territory Section Mapping
const SECTION_MAP: Record<number, { name: string; cities: string[] }> = {
  1: {
    name: "Providence Metro",
    cities: ["Providence", "Pawtucket", "East Providence", "North Providence", "Central Falls", "Rumford", "Riverside"]
  },
  2: {
    name: "Northern RI",
    cities: ["Cumberland", "Johnston", "Lincoln", "Woonsocket", "Smithfield", "North Smithfield", "Harrisville", "Greenville", "Chepachet", "Pascoag", "Oakland", "Slatersville"]
  },
  3: {
    name: "Western/Southern RI",
    cities: ["Warwick", "Cranston", "West Warwick", "Westerly", "Coventry", "Narragansett", "East Greenwich", "Middletown", "Newport", "Bristol", "Tiverton", "Warren", "Barrington", "North Kingstown", "Wickford", "Jamestown", "Portsmouth", "Wakefield", "Wyoming", "West Greenwich", "Exeter", "Charlestown", "Block Island", "South Kingstown", "Kingston", "Hope Valley", "Little Compton", "Kenyon", "Bradford", "Ashaway", "Richmond"]
  },
  4: {
    name: "Attleboro/Franklin",
    cities: ["Attleboro", "Franklin", "North Attleboro", "Mansfield", "Foxboro", "Norton", "Plainville", "Wrentham", "Seekonk", "Rehoboth", "Swansea", "Somerset", "Dighton"]
  },
  5: {
    name: "South Shore MA",
    cities: ["Canton", "Quincy", "Rockland", "Braintree", "Randolph", "Hingham", "Weymouth", "Hanover", "Pembroke", "Marshfield", "Scituate", "Hull", "Whitman", "Abington", "Holbrook", "Avon", "Milton"]
  },
  6: {
    name: "Brockton/Stoughton",
    cities: ["Brockton", "Stoughton", "West Bridgewater", "Bridgewater", "East Bridgewater", "Raynham", "Easton"]
  },
  7: {
    name: "Norwood/Walpole",
    cities: ["Norwood", "Walpole", "Needham", "Needham Heights", "Wellesley", "Dedham", "Westwood", "Dover", "Medfield", "Millis", "Norfolk", "Sharon"]
  },
  8: {
    name: "SE Coast",
    cities: ["New Bedford", "Taunton", "Fall River", "Plymouth", "Middleboro", "Wareham", "Fairhaven", "Acushnet", "Dartmouth", "Freetown", "Lakeville", "Rochester", "Carver", "Marion", "Mattapoisett", "Kingston"]
  },
  9: {
    name: "Cape & Islands",
    cities: ["Hyannis", "Woods Hole", "Mashpee", "Harwich", "Dennis", "Brewster", "Orleans", "Eastham", "Wellfleet", "Provincetown", "Barnstable", "Sandwich", "Falmouth", "Bourne", "Chatham", "Martha's Vineyard", "Nantucket"]
  }
};

// Helper to get section from city
function getSectionFromCity(city?: string): { section: number; name: string } | null {
  if (!city) return null;
  const cityLower = city.toLowerCase().trim();
  
  for (const [sectionNum, sectionData] of Object.entries(SECTION_MAP)) {
    for (const sectionCity of sectionData.cities) {
      if (sectionCity.toLowerCase() === cityLower) {
        return { section: parseInt(sectionNum), name: sectionData.name };
      }
    }
  }
  return null;
}

// Helper to get tier from revenue
function getTierFromRevenue(revenue?: number): { tier: string; color: string } {
  if (revenue === undefined || revenue === null) {
    return { tier: "Unknown", color: "text-gray-400 bg-gray-500/10" };
  }
  if (revenue >= 20000) {
    return { tier: "A", color: "text-emerald-400 bg-emerald-500/10" };
  } else if (revenue >= 5000) {
    return { tier: "B", color: "text-blue-400 bg-blue-500/10" };
  } else {
    return { tier: "C", color: "text-amber-400 bg-amber-500/10" };
  }
}

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
  const [sectionFilter, setSectionFilter] = useState<number | 'all'>('all');
  const [revenueData, setRevenueData] = useState<Record<string, number>>({});

  // Fetch accounts and revenue data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch accounts
        let response = await fetch(`${FLASK_TUNNEL}/api/salesforce/accounts-geo`);
        if (!response.ok) {
          response = await fetch(`${FLASK_TUNNEL}/api/salesforce/accounts`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const data = await response.json();
        
        // Try to fetch outcomes for revenue data
        try {
          const outcomesRes = await fetch(`${FLASK_TUNNEL}/api/territory/quotes-summary`);
          if (outcomesRes.ok) {
            const outcomes = await outcomesRes.json();
            // Build revenue lookup by customer name
            const revenueLookup: Record<string, number> = {};
            if (outcomes.quotes) {
              outcomes.quotes.forEach((q: { customer?: string; revenue?: number }) => {
                if (q.customer && q.revenue) {
                  revenueLookup[q.customer.toLowerCase()] = q.revenue;
                }
              });
            }
            setRevenueData(revenueLookup);
          }
        } catch (e) {
          console.log('Revenue data not available');
        }
        
        // Map the account data to expected format
        const mappedAccounts = (data.accounts || []).map((acc: Account) => ({
          ...acc,
          id: acc.Id,
          name: acc.Name,
          street: acc.BillingStreet,
          city: acc.BillingCity,
          state: acc.BillingState,
          zip: acc.BillingPostalCode,
          lat: acc.BillingLatitude,
          lng: acc.BillingLongitude,
          phone: acc.Phone,
          website: acc.Website,
          industry: acc.Industry,
          type: acc.Type,
          lastActivity: acc.LastActivityDate,
          revenue: acc.AnnualRevenue || revenueData[acc.Name?.toLowerCase() || '']
        }));
        
        setAccounts(mappedAccounts);
        setGeocodingInProgress(data.geocoding_in_progress || false);
        setGeocodedCount(data.geocoded || 0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [revenueData]);

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
    
    // Filter by section
    if (sectionFilter !== 'all') {
      filtered = filtered.filter(a => {
        const section = getSectionFromCity(a.city);
        return section?.section === sectionFilter;
      });
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'state':
          comparison = (a.state || '').localeCompare(b.state || '');
          break;
        case 'industry':
          comparison = (a.industry || '').localeCompare(b.industry || '');
          break;
        case 'lastActivity':
          const aDate = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const bDate = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'tier':
          const tierA = getTierFromRevenue(a.revenue).tier;
          const tierB = getTierFromRevenue(b.revenue).tier;
          const tierOrder: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'Unknown': 3 };
          comparison = (tierOrder[tierA] || 3) - (tierOrder[tierB] || 3);
          break;
        case 'revenue':
          const revA = a.revenue || 0;
          const revB = b.revenue || 0;
          comparison = revA - revB;
          break;
        case 'section':
          const secA = getSectionFromCity(a.city)?.section || 999;
          const secB = getSectionFromCity(b.city)?.section || 999;
          comparison = secA - secB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [accounts, searchQuery, sortField, sortDirection, sectionFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <button 
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
        sortField === field && "text-primary",
        className
      )}
    >
      {children}
      <ArrowUpDown className={cn("h-3 w-3", sortField === field && sortDirection === 'asc' && "rotate-180")} />
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
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Section Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Sections</option>
                {Object.entries(SECTION_MAP).map(([num, data]) => (
                  <option key={num} value={num}>Section {num}: {data.name}</option>
                ))}
              </select>
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
        </div>

        {/* Table Header */}
        <div className="flex items-center border-b border-border bg-card px-4 py-3 text-xs">
          <div className="flex-1 min-w-[200px]">
            <SortButton field="name">Account</SortButton>
          </div>
          <div className="w-[110px] shrink-0">
            <SortButton field="section">Section</SortButton>
          </div>
          <div className="w-[70px] shrink-0">
            <SortButton field="tier">Tier</SortButton>
          </div>
          <div className="w-[100px] shrink-0 text-right">
            <SortButton field="revenue" className="justify-end">Revenue</SortButton>
          </div>
          <div className="w-[140px] shrink-0 pl-3">
            <SortButton field="city">Location</SortButton>
          </div>
          <div className="w-[110px] shrink-0 pl-1">
            <SortButton field="industry">Industry</SortButton>
          </div>
          <div className="w-[110px] shrink-0 pl-1">
            <SortButton field="lastActivity">Last Activity</SortButton>
          </div>
          <div className="w-[120px] shrink-0">Phone</div>
          <div className="w-[50px] shrink-0 text-center">Map</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {filteredAccounts.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">No accounts found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAccounts.map((account) => {
                const section = getSectionFromCity(account.city);
                const tier = getTierFromRevenue(account.revenue);
                
                return (
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
                    
                    <div className="w-[110px] shrink-0 text-sm">
                      {section ? (
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{section.section}</span> · {section.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    
                    <div className="w-[70px] shrink-0">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold",
                        tier.color
                      )}>
                        {tier.tier}
                      </span>
                    </div>
                    
                    <div className="w-[100px] shrink-0 text-sm text-muted-foreground text-right">
                      {account.revenue ? formatCurrency(account.revenue) : '-'}
                    </div>
                    
                    <div className="w-[140px] shrink-0 text-sm text-muted-foreground pl-3">
                      {account.city && account.state ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {account.city}, {account.state}
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                    
                    <div className="w-[110px] shrink-0 text-sm text-muted-foreground pl-1">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {account.industry || '-'}
                      </span>
                    </div>
                    
                    <div className="w-[110px] shrink-0 pl-1">
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
                    
                    <div className="w-[120px] shrink-0 text-sm text-muted-foreground">
                      {account.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhone(account.phone)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                    
                    <div className="w-[50px] shrink-0 text-center">
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
                );
              })}
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
