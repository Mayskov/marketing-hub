import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { publishToInstagram } from "@/app/lib/instagram-publish";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find posts due for publishing
    const { data: duePosts, error: fetchError } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ processed: 0, message: "Нет постов для публикации" });
    }

    const results = [];

    for (const post of duePosts) {
      // Mark as publishing
      await supabaseAdmin
        .from("posts")
        .update({ status: "publishing", updated_at: new Date().toISOString() })
        .eq("id", post.id);

      const fullCaption = post.hashtags
        ? `${post.caption}\n\n${post.hashtags}`
        : post.caption;

      const result = await publishToInstagram(post.image_url, fullCaption);

      if (result.ok) {
        await supabaseAdmin
          .from("posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            instagram_media_id: result.mediaId,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: "published" });
      } else {
        await supabaseAdmin
          .from("posts")
          .update({
            status: "failed",
            error_message: result.error || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: "failed", error: result.error });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка cron" },
      { status: 500 }
    );
  }
}
