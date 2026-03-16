import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      product,
      targetAudience,
      goal,
      tone,
      variantCount = 2,
    } = body;

    if (!product || !targetAudience) {
      return NextResponse.json(
        { error: "product и targetAudience обязательны" },
        { status: 400 }
      );
    }

    const prompt = `Ты — опытный маркетолог. Создай ${variantCount} варианта рекламы для A/B теста в Facebook/Instagram.

Продукт/Услуга: ${product}
Целевая аудитория: ${targetAudience}
Цель рекламы: ${goal || "Лиды"}
Тон коммуникации: ${tone || "Профессиональный"}

Для каждого варианта создай:
- primaryText: основной текст рекламы (2-3 предложения, привлекающие внимание)
- headline: заголовок (короткий, до 40 символов)
- callToAction: один из: LEARN_MORE, SIGN_UP, SUBSCRIBE, CONTACT_US, GET_QUOTE, APPLY_NOW, BOOK_NOW, DOWNLOAD, SHOP_NOW

Также предложи:
- campaignName: название кампании
- adSetName: название группы объявлений
- interests: массив из 3-5 интересов для таргетинга (на английском)

Каждый вариант должен иметь РАЗНЫЙ подход: другой угол, другой акцент, другой стиль призыва.

Ответь ТОЛЬКО валидным JSON:
{
  "campaignName": "...",
  "adSetName": "...",
  "interests": ["..."],
  "variants": [
    {
      "variantLabel": "A",
      "primaryText": "...",
      "headline": "...",
      "callToAction": "LEARN_MORE"
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Не удалось получить JSON из ответа ИИ");
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AB test generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка генерации вариантов",
      },
      { status: 500 }
    );
  }
}
