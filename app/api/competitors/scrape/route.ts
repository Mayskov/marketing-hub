import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

export const dynamic = "force-dynamic";

interface ScrapedPost {
  caption: string;
  likesCount: number;
  commentsCount: number;
  type: string;
  timestamp: string;
  hashtags: string[];
  url: string;
  displayUrl: string;
}

export async function POST(request: Request) {
  try {
    const { handle, limit = 20 } = await request.json();

    if (!handle) {
      return NextResponse.json(
        { error: "Укажите Instagram-аккаунт" },
        { status: 400 }
      );
    }

    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN не настроен" },
        { status: 500 }
      );
    }

    const cleanHandle = handle.trim().replace(/^@/, "");
    const resultsLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const client = new ApifyClient({ token });

    const run = await client.actor("apify/instagram-scraper").call(
      {
        usernames: [cleanHandle],
        resultsType: "posts",
        resultsLimit,
        addParentData: false,
      },
      { waitSecs: 120 }
    );

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems();

    const posts: ScrapedPost[] = items.map((item: Record<string, unknown>) => ({
      caption: (item.caption as string) || "",
      likesCount: (item.likesCount as number) || 0,
      commentsCount: (item.commentsCount as number) || 0,
      type: (item.type as string) || "Image",
      timestamp: (item.timestamp as string) || "",
      hashtags: (item.hashtags as string[]) || [],
      url: (item.url as string) || "",
      displayUrl: (item.displayUrl as string) || "",
    }));

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "Посты не найдены. Проверьте имя аккаунта." },
        { status: 404 }
      );
    }

    return NextResponse.json({ posts, handle: cleanHandle });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при парсинге Instagram",
      },
      { status: 500 }
    );
  }
}
