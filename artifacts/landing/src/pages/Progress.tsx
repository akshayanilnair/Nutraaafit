import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Plus } from "lucide-react";
import { useFoodLog, useUser, useWeights } from "@/store";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { bmiCategory, calcBMI } from "@/lib/api";

export default function Progress() {
  const profile = useUser((s) => s.profile)!;
  const updateWeight = useUser((s) => s.updateWeight);
  const weights = useWeights((s) => s.entries);
  const addWeight = useWeights((s) => s.add);
  const entries = useFoodLog((s) => s.entries);

  const [w, setW] = useState(profile.weight.toString());

  const logWeight = () => {
    const num = +w;
    if (!num || num < 20 || num > 300) return toast.error("Enter a valid weight");
    const date = new Date().toISOString().slice(0, 10);
    addWeight({ date, weight: num });
    updateWeight(num);
    toast.success("Weight saved");
  };

  // last 14 days calorie data
  const calorieData = useMemo(() => {
    const arr: { day: string; kcal: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const k = entries.filter((e) => e.date === key).reduce((s, e) => s + e.calories, 0);
      arr.push({ day: d.toLocaleDateString("en", { month: "short", day: "numeric" }), kcal: k });
    }
    return arr;
  }, [entries]);

  const weightSeed = weights.length === 0 ? [{ date: new Date().toISOString().slice(0, 10), weight: profile.weight }] : weights;
  const bmiSeries = weightSeed.map((w) => ({
    date: new Date(w.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    bmi: calcBMI(w.weight, profile.height),
    weight: w.weight,
  }));

  const cat = bmiCategory(profile.bmi);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Progress Tracker"
        description="Visualise your weight, BMI and calorie trends."
        icon={<TrendingUp className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-gradient-cool p-6 text-primary-foreground shadow-glow">
          <p className="text-xs uppercase tracking-wide opacity-90">Current BMI</p>
          <p className="font-display text-5xl font-bold">{profile.bmi}</p>
          <p className="mt-1 text-sm font-semibold opacity-95">{cat.label}</p>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide opacity-90">Current weight</p>
            <p className="font-display text-2xl font-bold">{profile.weight} kg</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-soft lg:col-span-2">
          <h3 className="mb-4 font-display text-xl font-bold">Log today's weight</h3>
          <div className="flex gap-3">
            <Input type="number" value={w} onChange={(e) => setW(e.target.value)} placeholder="Weight in kg" />
            <Button onClick={logWeight} className="shadow-glow"><Plus className="mr-1 h-4 w-4" /> Save</Button>
          </div>
          <div className="mt-6 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bmiSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--accent))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <h3 className="mb-4 font-display text-xl font-bold">14-day calorie intake</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calorieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="kcal" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
