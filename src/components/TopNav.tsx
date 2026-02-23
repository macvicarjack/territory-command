import { NavLink, useSearchParams } from "react-router-dom";
import {
  Home, Target, DollarSign, Map as MapIcon, Calendar, Users,
  StickyNote, Mail, Clock, Search, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Target, label: "Outcomes", to: "/outcomes" },
  { icon: DollarSign, label: "Pipeline", to: "/pipeline" },
  { icon: MapIcon, label: "Territory", to: "/territory" },
  { icon: MapIcon, label: "Map", to: "/map" },
  { icon: Calendar, label: "Calendar", to: "/calendar" },
  { icon: Users, label: "Prospects", to: "/prospects" },
  { icon: StickyNote, label: "Notes", to: "/notes" },
  { icon: Mail, label: "Email Bridge", to: "/email" },
  { icon: Clock, label: "Waiting Room", to: "/waiting" },
];

export default function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-50 flex h-12 items-center gap-1 border-b border-border bg-topnav px-3">
      {/* Brand */}
      <div className="mr-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <span className="hidden text-sm font-bold tracking-tight text-foreground sm:block">TerritoryHQ</span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Filters & Search */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearchOpen(false); }}
              placeholder="Search accounts, outcomes..."
              className="h-7 w-48 rounded-md border border-border bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="hidden items-center gap-1.5 md:flex">
          <FilterPill label="Section" options={["All", "1", "2", "3", "4", "5", "6", "7", "8", "9"]} />
          <FilterPill label="Tier" options={["All", "A", "B", "C"]} />
          <FilterPill label="Window" options={["Today", "Week", "30d"]} />
        </div>
      </div>
    </header>
  );
}

function FilterPill({ label, options }: { label: string; options: string[] }) {
  const [value, setValue] = useState(options[0]);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 items-center gap-1 rounded-md bg-accent px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Filter className="h-3 w-3" />
        {label}: <span className="font-medium text-foreground">{value}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 rounded-lg border border-border bg-popover p-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { setValue(opt); setOpen(false); }}
              className={cn(
                "block w-full rounded-md px-3 py-1.5 text-left text-xs",
                opt === value ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
