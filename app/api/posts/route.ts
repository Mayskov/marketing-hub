import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { publishToInstagram } from "@/app/lib/instagram-publish";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const month = searchParams.get("month"); // YYYY-MM

    let query = supabaseAdmin
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1).toISOString();
      const end = new Date(year, mon, 0, 23, 59, 59).toISOString();
      query = query.gte("scheduled_at", start).lte("scheduled_at", end);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return NextResponse.json({ posts: data });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки постов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      topic,
      angle,
      format,
      caption,
      hashtags,
      imageUrl,
      imagePreview,
      scheduledAt,
    } = body;

    if (!caption || !imageUrl) {
      return NextResponse.json(
        { error: "caption и imageUrl обязательны" },
        { status: 400 }
      );
    }

    const fullCaption = hashtags ? `${caption}\n\n${hashtags}` : caption;

    // Immediate publish
    if (!scheduledAt) {
      const result = await publishToInstagram(imageUrl, fullCaption);

      const { data, error } = await supabaseAdmin
        .from("posts")
        .insert({
          topic,
          angle,
          format,
          caption,
          hashtags,
          image_url: imageUrl,
          image_preview: imagePreview,
          status: result.ok ? "published" : "failed",
          published_at: result.ok ? new Date().toISOString() : null,
          instagram_media_id: result.mediaId || null,
          error_message: result.ok ? null : result.error,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        post: data,
        published: result.ok,
        mediaId: result.mediaId,
        error: result.ok ? undefined : result.error,
      });
    }

    // Scheduled publish
    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        topic,
        angle,
        format,
        caption,
        hashtags,
        image_url: imageUrl,
        image_preview: imagePreview,
        status: "scheduled",
        scheduled_at: scheduledAt,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data, scheduled: true });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка создания поста" },
      { status: 500 }
    );
  }
}
