import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Sparkles, Plus } from "lucide-react";
import { scanFood, ScanResult } from "@/lib/api";
import { useFoodLog } from "@/store";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
const todayKey = () => new Date().toISOString().slice(0, 10);

export default function FoodScanner() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [meal, setMeal] = useState<typeof MEALS[number]>("lunch");
  const add = useFoodLog((s) => s.add);

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      setResult(null);
    };
    reader.readAsDataURL(f);
  };

  const scan = async () => {
    if (!preview) return;
    setScanning(true);
    try {
      const r = await scanFood(preview);
      setResult(r);
      toast.success(`Detected: ${r.food}`);
    } finally {
      setScanning(false);
    }
  };

  const logIt = () => {
    if (!result) return;
    add({
      foodId: result.matchedFoodId ?? "scan",
      name: result.food,
      servings: 1,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      meal,
      date: todayKey(),
    });
    toast.success("Added to your food log");
    setResult(null);
    setPreview(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Food Scanner"
        description="Snap or upload a photo. Our AI estimates the dish, calories and macros."
        icon={<Camera className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload card */}
        <div className="rounded-2xl bg-card p-6 shadow-soft">
          <div
            onClick={() => fileRef.current?.click()}
            className="group flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/30 transition-smooth hover:border-primary/50 hover:bg-secondary/50"
          >
            {preview ? (
              <img src={preview} alt="Food" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm text-accent-foreground shadow-warm transition-smooth group-hover:scale-110">
                  <Upload className="h-7 w-7" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold">Drop or click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG · or use your camera</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
              <Camera className="mr-1 h-4 w-4" /> Choose photo
            </Button>
            <Button className="flex-1 shadow-glow" onClick={scan} disabled={!preview || scanning}>
              <Sparkles className="mr-1 h-4 w-4" />
              {scanning ? "Analyzing..." : "Scan with AI"}
            </Button>
          </div>
        </div>

        {/* Result card */}
        <div className="rounded-2xl bg-card p-6 shadow-soft">
          {scanning ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 font-display text-lg">AI is identifying your dish...</p>
            </div>
          ) : result ? (
            <div className="space-y-5 animate-fade-in">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Detected dish</p>
                <h3 className="font-display text-3xl font-bold">{result.food}</h3>
                <p className="mt-1 text-sm text-leaf">
                  {Math.round(result.confidence * 100)}% confidence
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-warm p-5 text-accent-foreground shadow-warm">
                <p className="text-xs uppercase opacity-90">Estimated calories</p>
                <p className="font-display text-4xl font-bold">{result.calories} kcal</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-leaf/10 p-3 text-center">
                  <p className="font-display text-xl font-bold text-leaf">{result.protein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div className="rounded-xl bg-turmeric/15 p-3 text-center">
                  <p className="font-display text-xl font-bold text-turmeric">{result.carbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="rounded-xl bg-chili/10 p-3 text-center">
                  <p className="font-display text-xl font-bold text-chili">{result.fats}g</p>
                  <p className="text-xs text-muted-foreground">Fats</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Select value={meal} onValueChange={(v: any) => setMeal(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button className="flex-1 shadow-glow" onClick={logIt}>
                  <Plus className="mr-1 h-4 w-4" /> Add to food log
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-cool text-primary-foreground shadow-glow">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-4 font-display text-xl font-bold">Ready when you are</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Upload a photo of any Indian dish — biryani, thali, dosa — and let the AI do the rest.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
