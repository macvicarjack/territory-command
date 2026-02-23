import { useEffect, useRef, useState } from "react";
import { ACCOUNTS, OUTCOMES, getAccountName, formatCurrency } from "@/lib/mockData";
import { Account } from "@/types/models";
import AppLayout from "@/components/AppLayout";
import { ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

function tierPinColor(tier: string) {
  if (tier === "A") return "#ef4444";
  if (tier === "B") return "#eab308";
  return "#6b7280";
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [39.0, -98.0],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Add pins for first 200 accounts (perf)
      const displayAccounts = ACCOUNTS.slice(0, 200);
      displayAccounts.forEach((a) => {
        const color = tierPinColor(a.revenueTier);
        const marker = L.circleMarker([a.lat, a.lng], {
          radius: a.revenueTier === "A" ? 7 : a.revenueTier === "B" ? 5 : 3,
          fillColor: color,
          color: color,
          fillOpacity: 0.7,
          weight: 1,
        }).addTo(map);

        marker.on("click", () => setSelectedAccount(a));
        marker.bindTooltip(a.name, { className: "map-tooltip" });
      });

      mapInstanceRef.current = map;
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const accountOutcomes = selectedAccount
    ? OUTCOMES.filter((o) => o.accountId === selectedAccount.id)
    : [];

  // Empty state
  if (ACCOUNTS.length === 0) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No data yet — connect this page to real data.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative flex h-[calc(100vh-3rem)]">
        <div ref={mapRef} className="flex-1" />

        {/* Account Panel */}
        {selectedAccount && (
          <div className="absolute right-0 top-0 z-[1000] h-full w-80 border-l border-border bg-card p-4 overflow-auto">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">{selectedAccount.name}</h2>
                <p className="text-[10px] text-muted-foreground">
                  Section {selectedAccount.territorySection} · Tier {selectedAccount.revenueTier} · {formatCurrency(selectedAccount.revenue)}
                </p>
              </div>
              <button onClick={() => setSelectedAccount(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outcomes</h3>
            {accountOutcomes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No linked outcomes.</p>
            ) : (
              <div className="mb-4 space-y-1.5">
                {accountOutcomes.map((o) => {
                  const ct = o.tasks.find((t) => t.constraint);
                  return (
                    <div key={o.id} className="rounded-md bg-accent px-2.5 py-2">
                      <p className="text-xs font-medium text-foreground">{o.title}</p>
                      {ct && <p className="mt-0.5 text-[10px] text-muted-foreground">⚡ {ct.description}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20">
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Salesforce Maps
            </button>
          </div>
        )}
      </div>
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
      `}</style>
    </AppLayout>
  );
}
