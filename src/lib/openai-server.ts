import OpenAI from "openai";

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) return null;
  return new OpenAI({ apiKey: key });
}

export function requireOpenAI(): OpenAI {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return client;
}
