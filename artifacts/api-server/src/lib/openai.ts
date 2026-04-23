import OpenAI from "openai";

const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

if (!baseURL || !apiKey) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY must be set",
  );
}

export const openai = new OpenAI({ baseURL, apiKey });

export const CHAT_MODEL = "gpt-5.4";
export const VISION_MODEL = "gpt-5.4";

export async function chatJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const content = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

export async function chatText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}
