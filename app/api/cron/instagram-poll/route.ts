import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import {
  getRecentMedia,
  getComments,
  replyToComment,
  getConversations,
  sendInstagramDM,
} from "@/app/lib/instagram-api";
import { IG_COMMENT_PROMPT, IG_DM_PROMPT } from "@/app/lib/instagram-prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: (process.env.ANTHROPIC_API_KEY || "").trim(),
});

function getConfig() {
  const token = (process.env.META_SYSTEM_USER_TOKEN || "").trim();
  const igId = (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "").trim();
  return { token, igId };
}

// Check if an item was already processed
async function isProcessed(igItemId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("ig_processed_items")
    .select("id")
    .eq("ig_item_id", igItemId)
    .limit(1);
  return (data?.length || 0) > 0;
}

// Track a processed item
async function trackItem(params: {
  itemType: "comment" | "dm";
  igItemId: string;
  igMediaId?: string;
  igUserId?: string;
  replyText?: string;
  status: "processed" | "skipped" | "failed";
}) {
  await supabaseAdmin.from("ig_processed_items").insert({
    item_type: params.itemType,
    ig_item_id: params.igItemId,
    ig_media_id: params.igMediaId || null,
    ig_user_id: params.igUserId || null,
    reply_text: params.replyText || null,
    status: params.status,
  });
}

// Generate AI reply for a comment
async function generateCommentReply(
  postCaption: string,
  commentText: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: IG_COMMENT_PROMPT,
    messages: [
      {
        role: "user",
        content: `Текст поста: ${postCaption || "(без подписи)"}\n\nКомментарий: ${commentText}`,
      },
    ],
  });
  return (
    response.content.find((b) => b.type === "text")?.text || "SKIP"
  ).trim();
}

// Generate AI reply for a DM (with conversation history)
async function generateDmReply(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  // Merge consecutive same-role messages (lesson learned)
  const merged: { role: "user" | "assistant"; content: string }[] = [];
  for (const msg of history) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].content += `\n${msg.content}`;
    } else {
      merged.push({ ...msg });
    }
  }

  // Ensure first message is from user (Claude API requirement)
  while (merged.length > 0 && merged[0].role === "assistant") {
    merged.shift();
  }

  if (merged.length === 0) return "SKIP";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: IG_DM_PROMPT,
    messages: merged,
  });
  return (
    response.content.find((b) => b.type === "text")?.text || "SKIP"
  ).trim();
}

// ─── POLL COMMENTS ──────────────────────────────────────────
async function pollComments(igId: string, token: string) {
  const results = { processed: 0, skipped: 0, failed: 0 };
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const media = await getRecentMedia(igId, token);
  console.log(`[IG Poll] Found ${media.length} recent posts`);

  let totalProcessed = 0;

  for (const post of media) {
    if (totalProcessed >= 10) break; // cap per cycle

    const comments = await getComments(post.id, token);

    for (const comment of comments) {
      if (totalProcessed >= 10) break;

      // Skip old comments
      if (comment.timestamp < thirtyMinAgo) continue;

      // Skip own comments
      if (comment.from.id === igId) continue;

      // Skip already processed
      if (await isProcessed(comment.id)) continue;

      try {
        const reply = await generateCommentReply(
          post.caption || "",
          comment.text
        );

        if (reply === "SKIP") {
          await trackItem({
            itemType: "comment",
            igItemId: comment.id,
            igMediaId: post.id,
            igUserId: comment.from.id,
            status: "skipped",
          });
          results.skipped++;
        } else {
          const sendResult = await replyToComment(comment.id, reply, token);
          await trackItem({
            itemType: "comment",
            igItemId: comment.id,
            igMediaId: post.id,
            igUserId: comment.from.id,
            replyText: reply,
            status: sendResult.ok ? "processed" : "failed",
          });
          if (sendResult.ok) {
            console.log(
              `[IG Poll] Replied to comment by @${comment.from.username}: "${reply.substring(0, 50)}..."`
            );
            results.processed++;
          } else {
            results.failed++;
          }
        }
        totalProcessed++;
      } catch (err) {
        console.error(
          `[IG Poll] Comment error (${comment.id}):`,
          String(err)
        );
        await trackItem({
          itemType: "comment",
          igItemId: comment.id,
          igMediaId: post.id,
          igUserId: comment.from.id,
          status: "failed",
        });
        results.failed++;
        totalProcessed++;
      }
    }
  }

  return results;
}

