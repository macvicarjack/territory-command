import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { X, ExternalLink, Phone, MapPin, Navigation, Search, Route, ChevronRight, Home, Building2, Calendar, Plus, Layers } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================
// TYPES
// ============================================================
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
  tier?: string;
}

interface TerritorySection {
  id: number;
  name: string;
  color: string;
  visit_freq: string;
  center: [number, number];
  polygon: [number, number][];
  multiPolygon?: [number, number][][] | null;
  zip_codes: string[];
}

interface TerritoryData {
  sections: TerritorySection[];
  home_base: { lat: number; lng: number; label: string };
  office: { lat: number; lng: number; label: string };
  territory_bounds: { center: [number, number]; zoom: number; north: number; south: number; east: number; west: number };
}

// ============================================================
// CONSTANTS
// ============================================================
const FLASK_TUNNEL = "https://course-metadata-bacteria-meet.trycloudflare.com";
const HOME_COORDS: [number, number] = [42.0834, -71.3967];
const SF_BASE = "https://flowcontrolgroup2021.my.salesforce.com";

const TIER_COLORS: Record<string, string> = {
  A: "#22c55e", B: "#eab308", C: "#ef4444", Whitespace: "#3b82f6", Untiered: "#6b7280",
};

function activityColor(dateStr?: string): string {
  if (!dateStr) return "#ef4444";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 30) return "#22c55e";
  if (days < 90) return "#eab308";
  return "#ef4444";
}

function pinColor(account: Account, mode: "tier" | "activity"): string {
  if (mode === "tier") return TIER_COLORS[account.tier || "Untiered"] || TIER_COLORS.Untiered;
  return activityColor(account.lastActivity);
}

function formatDate(d?: string) {
  if (!d) return "No activity";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return d; }
}

function activityBadgeClass(d?: string) {
  if (!d) return "bg-red-500/10 text-red-400";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days < 30) return "bg-green-500/10 text-green-400";
  if (days < 90) return "bg-yellow-500/10 text-yellow-400";
  return "bg-red-500/10 text-red-400";
}

// Simple nearest-neighbor TSP
function optimizeRoute(start: [number, number], accounts: Account[]): Account[] {
  const unvisited = accounts.filter(a => a.lat && a.lng).map(a => ({ ...a }));
  const route: Account[] = [];
  let pos = start;
  while (unvisited.length > 0) {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = Math.hypot(pos[0] - unvisited[i].lat!, pos[1] - unvisited[i].lng!);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    const next = unvisited.splice(best, 1)[0];
    route.push(next);
    pos = [next.lat!, next.lng!];
  }
  return route;
}

function appleMapsUrl(start: [number, number], stops: Account[]): string {
  const pts = stops.slice(0, 15).filter(a => a.lat && a.lng).map(a => `${a.lat},${a.lng}`).join("+to:");
  return `https://maps.apple.com/?saddr=${start[0]},${start[1]}&daddr=${pts}`;
}

