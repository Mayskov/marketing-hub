import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { topic, angle, format } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Укажите тему поста" },
        { status: 400 }
      );
    }

    const client = new Anthropic();

    const prompt = `Ты — эксперт по созданию контента для Instagram. Напиши пост на русском языке.

Тема: ${topic}
Угол подачи: ${angle || topic}
Формат: ${format || "фото-пост"}

Требования:
- Начни с цепляющего хука (первые 1-2 строки — самые важные)
- Основной текст: полезный, конкретный, с примерами
- Завершающий CTA (призыв к действию)
- 5-10 релевантных хештегов
- Длина текста: 150-300 слов
- Стиль: экспертный, но дружелюбный
- Используй эмодзи умеренно

Верни JSON (без markdown-обёртки):
{
  "caption": "Полный текст поста включая эмодзи и форматирование",
  "hashtags": "#хештег1 #хештег2 #хештег3"
}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    let raw =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown fences
    for (const fence of ["```json", "```"]) {
      if (raw.startsWith(fence)) {
        raw = raw.slice(fence.length);
      }
    }
    if (raw.endsWith("```")) {
      raw = raw.slice(0, -3);
    }

    const result = JSON.parse(raw.trim());

    if (!result.caption) {
      throw new Error("AI не вернул текст поста");
    }

    return NextResponse.json({
      caption: result.caption,
      hashtags: result.hashtags || "",
    });
  } catch (error) {
    console.error("Generate text error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при генерации текста",
      },
      { status: 500 }
    );
  }
}