// ─── POLL DMs ───────────────────────────────────────────────
async function pollDMs(igId: string, token: string) {
  const results = { processed: 0, skipped: 0, failed: 0 };

  const conversations = await getConversations(igId, token);
  console.log(`[IG Poll] Found ${conversations.length} DM conversations`);

  let convsProcessed = 0;

  for (const conv of conversations) {
    if (convsProcessed >= 5) break; // cap per cycle

    const messages = conv.messages?.data || [];
    if (messages.length === 0) continue;

    // Find the other participant (not us)
    const otherUser = conv.participants?.data?.find((p) => p.id !== igId);
    if (!otherUser) continue;

    // Check newest message — if it's from us, no need to reply
    const newest = messages[0]; // messages are newest-first
    if (newest.from.id === igId) continue;

    // Skip if already processed
    if (await isProcessed(newest.id)) continue;

    try {
      // Upsert conversation in Supabase
      const { data: dbConv, error: convError } = await supabaseAdmin
        .from("conversations")
        .upsert(
          {
            ig_user_id: otherUser.id,
            platform: "instagram",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ig_user_id" }
        )
        .select("id")
        .single();

      if (convError) {
        console.error("[IG Poll] Conversation upsert error:", String(convError));
        continue;
      }

      // Store the new user message
      await supabaseAdmin.from("messages").insert({
        conversation_id: dbConv.id,
        role: "user",
        content: newest.message,
      });

      // Load conversation history (last 20)
      const { data: history } = await supabaseAdmin
        .from("messages")
        .select("role, content")
        .eq("conversation_id", dbConv.id)
        .order("created_at", { ascending: true })
        .limit(20);

      const claudeMessages = (
        history || [{ role: "user", content: newest.message }]
      ).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const reply = await generateDmReply(claudeMessages);

      if (reply === "SKIP") {
        await trackItem({
          itemType: "dm",
          igItemId: newest.id,
          igUserId: otherUser.id,
          status: "skipped",
        });
        results.skipped++;
      } else {
        const sendResult = await sendInstagramDM(
          otherUser.id,
          reply,
          igId,
          token
        );

        // Store assistant reply in DB
        if (sendResult.ok) {
          await supabaseAdmin.from("messages").insert({
            conversation_id: dbConv.id,
            role: "assistant",
            content: reply,
          });
        }

        await trackItem({
          itemType: "dm",
          igItemId: newest.id,
          igUserId: otherUser.id,
          replyText: reply,
          status: sendResult.ok ? "processed" : "failed",
        });

        if (sendResult.ok) {
          console.log(
            `[IG Poll] DM reply to ${otherUser.id}: "${reply.substring(0, 50)}..."`
          );
          results.processed++;
        } else {
          results.failed++;
        }
      }

      convsProcessed++;
    } catch (err) {
      console.error(`[IG Poll] DM error (${newest.id}):`, String(err));
      await trackItem({
        itemType: "dm",
        igItemId: newest.id,
        igUserId: otherUser.id,
        status: "failed",
      });
      results.failed++;
      convsProcessed++;
    }
  }

  return results;
}

// ─── HANDLER ────────────────────────────────────────────────
async function handler(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const secret = (process.env.CRON_SECRET || "").trim();

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, igId } = getConfig();
  if (!token || !igId) {
    return NextResponse.json(
      { error: "Missing META_SYSTEM_USER_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID" },
      { status: 500 }
    );
  }

  try {
    console.log("[IG Poll] Starting poll cycle...");

    const commentResults = await pollComments(igId, token);
    const dmResults = await pollDMs(igId, token);

    const summary = {
      comments: commentResults,
      dms: dmResults,
      timestamp: new Date().toISOString(),
    };

    console.log("[IG Poll] Cycle complete:", JSON.stringify(summary));
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[IG Poll] Fatal error:", String(error));
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// Vercel cron sends GET requests
export const GET = handler;
export const POST = handler;
