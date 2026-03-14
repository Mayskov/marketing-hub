"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ContentPost {
  day: number;
  platform: string;
  contentType: string;
  topic: string;
  caption: string;
  hashtags: string;
  cta: string;
  goal: string;
  expectedMetrics: string;
}

const platformOptions = ["Facebook", "Instagram", "LinkedIn", "TikTok"];
const voiceOptions = [
  { value: "Professional", label: "Профессиональный" },
  { value: "Casual", label: "Неформальный" },
  { value: "Bold", label: "Смелый" },
  { value: "Friendly", label: "Дружелюбный" },
];

export default function ContentPlanPage() {
  const [form, setForm] = useState({
    description: "",
    audience: "",
    platforms: ["Facebook", "Instagram"] as string[],
    weeks: 4,
    voice: "Professional",
  });
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("All");

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.platforms.length === 0) {
      setError("Выберите хотя бы одну платформу");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPosts([]);

    try {
      const res = await fetch("/api/generate-content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка генерации");
      setPosts(json.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setIsLoading(false);
    }
  };

  const exportExcel = () => {
    const data = posts.map((p) => ({
      "День": p.day,
      "Платформа": p.platform,
      "Тип контента": p.contentType,
      "Тема": p.topic,
      "Подпись": p.caption,
      "CTA": p.cta || "",
      "Цель": p.goal || "",
      "Ожидаемые метрики": p.expectedMetrics || "",
      "Хэштеги": p.hashtags,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-size columns
    ws["!cols"] = [
      { wch: 6 },  // День
      { wch: 12 }, // Платформа
      { wch: 15 }, // Тип контента
      { wch: 30 }, // Тема
      { wch: 60 }, // Подпись
      { wch: 25 }, // CTA
      { wch: 18 }, // Цель
      { wch: 30 }, // Ожидаемые метрики
      { wch: 30 }, // Хэштеги
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Контент-план");
    XLSX.writeFile(wb, "контент-план.xlsx");
  };

  const filteredPosts =
    filterPlatform === "All"
      ? posts
      : posts.filter((p) => p.platform === filterPlatform);

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-white mb-2">
        Генератор контент-плана
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Создайте контент-календарь для соцсетей с помощью ИИ
      </p>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            &times;
          </button>
        </div>
      )}

      {posts.length === 0 ? (
        <form onSubmit={handleGenerate} className="space-y-5 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Описание бизнеса
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder='Например: "Мы управляем студией сайклинга в Астане, предлагаем занятия на велотренажёрах"'
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Целевая аудитория
            </label>
            <input
              type="text"
              value={form.audience}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, audience: e.target.value }))
              }
              placeholder='Например: "Люди 25-45 лет, следящие за здоровьем, в Астане"'
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Платформы
            </label>
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.platforms.includes(p)
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Количество недель
              </label>
              <select
                value={form.weeks}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    weeks: Number(e.target.value),
                  }))
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4].map((w) => (
                  <option key={w} value={w}>
                    {w} недел{w === 1 ? "я" : w < 5 ? "и" : "ь"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Тон общения
              </label>
              <select
                value={form.voice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, voice: e.target.value }))
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                {voiceOptions.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {isLoading ? "Генерация контент-плана..." : "Сгенерировать контент-план"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterPlatform("All")}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  filterPlatform === "All"
                    ? "bg-blue-600/20 border-blue-500 text-blue-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                }`}
              >
                Все
              </button>
              {form.platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    filterPlatform === p
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                className="px-4 py-1.5 bg-green-600/20 border border-green-600 text-green-400 text-xs rounded-lg hover:bg-green-600/30 transition-colors"
              >
                Экспорт в Excel
              </button>
              <button
                onClick={() => setPosts([])}
                className="px-4 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-lg hover:border-zinc-500 transition-colors"
              >
                Начать заново
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    День
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Платформа
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Тип
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Тема
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Подпись
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    CTA
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Цель
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Ожидаемые метрики
                  </th>
                  <th className="text-left py-3 px-2 text-zinc-400 font-medium text-xs">
                    Хэштеги
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50"
                  >
                    <td className="py-3 px-2 text-zinc-300 text-xs">{post.day}</td>
                    <td className="py-3 px-2">
                      <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded">
                        {post.platform}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-zinc-300 text-xs">
                      {post.contentType}
                    </td>
                    <td className="py-3 px-2 text-zinc-200 font-medium text-xs max-w-[140px]">
                      {post.topic}
                    </td>
                    <td className="py-3 px-2 text-zinc-300 text-xs max-w-[180px] truncate">
                      {post.caption}
                    </td>
                    <td className="py-3 px-2 text-amber-400 text-xs max-w-[120px]">
                      {post.cta}
                    </td>
                    <td className="py-3 px-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        post.goal?.toLowerCase().includes("awareness") || post.goal?.toLowerCase().includes("узнаваемость") ? "bg-purple-900/40 text-purple-300" :
                        post.goal?.toLowerCase().includes("engagement") || post.goal?.toLowerCase().includes("вовлечённость") || post.goal?.toLowerCase().includes("вовлечен") ? "bg-blue-900/40 text-blue-300" :
                        post.goal?.toLowerCase().includes("lead") || post.goal?.toLowerCase().includes("лид") ? "bg-green-900/40 text-green-300" :
                        post.goal?.toLowerCase().includes("sales") || post.goal?.toLowerCase().includes("продаж") || post.goal?.toLowerCase().includes("конверси") ? "bg-orange-900/40 text-orange-300" :
                        post.goal?.toLowerCase().includes("retention") || post.goal?.toLowerCase().includes("удержан") ? "bg-cyan-900/40 text-cyan-300" :
                        "bg-zinc-700 text-zinc-300"
                      }`}>
                        {post.goal}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-zinc-400 text-xs max-w-[150px]">
                      {post.expectedMetrics}
                    </td>
                    <td className="py-3 px-2 text-zinc-500 text-xs max-w-[150px] truncate">
                      {post.hashtags}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-zinc-500 text-xs">
            {filteredPosts.length} пост{filteredPosts.length === 1 ? "" : filteredPosts.length < 5 ? "а" : "ов"} показано
          </p>
        </div>
      )}
    </div>
  );
}
