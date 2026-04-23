import { Router, type IRouter } from "express";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

router.post("/health-guide", async (req, res) => {
  try {
    const { healthCondition, condition } = req.body ?? {};
    const c = healthCondition ?? condition;
    if (!c) {
      return res.status(400).json({ success: false, error: "healthCondition is required" });
    }

    const prompt = `For someone with the health condition "${c}", give Indian-cuisine-friendly dietary guidance.

Respond ONLY in JSON:
{
  "condition": string,
  "summary": string,
  "foodsToEat":   [{ "name": string, "reason": string }],
  "foodsToAvoid": [{ "name": string, "reason": string }],
  "lifestyleTips": [string],
  "disclaimer": string
}`;

    const data = await chatJSON(
      "You are a clinical nutrition expert. Provide safe, general dietary guidance and always include a disclaimer to consult a doctor.",
      prompt,
    );
    res.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (err) {
    req.log.error({ err }, "health-guide failed");
    res.status(500).json({ success: false, error: "Failed to generate guidance" });
  }
});

export default router;
