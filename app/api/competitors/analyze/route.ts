import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { posts, handle } = await request.json();

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "Нет постов для анализа" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY не настроен" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Calculate average engagement for context
    const avgLikes =
      posts.reduce(
        (sum: number, p: { likesCount: number }) => sum + p.likesCount,
        0
      ) / posts.length;
    const avgComments =
      posts.reduce(
        (sum: number, p: { commentsCount: number }) => sum + p.commentsCount,
        0
      ) / posts.length;

    const prompt = `Ты — эксперт по аналитике социальных сетей. Проанализируй посты Instagram-аккаунта @${handle}.

Данные постов (JSON):
${JSON.stringify(
  posts.map(
    (p: {
      caption: string;
      likesCount: number;
      commentsCount: number;
      type: string;
      timestamp: string;
      hashtags: string[];
    }) => ({
      caption: p.caption?.slice(0, 300),
      likes: p.likesCount,
      comments: p.commentsCount,
      type: p.type,
      date: p.timestamp,
      hashtags: p.hashtags?.slice(0, 10),
    })
  ),
  null,
  2
)}

Средний показатель: ${Math.round(avgLikes)} лайков, ${Math.round(avgComments)} комментариев на пост.

Верни JSON (без markdown-обёртки) со структурой:
{
  "outliers": [
    {
      "caption": "начало текста поста...",
      "likes": число,
      "comments": число,
      "reason": "Почему этот пост выделяется"
    }
  ],
  "patterns": [
    "Паттерн 1: описание",
    "Паттерн 2: описание"
  ],
  "contentIdeas": [
    {
      "title": "Название идеи",
      "description": "Подробное описание идеи для контента",
      "format": "Reels/Карусель/Фото/Видео"
    }
  ],
  "summary": "Краткий вывод об аккаунте в 2-3 предложениях"
}

Выдели 3-5 аутлайеров (посты с вовлечённостью значительно выше среднего).
Найди 4-6 паттернов контента.
Предложи 5-7 идей для контента, вдохновлённых тем что работает.
Пиши на русском языке.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    let raw =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Strip markdown fences
    for (const fence of ["```json", "```"]) {
      if (raw.startsWith(fence)) {
        raw = raw.slice(fence.length);
      }
    }
    if (raw.endsWith("```")) {
      raw = raw.slice(0, -3);
    }

    const analysis = JSON.parse(raw.trim());

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при анализе постов",
      },
      { status: 500 }
    );
  }
}
