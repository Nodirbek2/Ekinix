import "server-only";
import { ApiError, fetchJson } from "./http";
export const groqModel = () => process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
export async function groqJson(
  system: string,
  facts: unknown,
  image?: { mime: string; data: string },
  timeout = 25000,
): Promise<unknown> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new ApiError(503, "ai_not_configured");
  try {
    const response = await fetchJson(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: groqModel(),
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: image
                ? [
                    { type: "text", text: JSON.stringify(facts) },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${image.mime};base64,${image.data}`,
                      },
                    },
                  ]
                : JSON.stringify(facts),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_completion_tokens: 2500,
          reasoning_effort: "none",
        }),
      },
      timeout,
    );
    if (response.choices?.[0]?.finish_reason !== "stop")
      throw Error("Incomplete output");
    return JSON.parse(response.choices[0].message.content);
  } catch {
    throw new ApiError(502, "ai_unavailable");
  }
}
