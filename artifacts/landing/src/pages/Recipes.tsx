import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChefHat, Sparkles, Loader2, Clock, Users } from "lucide-react";
import { generateRecipe, Recipe } from "@/lib/api";
import { toast } from "sonner";

export default function Recipes() {
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  const generate = async () => {
    if (!ingredients.trim()) return toast.error("List a few ingredients first");
    setLoading(true);
    try {
      const r = await generateRecipe(ingredients);
      setRecipes(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recipe AI"
        description="What's in your kitchen? We'll turn it into an Indian dish."
        icon={<ChefHat className="h-5 w-5" />}
      />

      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <Textarea
          rows={3}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="e.g., 800g chicken, rice, onions, tomatoes, garam masala"
        />
        <Button onClick={generate} disabled={loading} className="mt-4 shadow-glow">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate recipes</>}
        </Button>
      </div>

      {recipes && (
        <div className="grid gap-5 animate-fade-in lg:grid-cols-2">
          {recipes.map((r) => (
            <div key={r.name} className="rounded-2xl bg-gradient-card p-6 shadow-soft">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold">{r.name}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.prepTime}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Serves {r.servings}</span>
                  </div>
                </div>
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">{r.calories} kcal</span>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Ingredients</p>
                <ul className="space-y-1 text-sm">
                  {r.ingredients.map((i) => (
                    <li key={i} className="flex gap-2"><span className="text-leaf">•</span> {i}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Steps</p>
                <ol className="space-y-2 text-sm">
                  {r.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
