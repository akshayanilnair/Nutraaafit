// API client wired to the NutraFit backend.
import { INDIAN_FOODS } from "@/data/foods";
import { Food, UserProfile } from "@/types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return +(weightKg / (h * h)).toFixed(1);
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" };
  if (bmi < 25) return { label: "Healthy", color: "text-leaf" };
  if (bmi < 30) return { label: "Overweight", color: "text-accent" };
  return { label: "Obese", color: "text-chili" };
}

export function calcDailyCalories(p: Pick<UserProfile, "age" | "weight" | "height" | "gender">) {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  const bmr = p.gender === "male" ? base + 5 : base - 161;
  return Math.round(bmr * 1.4);
}

// ---------- Food search (local dataset) ----------
export async function searchFoods(query: string, region?: string): Promise<Food[]> {
  const q = query.trim().toLowerCase();
  return INDIAN_FOODS.filter((f) => {
    const matchQ = !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
    const matchR = !region || region === "All" || f.region === region;
    return matchQ && matchR;
  });
}

// ---------- Meal Plan ----------
export interface MealPlanInput {
  preferences: "veg" | "non-veg" | "vegan";
  likes: string;
  dislikes: string;
  allergies: string;
  cuisine: string;
  healthCondition?: string;
  calorieGoal: number;
}

export interface MealPlanDay {
  day: string;
  meals: { name: string; items: string[]; calories: number }[];
  totalCalories: number;
}

export async function generateMealPlan(input: MealPlanInput): Promise<MealPlanDay[]> {
  try {
    const res = await http<{ success: boolean; plan: MealPlanDay[] }>("/meal-plan", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (Array.isArray(res?.plan)) return res.plan;
  } catch (e) {
    console.warn("meal-plan API failed, using local fallback", e);
  }
  return mockMealPlan(input);
}

function mockMealPlan(input: MealPlanInput): MealPlanDay[] {
  const isVeg = input.preferences !== "non-veg";
  const breakfast = ["Idli", "Sambar", "Chutney"];
  const lunchVeg = ["2 Roti", "Dal Tadka", "Bhindi", "Curd"];
  const lunchNon = ["Chicken Curry", "Jeera Rice", "Salad"];
  const dinnerVeg = ["2 Roti", "Palak Paneer", "Salad"];
  const dinnerNon = ["Tandoori Chicken", "Roti", "Salad"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days.map((d, i) => {
    const totalCalories = Math.round(input.calorieGoal * (0.95 + Math.random() * 0.1));
    return {
      day: d,
      meals: [
        { name: "Breakfast", items: breakfast, calories: Math.round(totalCalories * 0.25) },
        { name: "Lunch", items: isVeg ? lunchVeg : (i % 2 ? lunchVeg : lunchNon), calories: Math.round(totalCalories * 0.35) },
        { name: "Snack", items: ["Roasted Chana", "Apple"], calories: Math.round(totalCalories * 0.1) },
        { name: "Dinner", items: isVeg ? dinnerVeg : (i % 2 ? dinnerNon : dinnerVeg), calories: Math.round(totalCalories * 0.3) },
      ],
      totalCalories,
    };
  });
}

// ---------- Recipe ----------
export interface Recipe {
  name: string;
  prepTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  calories: number;
}

export async function generateRecipe(ingredients: string): Promise<Recipe[]> {
  try {
    const res = await http<{ success: boolean; recipes: Recipe[] }>("/recipe", {
      method: "POST",
      body: JSON.stringify({ ingredients }),
    });
    if (Array.isArray(res?.recipes) && res.recipes.length) return res.recipes;
  } catch (e) {
    console.warn("recipe API failed", e);
  }
  return [
    {
      name: "Mixed Vegetable Sabzi",
      prepTime: "20 min",
      servings: 3,
      ingredients: [`Your ingredients: ${ingredients}`, "Onion", "Tomato", "Spices", "Oil, salt"],
      steps: ["Chop vegetables.", "Sauté onions.", "Add tomatoes & spices.", "Add veggies & cook covered.", "Serve hot."],
      calories: 220,
    },
  ];
}

// ---------- Scan Food ----------
export interface ScanResult {
  food: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  matchedFoodId?: string;
}

export async function scanFood(imageDataUrl: string): Promise<ScanResult> {
  try {
    const blob = await (await fetch(imageDataUrl)).blob();
    const fd = new FormData();
    fd.append("image", blob, "food.jpg");
    const res = await fetch(`${API_BASE}/scan-food`, { method: "POST", body: fd });
    if (res.ok) {
      const data = (await res.json()) as { success: boolean; result: ScanResult };
      if (data?.result) return data.result;
    }
  } catch (e) {
    console.warn("scan API failed, using local fallback", e);
  }
  const pick = INDIAN_FOODS[Math.floor(Math.random() * INDIAN_FOODS.length)];
  return {
    food: pick.name,
    confidence: 0.7 + Math.random() * 0.2,
    calories: pick.calories,
    protein: pick.protein,
    carbs: pick.carbs,
    fats: pick.fats,
    matchedFoodId: pick.id,
  };
}

// ---------- Health Guide ----------
export interface HealthGuide {
  condition: string;
  eat: string[];
  avoid: string[];
  tips: string[];
}

export async function healthGuide(condition: string): Promise<HealthGuide> {
  try {
    const res = await http<{ success: boolean; guide: HealthGuide }>("/health-guide", {
      method: "POST",
      body: JSON.stringify({ condition }),
    });
    if (res?.guide) return res.guide;
  } catch (e) {
    console.warn("health-guide API failed", e);
  }
  return {
    condition: condition || "General Wellness",
    eat: ["Seasonal fruits & vegetables", "Whole grains", "Protein at every meal", "Nuts & seeds", "Plenty of water"],
    avoid: ["Excess sugar/salt", "Ultra-processed foods", "Trans fats", "Sugary drinks"],
    tips: ["Eat the rainbow daily", "30 min activity per day", "Sleep 7-8 hours", "Stay hydrated"],
  };
}

// ---------- Chat ----------
export async function chatReply(message: string, profile: UserProfile | null): Promise<string> {
  try {
    const res = await http<{ success: boolean; reply: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, profile }),
    });
    if (res?.reply) return res.reply;
  } catch (e) {
    console.warn("chat API failed", e);
  }
  return "I'm your NutraFit assistant! Ask me about Indian foods, calories, BMI, weight goals, or specific health conditions.";
}
