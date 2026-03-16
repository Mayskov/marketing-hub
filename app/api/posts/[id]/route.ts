import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow editing scheduled/draft posts
    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("status")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
    }

    if (!["scheduled", "draft"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Можно редактировать только запланированные или черновые посты" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.caption !== undefined) updates.caption = body.caption;
    if (body.hashtags !== undefined) updates.hashtags = body.hashtags;
    if (body.scheduledAt !== undefined) updates.scheduled_at = body.scheduledAt;
    if (body.imageUrl !== undefined) updates.image_url = body.imageUrl;
    if (body.imagePreview !== undefined) updates.image_preview = body.imagePreview;

    const { data, error } = await supabaseAdmin
      .from("posts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error("PATCH /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка обновления" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("status")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
    }

    if (!["scheduled", "draft"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Можно удалить только запланированные или черновые посты" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка удаления" },
      { status: 500 }
    );
  }
}
