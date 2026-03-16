import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APIFY_BASE = "https://api.apify.com/v2";

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

    // Start the actor run via REST API
    const runRes = await fetch(
      `${APIFY_BASE}/acts/apify~instagram-scraper/runs?waitForFinish=120`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${cleanHandle}/`],
          resultsType: "posts",
          resultsLimit,
          searchType: "hashtag",
          searchLimit: 1,
          addParentData: false,
        }),
      }
    );

    if (!runRes.ok) {
      const errBody = await runRes.text();
      throw new Error(`Apify run failed (${runRes.status}): ${errBody}`);
    }

    const runData = await runRes.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      throw new Error("No dataset ID returned from Apify run");
    }

    // Fetch dataset items
    const datasetRes = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?format=json`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!datasetRes.ok) {
      throw new Error(`Failed to fetch dataset (${datasetRes.status})`);
    }

    const items: Record<string, unknown>[] = await datasetRes.json();

    const posts: ScrapedPost[] = items.map((item) => ({
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
