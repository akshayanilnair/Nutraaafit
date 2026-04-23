import { Router, type IRouter } from "express";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

router.post("/meal-plan", async (req, res) => {
  try {
    const {
      preferences = "veg",
      dislikes = [],
      allergies = [],
      cuisine = "north",
      days = 1,
      goal,
      calorieTarget,
    } = req.body ?? {};

    const prompt = `Create a ${days}-day Indian ${cuisine} meal plan.
Diet preference: ${preferences}
Dislikes: ${Array.isArray(dislikes) ? dislikes.join(", ") || "none" : dislikes}
Allergies: ${Array.isArray(allergies) ? allergies.join(", ") || "none" : allergies}
${goal ? `Goal: ${goal}` : ""}
${calorieTarget ? `Daily calorie target: ${calorieTarget} kcal` : ""}

Respond ONLY in JSON with this shape:
{
  "mealPlan": [
    {
      "day": number,
      "totalCalories": number,
      "meals": {
        "breakfast": { "name": string, "description": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number },
        "lunch":     { "name": string, "description": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number },
        "snack":     { "name": string, "description": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number },
        "dinner":    { "name": string, "description": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }
      }
    }
  ],
  "notes": string
}`;

    const data = await chatJSON(
      "You are an expert Indian nutritionist. Always honor allergies and dislikes strictly.",
      prompt,
    );
    res.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (err) {
    req.log.error({ err }, "meal-plan failed");
    res.status(500).json({ success: false, error: "Failed to generate meal plan" });
  }
});

export default router;
