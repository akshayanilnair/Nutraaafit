import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarRange, Sparkles, Loader2 } from "lucide-react";
import { generateMealPlan, MealPlanDay } from "@/lib/api";
import { useUser } from "@/store";
import { toast } from "sonner";
import { UserProfile } from "@/types";

export default function MealPlanner() {
  const profile = useUser((s) => s.profile)!;
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MealPlanDay[] | null>(null);

  const [input, setInput] = useState({
    preferences: profile.preferences,
    likes: profile.likes,
    dislikes: profile.dislikes,
    allergies: profile.allergies,
    cuisine: profile.cuisinePreference as UserProfile["cuisinePreference"],
    healthCondition: profile.healthCondition,
    calorieGoal: profile.dailyCalorieGoal,
  });

  const generate = async () => {
    setLoading(true);
    try {
      const p = await generateMealPlan(input);
      setPlan(p);
      toast.success("Your weekly plan is ready!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Meal Planner"
        description="Tell us your preferences and we'll cook up a balanced Indian meal plan."
        icon={<CalendarRange className="h-5 w-5" />}
      />

      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <h3 className="mb-4 font-display text-xl font-bold">Your preferences</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Diet</Label>
            <Select value={input.preferences} onValueChange={(v: any) => setInput({ ...input, preferences: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cuisine</Label>
            <Select value={input.cuisine} onValueChange={(v: any) => setInput({ ...input, cuisine: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="North Indian">North Indian</SelectItem>
                <SelectItem value="South Indian">South Indian</SelectItem>
                <SelectItem value="East Indian">East Indian</SelectItem>
                <SelectItem value="West Indian">West Indian</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Likes</Label>
            <Input value={input.likes} onChange={(e) => setInput({ ...input, likes: e.target.value })} placeholder="paneer, dosa..." />
          </div>
          <div>
            <Label>Dislikes</Label>
            <Input value={input.dislikes} onChange={(e) => setInput({ ...input, dislikes: e.target.value })} placeholder="brinjal..." />
          </div>
          <div>
            <Label>Allergies</Label>
            <Input value={input.allergies} onChange={(e) => setInput({ ...input, allergies: e.target.value })} placeholder="nuts, dairy..." />
          </div>
          <div>
            <Label>Daily calorie goal</Label>
            <Input type="number" value={input.calorieGoal} onChange={(e) => setInput({ ...input, calorieGoal: +e.target.value })} />
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="mt-6 shadow-glow" size="lg">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cooking your plan...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate weekly plan</>}
        </Button>
      </div>

      {plan && (
        <div className="grid gap-4 animate-fade-in md:grid-cols-2 xl:grid-cols-3">
          {plan.map((d) => (
            <div key={d.day} className="rounded-2xl bg-gradient-card p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-display text-xl font-bold">{d.day}</h4>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {d.totalCalories} kcal
                </span>
              </div>
              <div className="space-y-3">
                {d.meals.map((m) => (
                  <div key={m.name} className="rounded-xl bg-card/80 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">{m.name}</p>
                      <p className="text-xs font-semibold tabular-nums text-muted-foreground">{m.calories} kcal</p>
                    </div>
                    <p className="mt-1 text-sm">{m.items.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
