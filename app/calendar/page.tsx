"use client";

import { useState, useEffect, useCallback } from "react";

interface Post {
  id: string;
  topic: string;
  caption: string;
  hashtags: string;
  image_url: string;
  image_preview: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  instagram_media_id: string | null;
  error_message: string | null;
  created_at: string;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500",
  scheduled: "bg-blue-500",
  publishing: "bg-yellow-500",
  published: "bg-green-500",
  failed: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  scheduled: "Запланирован",
  publishing: "Публикуется",
  published: "Опубликован",
  failed: "Ошибка",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?month=${monthStr}`);
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Also fetch posts without month filter (for published posts that don't have scheduled_at)
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch("/api/posts");
        const data = await res.json();
        if (res.ok) {
          setPosts(data.posts || []);
        }
      } catch {
        // ignore
      }
    }
    fetchAll();
  }, [monthStr]);

  // Calendar grid calculation
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function getPostsForDay(day: number): Post[] {
    return posts.filter((p) => {
      const d = p.scheduled_at || p.published_at || p.created_at;
      if (!d) return false;
      const pd = new Date(d);
      return pd.getFullYear() === year && pd.getMonth() === month && pd.getDate() === day;
    });
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedPost(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedPost(null);
  }

  async function handleDelete(postId: string) {
    if (!confirm("Удалить этот пост?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setSelectedPost(null);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePublishNow(post: Post) {
    setActionLoading(true);
    try {
      // Update scheduled_at to now to trigger immediate publish logic
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date().toISOString() }),
      });
      if (res.ok) {
        fetchPosts();
        setSelectedPost(null);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }

  const monthName = new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" }).format(
    currentDate
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Календарь постов</h1>
        <p className="text-zinc-400 mt-2">
          Все запланированные и опубликованные посты Instagram
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          ← Пред.
        </button>
        <h2 className="text-xl font-semibold text-white capitalize">{monthName}</h2>
        <button
          onClick={nextMonth}
          className="text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          След. →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-zinc-700 rounded-xl overflow-hidden">
        {/* Weekday headers */}
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-zinc-800 px-2 py-2 text-center text-xs font-medium text-zinc-400"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, idx) => {
          const dayPosts = day ? getPostsForDay(day) : [];
          const isToday =
            day &&
            year === new Date().getFullYear() &&
            month === new Date().getMonth() &&
            day === new Date().getDate();

          return (
            <div
              key={idx}
              className={`bg-zinc-900 min-h-[100px] p-1.5 ${
                day ? "cursor-default" : "opacity-30"
              }`}
            >
              {day && (
                <>
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isToday
                        ? "text-blue-400 bg-blue-600/20 w-6 h-6 rounded-full flex items-center justify-center"
                        : "text-zinc-500"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="w-full flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-zinc-800 transition-colors text-left"
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[post.status]}`}
                        />
                        <span className="text-[10px] text-zinc-300 truncate">
                          {post.caption?.slice(0, 25)}...
                        </span>
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-[10px] text-zinc-500 pl-1">
                        +{dayPosts.length - 3} ещё
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${STATUS_COLORS[selectedPost.status]}`}
                  />
                  <span className="text-sm font-medium text-zinc-300">
                    {STATUS_LABELS[selectedPost.status]}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-zinc-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              {/* Image */}
              {selectedPost.image_preview && (
                <img
                  src={selectedPost.image_preview}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg mb-4"
                />
              )}

              {/* Caption */}
              <p className="text-sm text-zinc-300 whitespace-pre-wrap mb-2">
                {selectedPost.caption}
              </p>
              {selectedPost.hashtags && (
                <p className="text-xs text-blue-400 mb-4">{selectedPost.hashtags}</p>
              )}

              {/* Schedule info */}
              {selectedPost.scheduled_at && (
                <p className="text-xs text-zinc-500 mb-1">
                  📅 Запланирован:{" "}
                  {new Date(selectedPost.scheduled_at).toLocaleString("ru")}
                </p>
              )}
              {selectedPost.published_at && (
                <p className="text-xs text-zinc-500 mb-1">
                  ✅ Опубликован:{" "}
                  {new Date(selectedPost.published_at).toLocaleString("ru")}
                </p>
              )}
              {selectedPost.error_message && (
                <p className="text-xs text-red-400 mb-1">
                  ❌ Ошибка: {selectedPost.error_message}
                </p>
              )}

              {/* Actions */}
              {["scheduled", "draft"].includes(selectedPost.status) && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-700">
                  <button
                    onClick={() => handlePublishNow(selectedPost)}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    📸 Опубликовать сейчас
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPost.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
