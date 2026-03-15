const GRAPH_URL = "https://graph.facebook.com/v21.0";

interface PublishResult {
  ok: boolean;
  mediaId?: string;
  step?: string;
  error?: string;
}

export async function publishToInstagram(
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !igAccountId) {
    return {
      ok: false,
      step: "config",
      error: "META_SYSTEM_USER_TOKEN или INSTAGRAM_BUSINESS_ACCOUNT_ID не настроены",
    };
  }

  try {
    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      access_token: token,
      image_url: imageUrl,
      caption: caption,
    });

    const containerResp = await fetch(
      `${GRAPH_URL}/${igAccountId}/media?${containerParams}`,
      { method: "POST" }
    );
    const containerData = await containerResp.json();

    if (containerData.error) {
      return {
        ok: false,
        step: "container",
        error: JSON.stringify(containerData.error),
      };
    }

    const containerId = containerData.id;
    if (!containerId) {
      return {
        ok: false,
        step: "container",
        error: "No container ID returned",
      };
    }

    // Wait a moment for container processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      access_token: token,
      creation_id: containerId,
    });

    const publishResp = await fetch(
      `${GRAPH_URL}/${igAccountId}/media_publish?${publishParams}`,
      { method: "POST" }
    );
    const publishData = await publishResp.json();

    if (publishData.error) {
      return {
        ok: false,
        step: "publish",
        error: JSON.stringify(publishData.error),
      };
    }

    const mediaId = publishData.id;
    return { ok: true, mediaId: mediaId || "published" };
  } catch (err) {
    return {
      ok: false,
      step: "network",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