// ============================================================
// COMPONENT
// ============================================================
export default function MapPage() {
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const sectionLayersRef = useRef<Map<number, any[]>>(new Map());
  const accountMarkersRef = useRef<any[]>([]);
  const routeLayerRef = useRef<any>(null);
  const routeMarkersRef = useRef<any[]>([]);
  const highlightMarkerRef = useRef<any>(null);

  // State
  const [territoryData, setTerritoryData] = useState<TerritoryData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<number>>(new Set());
  const [paneOpen, setPaneOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "routes">("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "activity" | "city">("name");
  const [pinMode, setPinMode] = useState<"off" | "section" | "all">("off");
  const [colorMode, setColorMode] = useState<"tier" | "activity">("tier");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Route creation
  const [routeMode, setRouteMode] = useState(false);
  const [routeSelected, setRouteSelected] = useState<Set<string>>(new Set());
  const [optimizedRoute, setOptimizedRoute] = useState<Account[]>([]);
  const [routeDate, setRouteDate] = useState(() => new Date().toISOString().slice(0, 10));

  // ============================================================
  // DATA FETCHING
  // ============================================================
  useEffect(() => {
    async function load() {
      try {
        const [sectRes, acctRes] = await Promise.all([
          fetch(`${FLASK_TUNNEL}/api/territory/sections`),
          fetch(`${FLASK_TUNNEL}/api/salesforce/accounts-geo?territory_only=true`),
        ]);
        if (!sectRes.ok) throw new Error("Failed to load territory sections");
        const sectData = await sectRes.json();
        setTerritoryData(sectData);
        if (acctRes.ok) {
          const acctData = await acctRes.json();
          setAccounts(acctData.accounts || []);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ============================================================
  // MAP INIT
  // ============================================================
  useEffect(() => {
    if (!mapRef.current || !territoryData || mapInst.current) return;
    let cancelled = false;

    async function init() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: territoryData!.territory_bounds.center,
        zoom: territoryData!.territory_bounds.zoom,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      // Home pin
      const purpleIcon = (label: string) => L.divIcon({
        className: "",
        html: `<div style="background:#a855f7;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      L.marker([territoryData!.home_base.lat, territoryData!.home_base.lng], { icon: purpleIcon("H") })
        .addTo(map).bindTooltip(territoryData!.home_base.label, { className: "map-tooltip", direction: "top" });
      L.marker([territoryData!.office.lat, territoryData!.office.lng], { icon: purpleIcon("O") })
        .addTo(map).bindTooltip(territoryData!.office.label, { className: "map-tooltip", direction: "top" });

      // Section polygons
      territoryData!.sections.forEach((section) => {
        const polygonArrays = section.multiPolygon || [section.polygon];
        const layers: any[] = [];
        polygonArrays.forEach((ring) => {
          const poly = L.polygon(ring, {
            color: section.color, fillColor: section.color, fillOpacity: 0.15, weight: 2,
          }).addTo(map);
          poly.on("click", () => toggleSection(section.id));
          poly.bindTooltip(section.name, { className: "map-tooltip", direction: "top", sticky: true });
          layers.push(poly);
        });
        // Section label
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="color:${section.color};text-shadow:0 1px 3px rgba(0,0,0,0.9);font-size:11px;font-weight:600;white-space:nowrap;pointer-events:none;">${section.name}</div>`,
          iconSize: [120, 16], iconAnchor: [60, 8],
        });
        L.marker(section.center, { icon: labelIcon, interactive: false }).addTo(map);
        sectionLayersRef.current.set(section.id, layers);
      });

      mapInst.current = map;
    }
    init();
    return () => { cancelled = true; };
  }, [territoryData]);

  // ============================================================
  // SECTION SELECTION
  // ============================================================
  const toggleSection = useCallback((sectionId: number) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
      if (next.size > 0) setPaneOpen(true); else { setPaneOpen(false); setRouteMode(false); }
      return next;
    });
  }, []);

  // Update polygon highlight when selection changes
  useEffect(() => {
    sectionLayersRef.current.forEach((layers, id) => {
      const selected = selectedSections.has(id);
      layers.forEach((l) => l.setStyle({ fillOpacity: selected ? 0.35 : 0.15 }));
    });
  }, [selectedSections]);

  // ============================================================
  // ACCOUNT PINS
  // ============================================================
  useEffect(() => {
    if (!mapInst.current) return;
    // Clear existing
    accountMarkersRef.current.forEach((m) => mapInst.current.removeLayer(m));
    accountMarkersRef.current = [];

    if (pinMode === "off") return;

    const L = (window as any).L;
    if (!L) return;

    const visible = pinMode === "all"
      ? accounts.filter(a => a.lat && a.lng)
      : accounts.filter(a => a.lat && a.lng && selectedSections.has(a.section!));

    visible.forEach((a) => {
      const color = pinColor(a, colorMode);
      const marker = L.circleMarker([a.lat, a.lng], {
        radius: 5, fillColor: color, color: color, fillOpacity: 0.8, weight: 1,
      }).addTo(mapInst.current);
      marker.bindTooltip(a.name, { className: "map-tooltip", direction: "top" });
      marker.on("click", () => { setSelectedAccount(a); setModalOpen(true); highlightAccount(a); });
      accountMarkersRef.current.push(marker);
    });
  }, [pinMode, colorMode, accounts, selectedSections]);

  // ============================================================
  // HIGHLIGHT ACCOUNT ON MAP
  // ============================================================
  const highlightAccount = useCallback((account: Account) => {
    if (!mapInst.current || !account.lat || !account.lng) return;
    const L = (window as any).L;
    if (!L) return;
    if (highlightMarkerRef.current) mapInst.current.removeLayer(highlightMarkerRef.current);
    highlightMarkerRef.current = L.circleMarker([account.lat, account.lng], {
      radius: 12, color: "#ffffff", fillColor: "#3b82f6", fillOpacity: 0.6, weight: 3,
    }).addTo(mapInst.current);
    mapInst.current.panTo([account.lat, account.lng], { animate: true });
  }, []);

  // ============================================================
  // ROUTE DRAWING
  // ============================================================
  const drawRoute = useCallback((route: Account[]) => {
    if (!mapInst.current) return;
    const L = (window as any).L;
    if (!L) return;
    // Clear previous
    if (routeLayerRef.current) mapInst.current.removeLayer(routeLayerRef.current);
    routeMarkersRef.current.forEach(m => mapInst.current.removeLayer(m));
    routeMarkersRef.current = [];

    if (route.length === 0) return;

    const pts: [number, number][] = [HOME_COORDS, ...route.map(a => [a.lat!, a.lng!] as [number, number])];
    routeLayerRef.current = L.polyline(pts, { color: "#3b82f6", weight: 3, opacity: 0.9 }).addTo(mapInst.current);

    route.forEach((a, i) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.5);">${i + 1}</div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      const m = L.marker([a.lat!, a.lng!], { icon }).addTo(mapInst.current);
      m.bindTooltip(`${i + 1}. ${a.name}`, { className: "map-tooltip" });
      routeMarkersRef.current.push(m);
    });
  }, []);

  const clearRoute = useCallback(() => {
    if (!mapInst.current) return;
    if (routeLayerRef.current) { mapInst.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    routeMarkersRef.current.forEach(m => mapInst.current.removeLayer(m));
    routeMarkersRef.current = [];
    setOptimizedRoute([]);
    setRouteSelected(new Set());
    setRouteMode(false);
  }, []);

  // ============================================================
  // FILTERED & SORTED ACCOUNTS
  // ============================================================
  const filteredAccounts = useMemo(() => {
    let list = selectedSections.size > 0
      ? accounts.filter(a => selectedSections.has(a.section!))
      : [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "city") return (a.city || "").localeCompare(b.city || "");
      if (sortBy === "activity") {
        const da = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const db = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return db - da;
      }
      return 0;
    });
    return list;
  }, [accounts, selectedSections, searchQuery, sortBy]);

  // Group by section if multiple selected
  const groupedAccounts = useMemo(() => {
    if (selectedSections.size <= 1) return null;
    const groups: Map<number, Account[]> = new Map();
    filteredAccounts.forEach(a => {
      if (!groups.has(a.section!)) groups.set(a.section!, []);
      groups.get(a.section!)!.push(a);
    });
    return groups;
  }, [filteredAccounts, selectedSections]);

  const sectionName = (id: number) => territoryData?.sections.find(s => s.id === id)?.name || `Section ${id}`;
  const sectionColor = (id: number) => territoryData?.sections.find(s => s.id === id)?.color || "#888";

  // ============================================================
  // CLOSE PANE
  // ============================================================
  const closePaneAndDeselect = useCallback(() => {
    setPaneOpen(false);
    setSelectedSections(new Set());
    setModalOpen(false);
    clearRoute();
  }, [clearRoute]);

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (<AppLayout><div className="flex h-[calc(100vh-3rem)] items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" /><p className="text-muted-foreground">Loading territory map...</p></div></div></AppLayout>);
  }
  if (error) {
    return (<AppLayout><div className="flex h-[calc(100vh-3rem)] items-center justify-center"><p className="text-red-400">Error: {error}</p></div></AppLayout>);
  }

  const selectedSectionsList = Array.from(selectedSections);

  return (
    <AppLayout>
      <div className="relative flex h-[calc(100vh-3rem)]">
        {/* MAP */}
        <div ref={mapRef} className="flex-1" />

        {/* FLOATING PIN CONTROLS — top right */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-card/95 border border-border p-1.5 shadow-lg">
            <Layers className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            {(["off", "section", "all"] as const).map((m) => (
              <button key={m} onClick={() => setPinMode(m)} className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
                pinMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
                {m === "off" ? "Off" : m === "section" ? "Section" : "All"}
              </button>
            ))}
          </div>
          {pinMode !== "off" && (
            <div className="flex items-center gap-1 rounded-lg bg-card/95 border border-border p-1.5 shadow-lg">
              <button onClick={() => setColorMode(colorMode === "tier" ? "activity" : "tier")} className="px-2.5 py-1 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent font-medium">
                {colorMode === "tier" ? "By Tier" : "By Activity"}
              </button>
            </div>
          )}
        </div>

        {/* SECTION LEGEND — bottom left */}
        <div className="absolute left-4 bottom-4 z-[1000] rounded-lg bg-card/95 border border-border p-3 shadow-lg max-w-[200px]">
          <h3 className="text-xs font-semibold text-foreground mb-2">Territory Sections</h3>
          <div className="space-y-1">
            {territoryData?.sections.map((s) => (
              <button key={s.id} onClick={() => toggleSection(s.id)} className={cn(
                "w-full flex items-center gap-2 px-1.5 py-1 rounded text-xs transition-colors",
                selectedSections.has(s.id) ? "bg-accent" : "hover:bg-accent/50"
              )}>
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground truncate text-left">{s.name}</span>
              </button>
            ))}
            <button onClick={closePaneAndDeselect} className="w-full flex items-center gap-2 px-1.5 py-1 rounded text-xs hover:bg-accent/50 mt-1 pt-1 border-t border-border">
              <span className="h-2.5 w-2.5 rounded-sm border border-muted-foreground shrink-0" />
              <span className="text-muted-foreground">All Sections</span>
            </button>
          </div>
          {selectedSections.size > 0 && (
            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
              {filteredAccounts.length} accounts in {selectedSections.size} section{selectedSections.size > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* RIGHT PANE */}
        {paneOpen && (
          <div className="absolute right-0 top-0 z-[1000] h-full w-96 border-l border-border bg-card shadow-xl flex flex-col">
            {/* Pane Header */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedSectionsList.map(id => (
                      <span key={id} className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sectionColor(id) }} />
                        <span className="text-sm font-semibold text-foreground">{sectionName(id)}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{filteredAccounts.length} accounts</p>
                </div>
                <button onClick={closePaneAndDeselect} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
              </div>
              {/* Tabs */}
              <div className="flex gap-1">
                {(["accounts", "routes"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    activeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                  )}>
                    {t === "accounts" ? "Accounts" : "Routes"}
                  </button>
                ))}
              </div>
            </div>

            {/* ACCOUNTS TAB */}
            {activeTab === "accounts" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Search + Sort */}
                <div className="p-3 space-y-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search accounts..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-accent/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-xs bg-accent/50 border border-border rounded-md px-2 py-1 text-foreground">
                      <option value="name">Name A-Z</option>
                      <option value="activity">Last Activity</option>
                      <option value="city">City</option>
                    </select>
                    {!routeMode && (
                      <button onClick={() => setRouteMode(true)} className="ml-auto flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                        <Route className="h-3 w-3" /> Build Route
                      </button>
                    )}
                  </div>
                </div>
                {/* Account List */}
                <div className="flex-1 overflow-y-auto px-3 pb-3">
                  {groupedAccounts ? (
                    Array.from(groupedAccounts.entries()).map(([sId, accts]) => (
                      <div key={sId} className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1.5 sticky top-0 bg-card py-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sectionColor(sId) }} />
                          <span className="text-xs font-semibold text-muted-foreground">{sectionName(sId)} ({accts.length})</span>
                        </div>
                        {accts.map(a => <AccountRow key={a.id} account={a} routeMode={routeMode} routeSelected={routeSelected} onToggleRoute={(id) => setRouteSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} onClick={() => { setSelectedAccount(a); setModalOpen(true); highlightAccount(a); }} />)}
                      </div>
                    ))
                  ) : (
                    filteredAccounts.map(a => <AccountRow key={a.id} account={a} routeMode={routeMode} routeSelected={routeSelected} onToggleRoute={(id) => setRouteSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} onClick={() => { setSelectedAccount(a); setModalOpen(true); highlightAccount(a); }} />)
                  )}
                  {filteredAccounts.length === 0 && <p className="text-xs text-muted-foreground py-8 text-center">No accounts found</p>}
                </div>
                {/* Route Controls */}
                {routeMode && (
                  <div className="p-3 border-t border-border shrink-0 space-y-2">
                    <p className="text-xs text-muted-foreground">{routeSelected.size} selected for route</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 text-xs" disabled={routeSelected.size === 0} onClick={() => { const sel = accounts.filter(a => routeSelected.has(a.id) && a.lat && a.lng); const opt = optimizeRoute(HOME_COORDS, sel); setOptimizedRoute(opt); drawRoute(opt); }}>
                        <Route className="h-3 w-3 mr-1" /> Optimize
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs" disabled={optimizedRoute.length === 0} onClick={() => window.open(appleMapsUrl(HOME_COORDS, optimizedRoute), "_blank")}>
                        <Navigation className="h-3 w-3 mr-1" /> Apple Maps
                      </Button>
                    </div>
                    {optimizedRoute.length > 0 && (
                      <div className="flex items-center gap-2">
                        <input type="date" value={routeDate} onChange={e => setRouteDate(e.target.value)} className="text-xs bg-accent/50 border border-border rounded-md px-2 py-1 text-foreground flex-1" />
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => { /* TODO: POST to /api/salesforce/calendar */ alert("Save to calendar coming soon"); }}>
                          <Calendar className="h-3 w-3 mr-1" /> Save
                        </Button>
                      </div>
                    )}
                    <button onClick={clearRoute} className="text-xs text-muted-foreground hover:text-foreground">Cancel route</button>
                  </div>
                )}
              </div>
            )}

            {/* ROUTES TAB */}
            {activeTab === "routes" && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-4">
                  <input type="date" value={routeDate} onChange={e => setRouteDate(e.target.value)} className="text-xs bg-accent/50 border border-border rounded-md px-2 py-1.5 text-foreground flex-1" />
                </div>
                <p className="text-xs text-muted-foreground text-center py-8">Calendar route integration coming soon.<br/>Use the Accounts tab → Build Route to create routes now.</p>
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT DETAIL MODAL */}
        {modalOpen && selectedAccount && (
          <div className="absolute right-0 top-0 z-[1100] h-full w-96 bg-card border-l border-border shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border shrink-0">
              <div className="flex items-start justify-between">
                <h2 className="text-sm font-bold text-foreground pr-4">{selectedAccount.name}</h2>
                <button onClick={() => { setModalOpen(false); if (highlightMarkerRef.current && mapInst.current) { mapInst.current.removeLayer(highlightMarkerRef.current); highlightMarkerRef.current = null; } }} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground">{selectedAccount.type || "Account"} · Section {selectedAccount.section}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Address */}
              <div className="p-3 rounded-lg bg-accent/50">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    {selectedAccount.street && <p>{selectedAccount.street}</p>}
                    <p className="text-muted-foreground">{[selectedAccount.city, selectedAccount.state].filter(Boolean).join(", ")} {selectedAccount.zip}</p>
                  </div>
                </div>
              </div>
              {/* Details */}
              <div className="space-y-3">
                {selectedAccount.industry && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{selectedAccount.industry}</span></div>}
                {selectedAccount.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><a href={`tel:${selectedAccount.phone}`} className="text-primary hover:underline">{selectedAccount.phone}</a></div>}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", activityBadgeClass(selectedAccount.lastActivity))}>
                    {formatDate(selectedAccount.lastActivity)}
                  </span>
                </div>
                {selectedAccount.section && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: sectionColor(selectedAccount.section) }} />
                    <span className="text-muted-foreground">{sectionName(selectedAccount.section)}</span>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="space-y-2 pt-2">
                {routeMode && (
                  <Button size="sm" className="w-full text-xs" onClick={() => setRouteSelected(prev => { const n = new Set(prev); n.has(selectedAccount.id) ? n.delete(selectedAccount.id) : n.add(selectedAccount.id); return n; })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> {routeSelected.has(selectedAccount.id) ? "Remove from Route" : "Add to Route"}
                  </Button>
                )}
                <a href={`${SF_BASE}/${selectedAccount.id}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Salesforce
                </a>
                {selectedAccount.lat && selectedAccount.lng && (
                  <a href={`https://maps.apple.com/?daddr=${selectedAccount.lat},${selectedAccount.lng}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                    <Navigation className="h-3.5 w-3.5" /> Navigate
                  </a>
                )}
                {selectedAccount.website && (
                  <a href={selectedAccount.website.startsWith("http") ? selectedAccount.website : `https://${selectedAccount.website}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .map-tooltip { background: hsl(216 26% 9%) !important; border: 1px solid hsl(216 18% 14%) !important; color: hsl(0 0% 96%) !important; font-size: 11px !important; font-family: Inter, system-ui, sans-serif !important; padding: 4px 8px !important; border-radius: 6px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; }
        .map-tooltip::before { border-top-color: hsl(216 18% 14%) !important; }
        .leaflet-control-zoom a { background: hsl(216 26% 9%) !important; color: hsl(0 0% 96%) !important; border-color: hsl(216 18% 14%) !important; }
        .leaflet-container { background: hsl(216 26% 9%) !important; }
      `}</style>
    </AppLayout>
  );
}

// ============================================================
// ACCOUNT ROW COMPONENT
// ============================================================
function AccountRow({ account, routeMode, routeSelected, onToggleRoute, onClick }: {
  account: Account; routeMode: boolean; routeSelected: Set<string>; onToggleRoute: (id: string) => void; onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer group">
      {routeMode && (
        <input type="checkbox" checked={routeSelected.has(account.id)} onChange={(e) => { e.stopPropagation(); onToggleRoute(account.id); }} onClick={e => e.stopPropagation()} className="h-3 w-3 rounded border-border shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{account.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{account.city}{account.city && account.state ? ", " : ""}{account.state}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", activityBadgeClass(account.lastActivity))}>
          {account.lastActivity ? new Date(account.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None"}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}
