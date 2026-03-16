"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Variant {
  variantLabel: string;
  primaryText: string;
  headline: string;
  callToAction: string;
  imageBase64?: string;
}

type Step = "form" | "variants" | "publishing" | "done";

const CTA_OPTIONS = [
  "LEARN_MORE",
  "SIGN_UP",
  "SUBSCRIBE",
  "CONTACT_US",
  "GET_QUOTE",
  "APPLY_NOW",
  "BOOK_NOW",
  "DOWNLOAD",
  "SHOP_NOW",
];

export default function ABTestingPage() {
  const [step, setStep] = useState<Step>("form");

  // Form fields
  const [product, setProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [goal, setGoal] = useState("Лиды");
  const [tone, setTone] = useState("Профессиональный");
  const [variantCount, setVariantCount] = useState(2);
  const [location, setLocation] = useState("");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [dailyBudget, setDailyBudget] = useState(10);
  const [landingPageUrl, setLandingPageUrl] = useState("");

  // Image
  const [sharedImageBase64, setSharedImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variants
  const [variants, setVariants] = useState<Variant[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState("");

  // Loading / Result
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    testId: string;
    adsManagerUrl: string;
    variantCount: number;
  } | null>(null);

  // Existing tests
  const [existingTests, setExistingTests] = useState<
    Array<{ id: string; name: string; status: string; created_at: string }>
  >([]);
  const [showExisting, setShowExisting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setSharedImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!product || !targetAudience) {
      setError("Заполните продукт и целевую аудиторию");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ab-test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, targetAudience, goal, tone, variantCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка генерации");

      setVariants(data.variants);
      setInterests(data.interests || []);
      setCampaignName(data.campaignName || `A/B Тест — ${product}`);
      setStep("variants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handlePublish = async () => {
    if (!sharedImageBase64) {
      setError("Загрузите изображение для рекламы");
      return;
    }
    setIsPublishing(true);
    setStep("publishing");
    setError(null);
    try {
      const res = await fetch("/api/ab-test/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          description: `A/B тест: ${product} для ${targetAudience}`,
          variants,
          interests,
          location: location || "Worldwide",
          ageMin,
          ageMax,
          dailyBudget,
          landingPageUrl,
          sharedImageBase64,
          status: "PAUSED",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания");

      setResult({
        testId: data.test.id,
        adsManagerUrl: data.adsManagerUrl,
        variantCount: data.variantCount,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания кампании");
      setStep("variants");
    } finally {
      setIsPublishing(false);
    }
  };

  const fetchExistingTests = async () => {
    try {
      const res = await fetch("/api/ab-test/list");
      const data = await res.json();
      if (data.tests) setExistingTests(data.tests);
    } catch {
      /* ignore */
    }
    setShowExisting(true);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">A/B Тестирование</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Создайте несколько вариантов рекламы и сравните их эффективность
          </p>
        </div>
        <button
          onClick={fetchExistingTests}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:border-zinc-500 transition-colors"
        >
          Мои тесты
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError(null)} className="float-right text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Existing tests panel */}
      {showExisting && (
        <div className="mb-6 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-medium">Существующие тесты</h3>
            <button onClick={() => setShowExisting(false)} className="text-zinc-500 hover:text-zinc-300">
              &times;
            </button>
          </div>
          {existingTests.length === 0 ? (
            <p className="text-zinc-500 text-sm">Нет тестов</p>
          ) : (
            <div className="space-y-2">
              {existingTests.map((t) => (
                <Link
                  key={t.id}
                  href={`/ab-testing/results/${t.id}`}
                  className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors"
                >
                  <div>
                    <p className="text-zinc-200 text-sm font-medium">{t.name}</p>
                    <p className="text-zinc-500 text-xs">
                      {new Date(t.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      t.status === "active"
                        ? "bg-green-900/30 text-green-400 border-green-700"
                        : t.status === "completed"
                          ? "bg-blue-900/30 text-blue-400 border-blue-700"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    {t.status === "active" ? "Активен" : t.status === "completed" ? "Завершён" : "Черновик"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Form */}
      {step === "form" && (
        <div className="space-y-6">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">1. Описание рекламы</h2>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Продукт / Услуга *</label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Например: Онлайн-курс по маркетингу"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Целевая аудитория *</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Например: Предприниматели 25-45 лет"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Цель рекламы</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  <option>Лиды</option>
                  <option>Продажи</option>
                  <option>Трафик на сайт</option>
                  <option>Узнаваемость бренда</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Тон коммуникации</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  <option>Профессиональный</option>
                  <option>Дружелюбный</option>
                  <option>Провокационный</option>
                  <option>Экспертный</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Количество вариантов</label>
              <div className="flex gap-3">
                {[2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setVariantCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      variantCount === n
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {n} варианта
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">2. Таргетинг</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Локация</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Город или страна"
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Бюджет/день ($)</label>
                <input
                  type="number"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  min={1}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Возраст от</label>
                <input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(Number(e.target.value))}
                  min={13}
                  max={65}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Возраст до</label>
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(Number(e.target.value))}
                  min={13}
                  max={65}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Ссылка для рекламы</label>
              <input
                type="url"
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">3. Изображение</h2>
            <p className="text-zinc-500 text-sm">
              Загрузите общее изображение для всех вариантов рекламы
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:border-zinc-500 transition-colors"
            >
              📁 Загрузить изображение
            </button>

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-48 h-48 object-cover rounded-lg border border-zinc-700"
              />
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !product || !targetAudience}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ИИ генерирует варианты...
              </span>
            ) : (
              `✨ Сгенерировать ${variantCount} варианта`
            )}
          </button>
        </div>
      )}

      {/* Step 2: Edit Variants */}
      {step === "variants" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setStep("form")}
              className="text-zinc-500 hover:text-zinc-300 text-sm"
            >
              ← Назад
            </button>
            <h2 className="text-lg font-semibold text-white">Редактирование вариантов</h2>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Название кампании</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
            />
          </div>

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-zinc-500">Интересы:</span>
              {interests.map((i) => (
                <span
                  key={i}
                  className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded"
                >
                  {i}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((v, idx) => (
              <div
                key={v.variantLabel}
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-5 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500 text-blue-400 flex items-center justify-center text-sm font-bold">
                    {v.variantLabel}
                  </span>
                  <h3 className="text-white font-medium">Вариант {v.variantLabel}</h3>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Основной текст</label>
                  <textarea
                    value={v.primaryText}
                    onChange={(e) => updateVariant(idx, "primaryText", e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={v.headline}
                    onChange={(e) => updateVariant(idx, "headline", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Призыв к действию</label>
                  <select
                    value={v.callToAction}
                    onChange={(e) => updateVariant(idx, "callToAction", e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    {CTA_OPTIONS.map((cta) => (
                      <option key={cta} value={cta}>
                        {cta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePublish}
            disabled={isPublishing || !sharedImageBase64}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!sharedImageBase64
              ? "⚠️ Сначала загрузите изображение"
              : `🚀 Создать A/B тест (${variants.length} варианта)`}
          </button>
        </div>
      )}

      {/* Step 3: Publishing */}
      {step === "publishing" && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">
              Создаём кампанию с {variants.length} вариантами в Meta Ads...
            </p>
            <p className="text-zinc-600 text-xs mt-2">Это может занять 10-20 секунд</p>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && result && (
        <div className="bg-zinc-800/50 border border-green-700 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">
            A/B тест создан!
          </h2>
          <p className="text-zinc-400 mb-6">
            {result.variantCount} варианта рекламы созданы в одной кампании.
            Кампания поставлена на паузу — запустите её в Ads Manager.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={result.adsManagerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
            >
              Открыть Ads Manager →
            </a>
            <Link
              href={`/ab-testing/results/${result.testId}`}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:border-zinc-500 transition-colors"
            >
              📊 Результаты теста
            </Link>
            <button
              onClick={() => {
                setStep("form");
                setVariants([]);
                setResult(null);
                setProduct("");
                setTargetAudience("");
                setSharedImageBase64("");
                setImagePreview("");
              }}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:border-zinc-500 transition-colors"
            >
              + Новый тест
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
