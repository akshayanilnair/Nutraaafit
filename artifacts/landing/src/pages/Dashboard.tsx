import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useFoodLog, useUser, useWeights } from "@/store";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import {
  Flame,
  Beef,
  Wheat,
  Droplet,
  Activity,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { bmiCategory } from "@/lib/api";

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const profile = useUser((s) => s.profile)!;
  const entries = useFoodLog((s) => s.entries);
  const weights = useWeights((s) => s.entries);

  const today = todayKey();
  const todays = entries.filter((e) => e.date === today);

  const totals = todays.reduce(
    (a, e) => ({
      kcal: a.kcal + e.calories,
      p: a.p + e.protein,
      c: a.c + e.carbs,
      f: a.f + e.fats,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  const remaining = Math.max(0, profile.dailyCalorieGoal - totals.kcal);
  const pct = Math.min(100, Math.round((totals.kcal / profile.dailyCalorieGoal) * 100));

  // last 7 days
  const last7 = useMemo(() => {
    const arr: { day: string; kcal: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const k = entries.filter((e) => e.date === key).reduce((s, e) => s + e.calories, 0);
      arr.push({ day: d.toLocaleDateString("en", { weekday: "short" }), kcal: k });
    }
    return arr;
  }, [entries]);

  const macroData = [
    { name: "Protein", value: Math.round(totals.p), color: "hsl(var(--leaf))" },
    { name: "Carbs", value: Math.round(totals.c), color: "hsl(var(--turmeric))" },
    { name: "Fats", value: Math.round(totals.f), color: "hsl(var(--chili))" },
  ];

  const cat = bmiCategory(profile.bmi);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Namaste, ${profile.name} 🙏`}
        description="Here's how your nutrition is shaping up today."
        actions={
          <Button asChild className="shadow-glow">
            <Link to="/log"><Plus className="mr-1 h-4 w-4" /> Log food</Link>
          </Button>
        }
      />

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Calories today"
          value={totals.kcal}
          unit={`/ ${profile.dailyCalorieGoal}`}
          icon={<Flame className="h-5 w-5" />}
          accent="warm"
          hint={`${remaining} kcal remaining`}
        />
        <StatCard label="Protein" value={Math.round(totals.p)} unit="g" icon={<Beef className="h-5 w-5" />} accent="leaf" />
        <StatCard label="Carbs" value={Math.round(totals.c)} unit="g" icon={<Wheat className="h-5 w-5" />} accent="warm" />
        <StatCard label="Fats" value={Math.round(totals.f)} unit="g" icon={<Droplet className="h-5 w-5" />} accent="chili" />
      </div>

      {/* Calories ring + macro pie */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">7-day calorie trend</h3>
            <Link to="/progress" className="text-xs text-primary hover:underline">View detail <ArrowRight className="inline h-3 w-3" /></Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7}>
                <defs>
                  <linearGradient id="kcal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                />
                <Area type="monotone" dataKey="kcal" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#kcal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-display text-xl font-bold">Macro split</h3>
          {totals.kcal > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Legend iconType="circle" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Plus className="mb-2 h-8 w-8 opacity-50" />
              Log a meal to see your macros
            </div>
          )}
        </div>
      </div>

      {/* BMI + recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-gradient-cool p-6 text-primary-foreground shadow-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-90">Your BMI</p>
              <p className="font-display text-5xl font-bold">{profile.bmi}</p>
              <p className="mt-1 text-sm font-semibold opacity-95">{cat.label}</p>
            </div>
            <Activity className="h-10 w-10 opacity-80" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-white/10 p-2">
              <p className="opacity-80">Height</p>
              <p className="font-bold">{profile.height} cm</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="opacity-80">Weight</p>
              <p className="font-bold">{profile.weight} kg</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="opacity-80">Goal</p>
              <p className="font-bold">{profile.dailyCalorieGoal}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Today's meals</h3>
            <Button asChild size="sm" variant="ghost">
              <Link to="/log">View all</Link>
            </Button>
          </div>
          {todays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No meals logged yet today.</p>
              <Button asChild className="mt-4">
                <Link to="/log">Log your first meal</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {todays.slice(-5).reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {e.meal} · {e.servings}× serving
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold tabular-nums">{Math.round(e.calories)} kcal</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calorie progress bar */}
      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Calorie progress</p>
            <p className="font-display text-2xl font-bold">{pct}%</p>
          </div>
          <p className="text-sm text-muted-foreground">{totals.kcal} / {profile.dailyCalorieGoal} kcal</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-warm transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
