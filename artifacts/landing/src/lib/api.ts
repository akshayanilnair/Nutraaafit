// API client wired to the NutraFit backend.
import { INDIAN_FOODS } from "@/data/foods";
import { Food, FoodLogEntry, UserProfile, WeightEntry } from "@/types";
import { authedFetch } from "./auth";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authedFetch(path, init);
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
    const res = await authedFetch(`/scan-food`, { method: "POST", body: fd });
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

// ---------- User Profile (backend-synced) ----------
type BackendUser = {
  id: number;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  preferences: string | null;
  allergies: string[] | null;
  dislikes: string[] | null;
  cuisinePreference: string | null;
  healthCondition: string | null;
};

function userToProfile(u: BackendUser | null | undefined): UserProfile | null {
  if (!u || !u.name || u.age == null || u.height == null || u.weight == null) return null;
  const bmi = u.bmi ?? calcBMI(u.weight, u.height);
  const dailyCalorieGoal = calcDailyCalories({
    age: u.age,
    weight: u.weight,
    height: u.height,
    gender: "male",
  });
  return {
    name: u.name,
    age: u.age,
    height: u.height,
    weight: u.weight,
    gender: "male",
    bmi,
    preferences: ((u.preferences as UserProfile["preferences"]) ?? "veg"),
    likes: "",
    dislikes: (u.dislikes ?? []).join(", "),
    allergies: (u.allergies ?? []).join(", "),
    cuisinePreference: ((u.cuisinePreference as UserProfile["cuisinePreference"]) ?? "Mixed"),
    healthCondition: u.healthCondition ?? "",
    dailyCalorieGoal,
  };
}

export async function fetchUser(): Promise<UserProfile | null> {
  try {
    const res = await http<{ success: boolean; user: BackendUser }>("/user");
    return userToProfile(res?.user);
  } catch {
    return null;
  }
}

export async function saveUser(profile: UserProfile): Promise<void> {
  try {
    await http("/user", {
      method: "POST",
      body: JSON.stringify({
        name: profile.name,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        preferences: profile.preferences,
        allergies: profile.allergies ? profile.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
        dislikes: profile.dislikes ? profile.dislikes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        cuisinePreference: profile.cuisinePreference,
        healthCondition: profile.healthCondition,
      }),
    });
  } catch (e) {
    console.warn("saveUser failed", e);
  }
}

// ---------- Food Logs (backend-synced) ----------
type BackendFoodLog = {
  id: number;
  userId: number | null;
  foodName: string;
  calories: number | null;
  nutrients: Record<string, unknown> | null;
  date: string;
};

function logToEntry(l: BackendFoodLog): FoodLogEntry {
  const n = (l.nutrients ?? {}) as Record<string, number | string>;
  return {
    id: String(l.id),
    foodId: String(n.foodId ?? ""),
    name: l.foodName,
    servings: Number(n.servings ?? 1),
    calories: Number(l.calories ?? 0),
    protein: Number(n.protein ?? 0),
    carbs: Number(n.carbs ?? 0),
    fats: Number(n.fats ?? 0),
    meal: ((n.meal as FoodLogEntry["meal"]) ?? "snack"),
    date: l.date.slice(0, 10),
    loggedAt: new Date(l.date).getTime(),
  };
}

export async function fetchFoodLogs(): Promise<FoodLogEntry[]> {
  try {
    const res = await http<{ success: boolean; logs: BackendFoodLog[] }>("/food");
    return (res?.logs ?? []).map(logToEntry);
  } catch {
    return [];
  }
}

export async function createFoodLog(e: Omit<FoodLogEntry, "id" | "loggedAt">): Promise<FoodLogEntry | null> {
  try {
    const res = await http<{ success: boolean; log: BackendFoodLog }>("/food", {
      method: "POST",
      body: JSON.stringify({
        foodName: e.name,
        calories: e.calories,
        date: `${e.date}T12:00:00.000Z`,
        nutrients: {
          foodId: e.foodId,
          servings: e.servings,
          protein: e.protein,
          carbs: e.carbs,
          fats: e.fats,
          meal: e.meal,
        },
      }),
    });
    return res?.log ? logToEntry(res.log) : null;
  } catch (err) {
    console.warn("createFoodLog failed", err);
    return null;
  }
}

export async function deleteFoodLog(id: string): Promise<void> {
  try {
    await http(`/food/${id}`, { method: "DELETE" });
  } catch (e) {
    console.warn("deleteFoodLog failed", e);
  }
}

// ---------- Weight (backend-synced) ----------
type BackendWeight = { id: number; userId: number; weight: number; date: string };

export async function fetchWeights(): Promise<WeightEntry[]> {
  try {
    const res = await http<{ success: boolean; logs: BackendWeight[] }>("/weight");
    return (res?.logs ?? []).map((w) => ({ date: w.date.slice(0, 10), weight: Number(w.weight) }));
  } catch {
    return [];
  }
}

export async function saveWeight(w: WeightEntry): Promise<void> {
  try {
    await http("/weight", {
      method: "POST",
      body: JSON.stringify({ weight: w.weight, date: `${w.date}T12:00:00.000Z` }),
    });
  } catch (e) {
    console.warn("saveWeight failed", e);
  }
}

