import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function GET() {
  try {
    const token = process.env.META_SYSTEM_USER_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!token || !igAccountId) {
      return NextResponse.json(
        { error: "Instagram credentials not configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      access_token: token,
      fields: "id,caption,timestamp,like_count,comments_count,media_url,media_type",
      limit: "50",
    });

    const res = await fetch(`${GRAPH_URL}/${igAccountId}/media?${params}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || "Instagram API error");
    }

    const posts = (data.data || []).map(
      (p: {
        id: string;
        caption?: string;
        timestamp: string;
        like_count?: number;
        comments_count?: number;
        media_url?: string;
        media_type?: string;
      }) => ({
        id: p.id,
        caption: p.caption || "",
        timestamp: p.timestamp,
        likeCount: p.like_count || 0,
        commentsCount: p.comments_count || 0,
        mediaUrl: p.media_url || "",
        mediaType: p.media_type || "IMAGE",
      })
    );

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Instagram insights error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ошибка загрузки Instagram",
      },
      { status: 500 }
    );
  }
}
