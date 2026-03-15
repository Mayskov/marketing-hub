"use client";

import { useState } from "react";

type Screen = "form" | "preview" | "publishing" | "confirmation";

const ANGLE_SUGGESTIONS = [
  "Закулисье",
  "Обучающий",
  "Мотивация",
  "Кейс",
  "Тренд",
  "Совет дня",
  "До/После",
];

export default function CreatePostPage() {
  const [screen, setScreen] = useState<Screen>("form");

  // Form state
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [format, setFormat] = useState("фото-пост");

  // Generated content
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

  // Loading states
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result
  const [mediaId, setMediaId] = useState("");

  async function handleGenerateText() {
    setError(null);
    setIsGeneratingText(true);

    try {
      const res = await fetch("/api/create-post/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, angle, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка генерации");

      setCaption(data.caption);
      setHashtags(data.hashtags);
      setImagePrompt(topic);
      setScreen("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsGeneratingText(false);
    }
  }

  async function handleGenerateImage(customPrompt?: string) {
    setError(null);
    setIsGeneratingImage(true);

    try {
      const prompt = customPrompt || imagePrompt || topic;
      const res = await fetch("/api/create-post/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка генерации");

      setImageUrl(data.imageUrl);
      setImagePreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handlePublish() {
    setError(null);
    setIsPublishing(true);
    setScreen("publishing");

    try {
      const fullCaption = hashtags
        ? `${caption}\n\n${hashtags}`
        : caption;

      const res = await fetch("/api/create-post/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, caption: fullCaption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка публикации");

      setMediaId(data.mediaId || "");
      setScreen("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setScreen("preview");
    } finally {
      setIsPublishing(false);
    }
  }

  function handleReset() {
    setScreen("form");
    setTopic("");
    setAngle("");
    setFormat("фото-пост");
    setCaption("");
    setHashtags("");
    setImageUrl("");
    setImagePreview("");
    setImagePrompt("");
    setMediaId("");
    setError(null);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Создать пост</h1>
        <p className="text-zinc-400 mt-2">
          Сгенерируйте текст и изображение с помощью ИИ, затем опубликуйте в
          Instagram
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

      {/* FORM SCREEN */}
      {screen === "form" && (
        <div className="max-w-xl mx-auto">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 space-y-5">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                О чём пост? *
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Например: как ИИ меняет маркетинг в 2026 году"
              />
            </div>

            {/* Angle */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Угол подачи
              </label>
              <input
                type="text"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Например: личный опыт, экспертный разбор"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {ANGLE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setAngle(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      angle === s
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Формат
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="фото-пост">📷 Фото-пост</option>
                <option value="карусель">🎠 Карусель</option>
                <option value="Reels">🎬 Reels</option>
              </select>
            </div>

            {/* Submit */}
            <button
              onClick={handleGenerateText}
              disabled={isGeneratingText || !topic.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isGeneratingText ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Генерация текста...
                </span>
              ) : (
                "✨ Сгенерировать текст"
              )}
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW SCREEN */}
      {screen === "preview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Text */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Текст поста</h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Подпись
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={10}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Хештеги
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            <button
              onClick={handleGenerateText}
              disabled={isGeneratingText}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:text-zinc-500"
            >
              {isGeneratingText ? "Генерация..." : "🔄 Перегенерировать текст"}
            </button>
          </div>

          {/* Right: Image */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Изображение</h2>

            {/* Image preview or placeholder */}
            <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : isGeneratingImage ? (
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">
                    Генерация изображения...
                  </p>
                </div>
              ) : (
                <div className="text-center p-6">
                  <p className="text-4xl mb-2">🖼️</p>
                  <p className="text-zinc-500 text-sm">
                    Нажмите кнопку ниже для генерации изображения
                  </p>
                </div>
              )}
            </div>

            {/* Image prompt */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Описание для изображения
              </label>
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="Опишите желаемое изображение..."
              />
            </div>

            <button
              onClick={() => handleGenerateImage()}
              disabled={isGeneratingImage}
              className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {isGeneratingImage ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Генерация...
                </span>
              ) : imagePreview ? (
                "🔄 Перегенерировать изображение"
              ) : (
                "🎨 Сгенерировать изображение"
              )}
            </button>
          </div>

          {/* Bottom actions */}
          <div className="lg:col-span-2 flex items-center gap-4 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setScreen("form")}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              ← Назад
            </button>
            <div className="flex-1" />
            <button
              onClick={handlePublish}
              disabled={!caption || !imageUrl || isPublishing}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white font-medium px-8 py-3 rounded-lg transition-all"
            >
              📸 Опубликовать в Instagram
            </button>
          </div>
        </div>
      )}

      {/* PUBLISHING SCREEN */}
      {screen === "publishing" && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">
              Публикация в Instagram...
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              Загрузка изображения и создание поста
            </p>
          </div>
        </div>
      )}

      {/* CONFIRMATION SCREEN */}
      {screen === "confirmation" && (
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Пост опубликован!
          </h2>
          <p className="text-zinc-400 mb-2">
            Ваш пост успешно опубликован в Instagram
          </p>
          {mediaId && (
            <p className="text-zinc-500 text-sm mb-8">
              Media ID: {mediaId}
            </p>
          )}

          {/* Preview of published content */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-8 text-left">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Published"
                className="w-full aspect-square object-cover rounded-lg mb-3"
              />
            )}
            <p className="text-sm text-zinc-300 line-clamp-3">{caption}</p>
            {hashtags && (
              <p className="text-xs text-blue-400 mt-2">{hashtags}</p>
            )}
          </div>

          <button
            onClick={handleReset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
          >
            ✨ Создать ещё один пост
          </button>
        </div>
      )}
    </div>
  );
}
