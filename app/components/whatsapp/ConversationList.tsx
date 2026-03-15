"use client";

interface Conversation {
  id: string;
  phone_number: string;
  updated_at: string;
  last_message?: string;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 px-4 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">Пока нет диалогов</p>
        <p className="text-xs mt-1">
          Сообщения появятся когда клиент напишет в WhatsApp
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`text-left px-4 py-3 border-b border-zinc-800 transition-colors ${
            selectedId === conv.id
              ? "bg-blue-600/15 border-l-2 border-l-blue-500"
              : "hover:bg-zinc-800/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">
              +{conv.phone_number}
            </span>
            <span className="text-zinc-600 text-xs">
              {new Date(conv.updated_at).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          {conv.last_message && (
            <p className="text-zinc-500 text-xs mt-1 truncate">
              {conv.last_message}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
