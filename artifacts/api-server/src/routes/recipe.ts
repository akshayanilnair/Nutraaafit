import { Router, type IRouter } from "express";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

router.post("/recipe", async (req, res) => {
  try {
    const { ingredients, cuisine = "Indian", servings = 2, dietary } = req.body ?? {};
    if (!ingredients) {
      return res.status(400).json({ success: false, error: "ingredients is required" });
    }
    const list = Array.isArray(ingredients) ? ingredients.join(", ") : String(ingredients);

    const prompt = `Create a ${cuisine} recipe using primarily these ingredients: ${list}.
Servings: ${servings}
${dietary ? `Dietary notes: ${dietary}` : ""}

Respond ONLY in JSON:
{
  "name": string,
  "cuisine": string,
  "servings": number,
  "prepTime": string,
  "cookTime": string,
  "ingredients": [{ "item": string, "quantity": string }],
  "steps": [string],
  "nutritionPerServing": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number },
  "tips": [string]
}`;

    const data = await chatJSON(
      "You are an expert Indian home chef. Create authentic, practical recipes.",
      prompt,
    );
    res.json({ success: true, recipe: data });
  } catch (err) {
    req.log.error({ err }, "recipe failed");
    res.status(500).json({ success: false, error: "Failed to generate recipe" });
  }
});

export default router;
