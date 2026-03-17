import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY не настроен" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Generate image via Gemini Flash Image
    const imagePrompt = `Create a visually stunning Instagram post image. ${prompt}.
Make it modern, clean, professional, and eye-catching. Suitable for Instagram feed.
Square format (1:1 aspect ratio). No text on the image unless specifically requested.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: imagePrompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image data from response
    let b64Data: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts;

    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          b64Data = part.inlineData.data;
          break;
        }
      }
    }

    if (!b64Data) {
      throw new Error("AI не вернул изображение. Попробуйте другой запрос.");
    }

    // Convert PNG → JPEG (CRITICAL: Instagram rejects PNG)
    const pngBuffer = Buffer.from(b64Data, "base64");
    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload JPEG to imgbb
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
