import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Phone, Calendar, Building2, MapPin, Navigation } from "lucide-react";
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

const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";

// Color pins by last activity recency
function getPinColor(dateStr?: string): string {
  if (!dateStr) return '#ef4444'; // red for no activity
  
  const date = new Date(dateStr);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 30) return '#22c55e'; // green for recent
  if (daysDiff < 90) return '#eab308'; // yellow for stale
  return '#ef4444'; // red for cold
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'No activity';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatPhone(phone?: string) {
  if (!phone) return null;
  return phone;
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [geocodedCount, setGeocodedCount] = useState(0);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const response = await fetch(`${FLASK_TUNNEL}/api/salesforce/accounts-geo`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const data = await response.json();
        setAccounts(data.accounts || []);
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

  useEffect(() => {
    let cancelled = false;
    
    async function initMap() {
      if (accounts.length === 0 || !mapRef.current || mapInstanceRef.current) return;
      
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      
      if (cancelled || !mapRef.current) return;

      // Create map centered on Rhode Island/New England area
      const map = L.map(mapRef.current, {
        center: [41.8, -71.4], // Rhode Island center
        zoom: 9,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Filter accounts with lat/lng
      const geocodedAccounts = accounts.filter(a => a.lat && a.lng);
      
      // Add markers
      geocodedAccounts.forEach((account) => {
        const color = getPinColor(account.lastActivity);
        
        const marker = L.circleMarker([account.lat!, account.lng!], {
          radius: 6,
          fillColor: color,
          color: color,
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(map);

        marker.on("click", () => setSelectedAccount(account));
        marker.bindTooltip(account.name, { 
          className: "map-tooltip",
          direction: "top"
        });
        
        markersRef.current.push(marker);
      });

      // If we have geocoded accounts, fit bounds to show all
      if (geocodedAccounts.length > 0) {
        const bounds = L.latLngBounds(geocodedAccounts.map(a => [a.lat!, a.lng!]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
    }
    
    initMap();
    
    return () => { 
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [accounts]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading accounts and map...</p>
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

  const geocodedAccounts = accounts.filter(a => a.lat && a.lng);

  return (
    <AppLayout>
      <div className="relative flex h-[calc(100vh-3rem)]">
        {/* Map */}
        <div ref={mapRef} className="flex-1 bg-card" />

        {/* Legend */}
        <div className="absolute left-4 top-4 z-[1000] rounded-lg bg-card/95 border border-border p-3 shadow-lg">
          <h3 className="text-xs font-semibold text-foreground mb-2">Last Activity</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="text-muted-foreground">Recent (&lt;30 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="text-muted-foreground">Stale (30-90 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span className="text-muted-foreground">Cold (&gt;90 days)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
            {geocodedCount.toLocaleString()} of {accounts.length.toLocaleString()} mapped
          </div>
        </div>

        {/* Account Panel */}
        {selectedAccount && (
          <div className="absolute right-0 top-0 z-[1000] h-full w-80 border-l border-border bg-card overflow-auto shadow-xl">
            <div className="p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">{selectedAccount.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedAccount.type || 'Account'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedAccount(null)} 
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Address */}
              <div className="mb-4 p-3 rounded-lg bg-accent/50">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    {selectedAccount.street && <p>{selectedAccount.street}</p>}
                    {(selectedAccount.city || selectedAccount.state) && (
                      <p className="text-muted-foreground">
                        {selectedAccount.city}{selectedAccount.city && selectedAccount.state ? ', ' : ''}
                        {selectedAccount.state} {selectedAccount.zip}
                      </p>
                    )}
                    {!selectedAccount.street && !selectedAccount.city && (
                      <p className="text-muted-foreground">Address not available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                {selectedAccount.industry && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedAccount.industry}</span>
                  </div>
                )}
                
                {selectedAccount.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedAccount.phone}`} className="text-primary hover:underline">
                      {formatPhone(selectedAccount.phone)}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    selectedAccount.lastActivity ? (
                      new Date().getTime() - new Date(selectedAccount.lastActivity).getTime() < 30 * 24 * 60 * 60 * 1000
                        ? "bg-green-500/10 text-green-400"
                        : new Date().getTime() - new Date(selectedAccount.lastActivity).getTime() < 90 * 24 * 60 * 60 * 1000
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-red-500/10 text-red-400"
                    ) : "bg-red-500/10 text-red-400"
                  )}>
                    Last activity: {formatDate(selectedAccount.lastActivity)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedAccount.website && (
                  <a
                    href={selectedAccount.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Website
                  </a>
                )}
                
                {selectedAccount.lat && selectedAccount.lng && (
                  <a
                    href={`https://maps.google.com/?q=${selectedAccount.lat},${selectedAccount.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Navigation className="h-4 w-4" />
                    Open in Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state overlay when no geocoded accounts */}
        {geocodedAccounts.length === 0 && !loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-card/80">
            <div className="text-center p-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Accounts Mapped</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Accounts are still being geocoded. This process takes approximately 20 minutes for all {accounts.length} accounts.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom styles for map */}
      <style>{`
        .map-tooltip {
          background: hsl(216 26% 9%) !important;
          border: 1px solid hsl(216 18% 14%) !important;
          color: hsl(0 0% 96%) !important;
          font-size: 11px !important;
          font-family: Inter, system-ui, sans-serif !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .map-tooltip::before {
          border-top-color: hsl(216 18% 14%) !important;
        }
        .leaflet-control-zoom a {
          background: hsl(216 26% 9%) !important;
          color: hsl(0 0% 96%) !important;
          border-color: hsl(216 18% 14%) !important;
        }
        .leaflet-container {
          background: hsl(216 26% 9%) !important;
        }
      `}</style>
    </AppLayout>
  );
}
