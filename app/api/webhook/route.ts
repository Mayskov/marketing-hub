import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { sendWhatsAppMessage } from "../../lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cache the agent prompt in memory
let agentPrompt: string | null = null;
function getAgentPrompt(): string {
  if (!agentPrompt) {
    const promptPath = resolve(process.cwd(), "AGENT_PROMPT.md");
    agentPrompt = readFileSync(promptPath, "utf-8");
  }
  return agentPrompt;
}

// GET — Meta webhook verification
export async function GET(request: NextRequest) {
  console.log("GET /api/webhook — verification request received");

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new Response(challenge, { status: 200 });
  }

  console.error("Webhook verification failed — token mismatch");
  return new Response("Forbidden", { status: 403 });
}

// POST — Incoming WhatsApp messages
export async function POST(request: NextRequest) {
  console.log("POST /api/webhook — incoming message");

  try {
    const body = await request.json();

    // Extract message from Meta's nested payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    // Status updates (delivered, read) have no messages — just acknowledge
    if (!messages || messages.length === 0) {
      console.log("No messages in payload (likely a status update)");
      return new Response("OK", { status: 200 });
    }

    const message = messages[0];
    const from = message.from; // sender phone number
    const text = message.text?.body;

    if (!text) {
      console.log("Non-text message received, ignoring");
      return new Response("OK", { status: 200 });
    }

    console.log(`Message from ${from}: ${text}`);

    // 1. Upsert conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .upsert(
        { phone_number: from, updated_at: new Date().toISOString() },
        { onConflict: "phone_number" }
      )
      .select("id")
      .single();

    if (convError) {
      console.error("Supabase conversation upsert error:", convError);
      return new Response("OK", { status: 200 });
    }

    console.log(`Conversation ID: ${conversation.id}`);

    // 2. Store user message
    const { error: userMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        role: "user",
        content: text,
      });

    if (userMsgError) {
      console.error("Supabase user message insert error:", userMsgError);
    }

    // 3. Load conversation history (last 20 messages)
    const { data: history, error: historyError } = await supabaseAdmin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(20);

    if (historyError) {
      console.error("Supabase history fetch error:", historyError);
    }

    // 4. Call Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const claudeMessages = (history || [{ role: "user", content: text }]).map(
      (msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })
    );

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: getAgentPrompt(),
      messages: claudeMessages,
    });

    const responseText =
      aiResponse.content.find((b) => b.type === "text")?.text ||
      "Sorry, I could not generate a response.";

    console.log(`AI response: ${responseText.substring(0, 100)}...`);

    // 5. Store assistant message
    const { error: aiMsgError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: responseText,
      });

    if (aiMsgError) {
      console.error("Supabase assistant message insert error:", aiMsgError);
    }

    // 6. Update conversation timestamp
    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // 7. Send response via WhatsApp
    await sendWhatsAppMessage(from, responseText);
    console.log(`Reply sent to ${from}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook POST error:", error);
    return new Response("OK", { status: 200 });
  }
}
