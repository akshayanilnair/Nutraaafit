import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, Sparkles, Loader2, Check, X, Lightbulb } from "lucide-react";
import { healthGuide, HealthGuide as HG } from "@/lib/api";

const CONDITIONS = [
  "Diabetes",
  "Weight Loss",
  "Hypertension",
  "PCOS",
  "Cholesterol",
  "Muscle Gain",
  "General Wellness",
];

export default function HealthGuidePage() {
  const [condition, setCondition] = useState("Diabetes");
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<HG | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      setGuide(await healthGuide(condition));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Health-Based Food Guide"
        description="Get personalised eat / avoid lists for your health condition."
        icon={<HeartPulse className="h-5 w-5" />}
      />

      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <p className="mb-1.5 text-sm font-medium">Condition or goal</p>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={loading} className="shadow-glow">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating</> : <><Sparkles className="mr-2 h-4 w-4" /> Get guidance</>}
          </Button>
        </div>
      </div>

      {guide && (
        <div className="grid gap-5 animate-fade-in md:grid-cols-2">
          <div className="rounded-2xl bg-gradient-leaf p-6 text-primary-foreground shadow-glow">
            <div className="mb-4 flex items-center gap-2">
              <Check className="h-5 w-5" />
              <h3 className="font-display text-xl font-bold">What to eat</h3>
            </div>
            <ul className="space-y-2">
              {guide.eat.map((i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-none opacity-80" /> {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-gradient-warm p-6 text-accent-foreground shadow-warm">
            <div className="mb-4 flex items-center gap-2">
              <X className="h-5 w-5" />
              <h3 className="font-display text-xl font-bold">What to avoid</h3>
            </div>
            <ul className="space-y-2">
              {guide.avoid.map((i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <X className="mt-0.5 h-4 w-4 flex-none opacity-80" /> {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-soft md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h3 className="font-display text-xl font-bold">Lifestyle tips</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {guide.tips.map((t) => (
                <div key={t} className="rounded-xl bg-secondary/50 p-3 text-sm">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
