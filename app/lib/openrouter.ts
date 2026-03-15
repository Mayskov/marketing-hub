import OpenAI from "openai";

export const ANALYSIS_MODEL = "google/gemini-2.5-flash";
export const CONTENT_MODEL = "anthropic/claude-sonnet-4-6";
export const IMAGE_MODEL = "google/gemini-2.5-flash-image";

export function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY не настроен");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
}
