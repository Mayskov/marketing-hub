import { NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToImgbb } from "../../../lib/imgbb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Укажите описание изображения" },
        { status: 400 }
      );
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY не настроен" },
        { status: 500 }
      );
    }

    // Step 1: Generate image via OpenRouter Gemini Flash Image
    const imagePrompt = `Create a visually stunning Instagram post image. ${prompt}.
Make it modern, clean, professional, and eye-catching. Suitable for Instagram feed.
Square format (1:1 aspect ratio). No text on the image unless specifically requested.`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"], // REQUIRED — without this no image returns
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenRouter image gen failed (${resp.status}): ${errText}`);
    }

    const data = await resp.json();
    const parts = data.choices?.[0]?.message?.content;

    // Find the image part in the response
    let b64Data: string | null = null;

    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part.type === "image_url" && part.image_url?.url) {
          // Format: "data:image/png;base64,..."
          const url = part.image_url.url;
          b64Data = url.includes(",") ? url.split(",")[1] : url;
          break;
        }
      }
    }

    // Also check the images array format
    if (!b64Data) {
      const images = data.choices?.[0]?.message?.images;
      if (images && images.length > 0) {
        const url = images[0].image_url?.url || images[0].url || "";
        b64Data = url.includes(",") ? url.split(",")[1] : url;
      }
    }

    if (!b64Data) {
      throw new Error("AI не вернул изображение. Попробуйте другой запрос.");
    }

    // Step 2: Convert PNG → JPEG (CRITICAL: Instagram rejects PNG)
    const pngBuffer = Buffer.from(b64Data, "base64");
    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Step 3: Upload JPEG to imgbb
    const filename = `ig_post_${Date.now()}`;
    const imageUrl = await uploadToImgbb(jpegBuffer, filename);

    // Also create a base64 preview for the client
    const previewBase64 = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;

    return NextResponse.json({
      imageUrl,
      preview: previewBase64,
    });
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при генерации изображения",
      },
      { status: 500 }
    );
  }
}
