import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  Camera,
  CalendarRange,
  ChefHat,
  HeartPulse,
  TrendingUp,
  MessageCircle,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useUser } from "@/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/log", label: "Food Log", icon: Utensils },
  { to: "/scanner", label: "Food Scanner", icon: Camera },
  { to: "/planner", label: "Meal Planner", icon: CalendarRange },
  { to: "/recipes", label: "Recipe AI", icon: ChefHat },
  { to: "/health", label: "Health Guide", icon: HeartPulse },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/chat", label: "AI Chatbot", icon: MessageCircle },
];

export default function AppLayout() {
  const profile = useUser((s) => s.profile);
  const reset = useUser((s) => s.reset);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-cool shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-none">NutraFit</p>
            <p className="text-xs text-muted-foreground">AI Nutrition · India</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm font-semibold text-accent-foreground">
              {profile?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile?.name ?? "Guest"}</p>
              <p className="text-xs text-muted-foreground">BMI {profile?.bmi ?? "—"}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                reset();
                navigate("/");
              }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-cool">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">NutraFit</span>
        </div>
        <span className="text-xs text-muted-foreground">{profile?.name}</span>
      </header>

      {/* Main */}
      <main className="md:ml-64">
        <div className="container max-w-6xl py-6 md:py-10">
          <Outlet />
        </div>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur md:hidden">
          {nav.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
}
