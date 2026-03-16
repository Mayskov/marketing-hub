import { NextResponse } from "next/server";
import { uploadToImgbb } from "../../../lib/imgbb";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не предоставлен" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Максимальный размер файла — 10 МБ" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = file.name.replace(/\.[^.]+$/, "") || "upload";
    const imageUrl = await uploadToImgbb(buffer, filename);

    return NextResponse.json({ imageUrl, preview: imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ошибка загрузки файла",
      },
      { status: 500 }
    );
  }
}
