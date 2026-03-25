const GRAPH_URL = "https://graph.facebook.com/v21.0";

interface IGMedia {
  id: string;
  caption?: string;
  timestamp: string;
}

interface IGComment {
  id: string;
  text: string;
  from: { id: string; username: string };
  timestamp: string;
}

interface IGMessage {
  id: string;
  message: string;
  from: { id: string; username?: string };
  created_time: string;
}

interface IGConversation {
  id: string;
  participants: { data: { id: string; username?: string }[] };
  messages: { data: IGMessage[] };
}

export type { IGMedia, IGComment, IGMessage, IGConversation };

export async function getRecentMedia(
  igId: string,
  token: string
): Promise<IGMedia[]> {
  const params = new URLSearchParams({
    fields: "id,caption,timestamp",
    limit: "10",
    access_token: token.trim(),
  });
  const res = await fetch(`${GRAPH_URL}/${igId}/media?${params}`);
  const data = await res.json();
  if (data.error) {
    console.error("[IG API] getRecentMedia error:", JSON.stringify(data.error));
    return [];
  }
  return data.data || [];
}

export async function getComments(
  mediaId: string,
  token: string
): Promise<IGComment[]> {
  const params = new URLSearchParams({
    fields: "id,text,from,timestamp",
    limit: "50",
    access_token: token.trim(),
  });
  const res = await fetch(`${GRAPH_URL}/${mediaId}/comments?${params}`);
  const data = await res.json();
  if (data.error) {
    console.error("[IG API] getComments error:", JSON.stringify(data.error));
    return [];
  }
  return data.data || [];
}

export async function replyToComment(
  commentId: string,
  message: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const params = new URLSearchParams({
    message,
    access_token: token.trim(),
  });
  const res = await fetch(`${GRAPH_URL}/${commentId}/replies?${params}`, {
    method: "POST",
  });
  const data = await res.json();
  if (data.error) {
    console.error("[IG API] replyToComment error:", JSON.stringify(data.error));
    return { ok: false, error: JSON.stringify(data.error) };
  }
  return { ok: true };
}

export async function getConversations(
  igId: string,
  token: string
): Promise<IGConversation[]> {
  const params = new URLSearchParams({
    platform: "instagram",
    fields: "participants,messages{id,message,from,created_time}",
    limit: "20",
    access_token: token.trim(),
  });
  const res = await fetch(`${GRAPH_URL}/${igId}/conversations?${params}`);
  const data = await res.json();
  if (data.error) {
    console.error(
      "[IG API] getConversations error:",
      JSON.stringify(data.error)
    );
    return [];
  }
  return data.data || [];
}

export async function sendInstagramDM(
  recipientId: string,
  message: string,
  igId: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${GRAPH_URL}/${igId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
    }),
  });
  const data = await res.json();
  if (data.error) {
    console.error("[IG API] sendInstagramDM error:", JSON.stringify(data.error));
    return { ok: false, error: JSON.stringify(data.error) };
  }
  return { ok: true };
}
