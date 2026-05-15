import type { AiSettings } from "./ai-settings";

export async function askOpenAICompatible(prompt: string, settings: AiSettings): Promise<string> {
  const response = await fetch(`${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI response did not include message content");
  return content;
}
