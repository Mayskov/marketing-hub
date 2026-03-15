"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase-browser";
import ConversationList from "../../components/whatsapp/ConversationList";
import MessageThread from "../../components/whatsapp/MessageThread";

interface Conversation {
  id: string;
  phone_number: string;
  updated_at: string;
  last_message?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/whatsapp-agent/login");
      }
    });
  }, [router]);

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch conversations:", error);
        setLoading(false);
        return;
      }

      // Fetch last message for each conversation
      const withLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...conv,
            last_message: msgs?.[0]?.content,
          };
        })
      );

      setConversations(withLastMessage);
      setLoading(false);
    }

    fetchConversations();
  }, []);

  // Real-time subscription for conversations
  useEffect(() => {
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newConv = payload.new as Conversation;
            setConversations((prev) => [newConv, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Conversation;
            // Fetch last message for the updated conversation
            const { data: msgs } = await supabase
              .from("messages")
              .select("content")
              .eq("conversation_id", updated.id)
              .order("created_at", { ascending: false })
              .limit(1);

            setConversations((prev) => {
              const filtered = prev.filter((c) => c.id !== updated.id);
              return [
                { ...updated, last_message: msgs?.[0]?.content },
                ...filtered,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-zinc-500">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversations sidebar */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-300">
            Диалоги
            {conversations.length > 0 && (
              <span className="ml-2 text-zinc-600">
                ({conversations.length})
              </span>
            )}
          </h2>
        </div>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Message thread */}
      <div className="flex-1 bg-zinc-950">
        <MessageThread conversationId={selectedId} />
      </div>
    </div>
  );
}
