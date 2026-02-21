import { Crosshair, LayoutDashboard, PlusCircle, Settings, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: PlusCircle, label: "New Lead", to: "/new" },
];

export default function AppSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-16 flex-col items-center border-r border-border bg-sidebar py-6 lg:w-56">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-4">
        <Crosshair className="h-6 w-6 text-primary" />
        <span className="hidden text-sm font-bold tracking-tight text-foreground lg:block">
          Territory HQ
        </span>
      </div>

      {/* Nav */}
      <nav className="flex w-full flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 w-full">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  );
}
