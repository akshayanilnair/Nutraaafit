import { Router, type IRouter } from "express";
import multer from "multer";
import { openai, VISION_MODEL } from "../lib/openai";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router: IRouter = Router();

router.post("/scan-food", upload.single("image"), async (req, res) => {
  try {
    let dataUrl: string | null = null;
    if (req.file) {
      const mime = req.file.mimetype || "image/jpeg";
      dataUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    } else if (req.body?.imageUrl) {
      dataUrl = String(req.body.imageUrl);
    } else if (req.body?.imageBase64) {
      const b64 = String(req.body.imageBase64).replace(/^data:.*;base64,/, "");
      dataUrl = `data:image/jpeg;base64,${b64}`;
    }

    if (!dataUrl) {
      return res
        .status(400)
        .json({ success: false, error: "Provide an 'image' file, 'imageUrl', or 'imageBase64'." });
    }

    const completion = await openai.chat.completions.create({
      model: VISION_MODEL,
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition expert specializing in Indian cuisine. Identify the food in the image and estimate per-serving nutrition. Respond ONLY in JSON with this shape: {\"foodName\": string, \"confidence\": number (0-1), \"servingSize\": string, \"calories\": number, \"nutrients\": {\"protein_g\": number, \"carbs_g\": number, \"fat_g\": number, \"fiber_g\": number, \"sugar_g\": number}, \"description\": string}.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this food and provide nutrition info." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    res.json({ success: true, ...parsed });
  } catch (err) {
    req.log.error({ err }, "scan-food failed");
    res.status(500).json({ success: false, error: "Failed to analyze image" });
  }
});

export default router;
