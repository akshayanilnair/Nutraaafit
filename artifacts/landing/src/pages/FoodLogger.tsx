import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Utensils, Search, Plus, Mic, Trash2 } from "lucide-react";
import { INDIAN_FOODS, REGIONS } from "@/data/foods";
import { useFoodLog } from "@/store";
import { toast } from "sonner";
import { Food } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
const todayKey = () => new Date().toISOString().slice(0, 10);

export default function FoodLogger() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [picked, setPicked] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<typeof MEALS[number]>("lunch");
  const [listening, setListening] = useState(false);

  const add = useFoodLog((s) => s.add);
  const remove = useFoodLog((s) => s.remove);
  const entries = useFoodLog((s) => s.entries);
  const todays = entries.filter((e) => e.date === todayKey());

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return INDIAN_FOODS.filter((f) => {
      const r = region === "All" || f.region === region;
      const t = !term || f.name.toLowerCase().includes(term) || f.category.toLowerCase().includes(term);
      return r && t;
    }).slice(0, 30);
  }, [q, region]);

  const log = () => {
    if (!picked) return;
    add({
      foodId: picked.id,
      name: picked.name,
      servings,
      calories: Math.round(picked.calories * servings),
      protein: +(picked.protein * servings).toFixed(1),
      carbs: +(picked.carbs * servings).toFixed(1),
      fats: +(picked.fats * servings).toFixed(1),
      meal,
      date: todayKey(),
    });
    toast.success(`${picked.name} added to ${meal}`);
    setPicked(null);
    setServings(1);
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice not supported in this browser");
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    setListening(true);
    r.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript;
      setQ(text);
      toast.success(`Heard: "${text}"`);
    };
    r.onerror = () => toast.error("Voice input failed");
    r.onend = () => setListening(false);
    r.start();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Food Logger"
        description="Search 150+ Indian dishes and log them in seconds."
        icon={<Utensils className="h-5 w-5" />}
      />

      {/* Search bar */}
      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dosa, rajma, biryani..."
              className="pl-9"
            />
          </div>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={startVoice} disabled={listening}>
            <Mic className={`mr-1 h-4 w-4 ${listening ? "text-chili animate-pulse" : ""}`} />
            {listening ? "Listening..." : "Voice"}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => setPicked(f)}
            className="group rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-card"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.region} · {f.category}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${f.veg ? "bg-leaf/15 text-leaf" : "bg-chili/15 text-chili"}`}>
                {f.veg ? "VEG" : "NON-VEG"}
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{f.calories}<span className="ml-1 text-xs font-medium text-muted-foreground">kcal</span></p>
            <p className="text-xs text-muted-foreground">{f.servingDesc}</p>
            <div className="mt-3 flex gap-2 text-[11px]">
              <span className="rounded-md bg-leaf/10 px-2 py-0.5 text-leaf">P {f.protein}g</span>
              <span className="rounded-md bg-turmeric/15 px-2 py-0.5 text-turmeric">C {f.carbs}g</span>
              <span className="rounded-md bg-chili/10 px-2 py-0.5 text-chili">F {f.fats}g</span>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-primary opacity-0 transition-smooth group-hover:opacity-100">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add to log
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
          No foods match. Try a different search or region.
        </div>
      )}

      {/* Today's log */}
      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <h3 className="font-display text-xl font-bold">Today's log</h3>
        {todays.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing logged yet today.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {todays.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{e.meal} · {e.servings}× · P{Math.round(e.protein)} C{Math.round(e.carbs)} F{Math.round(e.fats)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold tabular-nums">{Math.round(e.calories)}</span>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={!!picked} onOpenChange={(o) => !o && setPicked(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{picked?.name}</DialogTitle>
          </DialogHeader>
          {picked && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{picked.servingDesc} · {picked.calories} kcal</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Servings</Label>
                  <Input type="number" min={0.25} step={0.25} value={servings} onChange={(e) => setServings(+e.target.value)} />
                </div>
                <div>
                  <Label>Meal</Label>
                  <Select value={meal} onValueChange={(v: any) => setMeal(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-cool p-4 text-primary-foreground">
                <p className="text-xs uppercase opacity-90">Total</p>
                <p className="font-display text-2xl font-bold">{Math.round(picked.calories * servings)} kcal</p>
              </div>
              <Button onClick={log} className="w-full shadow-glow">Add to log</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
