export type Region = "North" | "South" | "East" | "West" | "Pan-India";
export type DietType = "veg" | "non-veg" | "vegan";

export interface Food {
  id: string;
  name: string;
  region: Region;
  category: string;
  servingDesc: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  veg: boolean;
}

export interface FoodLogEntry {
  id: string;
  foodId: string;
  name: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  date: string; // YYYY-MM-DD
  loggedAt: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: "male" | "female" | "other";
  bmi: number;
  preferences: DietType;
  likes: string;
  dislikes: string;
  allergies: string;
  cuisinePreference: "North Indian" | "South Indian" | "East Indian" | "West Indian" | "Mixed";
  healthCondition: string;
  dailyCalorieGoal: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}
