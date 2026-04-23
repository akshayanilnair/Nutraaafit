import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronRight, Activity } from "lucide-react";
import { calcBMI, bmiCategory, calcDailyCalories } from "@/lib/api";
import { useUser } from "@/store";
import { toast } from "sonner";
import { UserProfile } from "@/types";

export default function Onboarding() {
  const navigate = useNavigate();
  const setProfile = useUser((s) => s.setProfile);
  const [step, setStep] = useState(1);

  const [data, setData] = useState({
    name: "",
    age: 25,
    gender: "male" as "male" | "female" | "other",
    height: 170,
    weight: 70,
    preferences: "veg" as "veg" | "non-veg" | "vegan",
    likes: "",
    dislikes: "",
    allergies: "",
    cuisinePreference: "Mixed" as UserProfile["cuisinePreference"],
    healthCondition: "",
  });

  const bmi = useMemo(() => calcBMI(data.weight, data.height), [data.weight, data.height]);
  const cat = bmiCategory(bmi);

  const submit = () => {
    if (!data.name) return toast.error("Please enter your name");
    const dailyCalorieGoal = calcDailyCalories(data);
    setProfile({ ...data, bmi, dailyCalorieGoal });
    toast.success("Profile created — welcome to NutraFit!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-accent-soft/30 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-cool shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">NutraFit</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-card animate-scale-in">
          <div className="mb-6 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-smooth ${
                  step >= s ? "bg-gradient-cool" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 className="font-display text-3xl font-bold">Tell us about you</h2>
              <p className="mt-1 text-muted-foreground">We'll calculate your BMI and daily calorie target.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="Your name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input type="number" value={data.age} onChange={(e) => setData({ ...data, age: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={data.gender} onValueChange={(v: any) => setData({ ...data, gender: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" value={data.height} onChange={(e) => setData({ ...data, height: +e.target.value })} />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={data.weight} onChange={(e) => setData({ ...data, weight: +e.target.value })} />
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-secondary/60 to-accent-soft/40 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Your BMI</p>
                      <p className="font-display text-4xl font-bold">{bmi}</p>
                      <p className={`mt-1 text-sm font-semibold ${cat.color}`}>{cat.label}</p>
                    </div>
                    <Activity className="h-12 w-12 text-primary opacity-70" />
                  </div>
                </div>
              </div>

              <Button className="mt-6 w-full shadow-glow" size="lg" onClick={() => setStep(2)}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-3xl font-bold">Food preferences</h2>
              <p className="mt-1 text-muted-foreground">Helps your AI meal planner & recipe suggestions.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Diet</Label>
                  <Select value={data.preferences} onValueChange={(v: any) => setData({ ...data, preferences: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Regional cuisine preference</Label>
                  <Select value={data.cuisinePreference} onValueChange={(v: any) => setData({ ...data, cuisinePreference: v })}>
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
                  <Label>Foods you like</Label>
                  <Textarea rows={2} placeholder="Paneer, dal, dosa..." value={data.likes} onChange={(e) => setData({ ...data, likes: e.target.value })} />
                </div>
                <div>
                  <Label>Foods you dislike</Label>
                  <Textarea rows={2} placeholder="Brinjal, bitter gourd..." value={data.dislikes} onChange={(e) => setData({ ...data, dislikes: e.target.value })} />
                </div>
                <div>
                  <Label>Allergies</Label>
                  <Input placeholder="Nuts, dairy, shellfish..." value={data.allergies} onChange={(e) => setData({ ...data, allergies: e.target.value })} />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 shadow-glow" onClick={() => setStep(3)}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-3xl font-bold">Health conditions</h2>
              <p className="mt-1 text-muted-foreground">Optional — we'll personalise food guidance.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Any condition or goal?</Label>
                  <Select value={data.healthCondition} onValueChange={(v) => setData({ ...data, healthCondition: v })}>
                    <SelectTrigger><SelectValue placeholder="Select or skip" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                      <SelectItem value="Diabetes">Diabetes</SelectItem>
                      <SelectItem value="Hypertension">Hypertension</SelectItem>
                      <SelectItem value="PCOS">PCOS / PCOD</SelectItem>
                      <SelectItem value="Cholesterol">High Cholesterol</SelectItem>
                      <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl bg-gradient-cool p-5 text-primary-foreground shadow-glow">
                  <p className="text-xs uppercase tracking-wide opacity-90">Daily calorie goal</p>
                  <p className="font-display text-4xl font-bold">{calcDailyCalories(data)} kcal</p>
                  <p className="mt-1 text-sm opacity-90">Mifflin-St Jeor · light activity</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1 shadow-glow" onClick={submit}>
                  Finish & enter NutraFit
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
