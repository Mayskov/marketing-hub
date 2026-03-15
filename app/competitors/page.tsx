"use client";

import { useState } from "react";

interface ScrapedPost {
  caption: string;
  likesCount: number;
  commentsCount: number;
  type: string;
  timestamp: string;
  hashtags: string[];
  url: string;
}

interface Outlier {
  caption: string;
  likes: number;
  comments: number;
  reason: string;
}

interface ContentIdea {
  title: string;
  description: string;
  format: string;
}

interface Analysis {
  outliers: Outlier[];
  patterns: string[];
  contentIdeas: ContentIdea[];
  summary: string;
}

export default function CompetitorsPage() {
  const [handle, setHandle] = useState("");
  const [limit, setLimit] = useState(20);
  const [posts, setPosts] = useState<ScrapedPost[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedHandle, setScrapedHandle] = useState("");

  async function handleScrape() {
    if (!handle.trim()) return;
    setError(null);
    setPosts([]);
    setAnalysis(null);
    setIsScraping(true);

    try {
      const res = await fetch("/api/competitors/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), limit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка парсинга");

      setPosts(data.posts);
      setScrapedHandle(data.handle);

      // Auto-start analysis
      analyzePostsData(data.posts, data.handle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при парсинге");
    } finally {
      setIsScraping(false);
    }
  }

  async function analyzePostsData(postsData: ScrapedPost[], h: string) {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/competitors/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: postsData, handle: h }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка анализа");
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при анализе");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function formatDate(ts: string) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return ts;
    }
  }

  function formatNumber(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  const sortedPosts = [...posts].sort(
    (a, b) =>
      b.likesCount + b.commentsCount - (a.likesCount + a.commentsCount)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Анализ конкурентов</h1>
        <p className="text-zinc-400 mt-2">
          Парсинг постов из Instagram с ИИ-анализом — находите аутлайеры и идеи
          для контента
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Input form */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Instagram аккаунт
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="имя_аккаунта"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              />
            </div>
          </div>

          <div className="w-32">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Постов
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={50}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping || !handle.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            {isScraping ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Парсинг...
              </span>
            ) : (
              "🔍 Анализировать"
            )}
          </button>
        </div>

        {isScraping && (
          <p className="text-zinc-500 text-sm mt-3">
            Парсинг может занять 30-60 секунд. Apify собирает данные с
            Instagram...
          </p>
        )}
      </div>

      {/* Results */}
      {posts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Scraped posts */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Посты @{scrapedHandle}{" "}
              <span className="text-zinc-500 font-normal text-base">
                ({posts.length})
              </span>
            </h2>

            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {sortedPosts.map((post, i) => (
                <div
                  key={i}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-500 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                      {post.type}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDate(post.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300 mb-3 line-clamp-3">
                    {post.caption || "Без подписи"}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-red-400">
                      ❤️ {formatNumber(post.likesCount)}
                    </span>
                    <span className="text-blue-400">
                      💬 {formatNumber(post.commentsCount)}
                    </span>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-300 ml-auto text-xs"
                      >
                        Открыть ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Analysis */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              ИИ-анализ
            </h2>

            {isAnalyzing && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">Анализ постов...</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-400 mb-2">
                    📊 Резюме
                  </h3>
                  <p className="text-sm text-zinc-300">{analysis.summary}</p>
                </div>

                {/* Outliers */}
                {analysis.outliers?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-yellow-400 mb-3">
                      ⭐ Аутлайеры — лучшие посты
                    </h3>
                    <div className="space-y-2">
                      {analysis.outliers.map((o, i) => (
                        <div
                          key={i}
                          className="bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-3"
                        >
                          <p className="text-sm text-zinc-300 line-clamp-2 mb-1">
                            {o.caption}
                          </p>
                          <p className="text-xs text-zinc-500 mb-1">
                            ❤️ {formatNumber(o.likes)} · 💬{" "}
                            {formatNumber(o.comments)}
                          </p>
                          <p className="text-xs text-yellow-400/80">
                            → {o.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patterns */}
                {analysis.patterns?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-green-400 mb-3">
                      🔄 Паттерны контента
                    </h3>
                    <ul className="space-y-1.5">
                      {analysis.patterns.map((p, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-green-500 shrink-0">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Content Ideas */}
                {analysis.contentIdeas?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-purple-400 mb-3">
                      💡 Идеи для контента
                    </h3>
                    <div className="space-y-2">
                      {analysis.contentIdeas.map((idea, i) => (
                        <div
                          key={i}
                          className="bg-zinc-800 border border-zinc-700 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {idea.title}
                            </span>
                            <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">
                              {idea.format}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            {idea.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isScraping && posts.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">Введите Instagram-аккаунт для анализа</p>
          <p className="text-sm mt-1">
            Мы соберём посты и проанализируем что работает лучше всего
          </p>
        </div>
      )}
    </div>
  );
}
