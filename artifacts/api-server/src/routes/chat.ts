import { Router, type IRouter } from "express";
import { openai, CHAT_MODEL } from "../lib/openai";

const router: IRouter = Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body ?? {};
    if (!message && !Array.isArray(history)) {
      return res.status(400).json({ success: false, error: "message is required" });
    }

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content:
          "You are NutraFit AI, a friendly Indian nutrition and fitness assistant. Provide concise, practical guidance grounded in Indian cuisines and lifestyles. If asked medical questions, recommend a doctor.",
      },
    ];
    if (Array.isArray(history)) {
      for (const m of history) {
        if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
          messages.push({ role: m.role, content: m.content });
        }
      }
    }
    if (message) messages.push({ role: "user", content: String(message) });

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      max_completion_tokens: 1024,
      messages,
    });
    const reply = completion.choices[0]?.message?.content ?? "";
    res.json({ success: true, reply });
  } catch (err) {
    req.log.error({ err }, "chat failed");
    res.status(500).json({ success: false, error: "Chat failed" });
  }
});

export default router;
