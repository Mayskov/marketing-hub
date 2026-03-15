import { NextResponse } from "next/server";
import { publishToInstagram } from "../../../lib/instagram-publish";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { imageUrl, caption } = await request.json();

    if (!imageUrl || !caption) {
      return NextResponse.json(
        { error: "Укажите изображение и текст поста" },
        { status: 400 }
      );
    }

    const result = await publishToInstagram(imageUrl, caption);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: `Instagram: ошибка на шаге "${result.step}": ${result.error}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mediaId: result.mediaId,
      success: true,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при публикации в Instagram",
      },
      { status: 500 }
    );
  }
}
