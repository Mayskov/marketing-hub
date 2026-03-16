"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface VariantInsights {
  impressions: number;
  reach: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  spend: number;
  leads: number;
  costPerLead: number;
}

interface VariantData {
  id: string;
  variant_label: string;
  primary_text: string;
  headline: string;
  call_to_action: string;
  meta_ad_id: string | null;
  insights: VariantInsights | null;
}

interface TestData {
  id: string;
  name: string;
  description: string;
  status: string;
  campaign_id: string;
  created_at: string;
}

export default function ABTestResultsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = use(params);

  const [test, setTest] = useState<TestData | null>(null);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [suggestedWinnerId, setSuggestedWinnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/ab-test/results/${testId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
        setTest(data.test);
        setVariants(data.variants || []);
        setSuggestedWinnerId(data.suggestedWinnerId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [testId]);

  const getBestValue = (field: keyof VariantInsights, higher = true) => {
    const values = variants
      .filter((v) => v.insights)
      .map((v) => v.insights![field]);
    if (values.length === 0) return null;
    return higher ? Math.max(...values) : Math.min(...values);
  };

  const isWinning = (v: VariantData, field: keyof VariantInsights, higher = true) => {
    if (!v.insights) return false;
    const best = getBestValue(field, higher);
    return best !== null && v.insights[field] === best && variants.filter((x) => x.insights).length > 1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
        <Link href="/ab-testing" className="text-blue-400 text-sm mt-4 inline-block hover:underline">
          ← Назад к A/B тестам
        </Link>
      </div>
    );
  }

  if (!test) return null;

  const totalSpend = variants.reduce((s, v) => s + (v.insights?.spend || 0), 0);
  const totalClicks = variants.reduce((s, v) => s + (v.insights?.clicks || 0), 0);
  const totalImpressions = variants.reduce((s, v) => s + (v.insights?.impressions || 0), 0);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ab-testing" className="text-zinc-500 hover:text-zinc-300 text-sm">
          ← A/B тесты
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{test.name}</h1>
          {test.description && (
            <p className="text-zinc-400 text-sm mt-1">{test.description}</p>
          )}
          <p className="text-zinc-600 text-xs mt-1">
            Создан: {new Date(test.created_at).toLocaleDateString("ru-RU")}
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full border ${
            test.status === "active"
              ? "bg-green-900/30 text-green-400 border-green-700"
              : test.status === "completed"
                ? "bg-blue-900/30 text-blue-400 border-blue-700"
                : "bg-zinc-800 text-zinc-500 border-zinc-700"
          }`}
        >
          {test.status === "active" ? "Активен" : test.status === "completed" ? "Завершён" : "Черновик"}
        </span>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-zinc-500 text-xs mb-1">Общие показы</p>
          <p className="text-xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-zinc-500 text-xs mb-1">Общие клики</p>
          <p className="text-xl font-bold text-white">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-zinc-500 text-xs mb-1">Общий расход</p>
          <p className="text-xl font-bold text-white">${totalSpend.toFixed(2)}</p>
        </div>
      </div>

      {/* Variant comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {variants.map((v) => {
          const isWinner = v.id === suggestedWinnerId;
          return (
            <div
              key={v.id}
              className={`bg-zinc-800/50 border rounded-lg p-5 ${
                isWinner ? "border-green-600" : "border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500 text-blue-400 flex items-center justify-center text-sm font-bold">
                  {v.variant_label}
                </span>
                <h3 className="text-white font-medium">Вариант {v.variant_label}</h3>
                {isWinner && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-700">
                    🏆 Лидер
                  </span>
                )}
              </div>

              {/* Ad preview */}
              <div className="bg-zinc-900 rounded-lg p-3 mb-4 border border-zinc-800">
                <p className="text-zinc-300 text-sm mb-1">{v.primary_text}</p>
                <p className="text-white font-medium text-sm">{v.headline}</p>
                <p className="text-zinc-500 text-xs mt-1">{v.call_to_action}</p>
              </div>

              {/* Insights */}
              {v.insights ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Показы</span>
                    <span className="text-zinc-200">{v.insights.impressions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Охват</span>
                    <span className="text-zinc-200">{v.insights.reach.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Клики</span>
                    <span className={`${isWinning(v, "clicks") ? "text-green-400 font-medium" : "text-zinc-200"}`}>
                      {v.insights.clicks.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">CTR</span>
                    <span className={`${isWinning(v, "ctr") ? "text-green-400 font-medium" : "text-zinc-200"}`}>
                      {v.insights.ctr.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">CPC</span>
                    <span className={`${isWinning(v, "cpc", false) ? "text-green-400 font-medium" : "text-zinc-200"}`}>
                      ${v.insights.cpc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Расход</span>
                    <span className="text-zinc-200">${v.insights.spend.toFixed(2)}</span>
                  </div>
                  {v.insights.leads > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Лиды</span>
                        <span className={`${isWinning(v, "leads") ? "text-green-400 font-medium" : "text-zinc-200"}`}>
                          {v.insights.leads}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Цена лида</span>
                        <span className={`${isWinning(v, "costPerLead", false) ? "text-green-400 font-medium" : "text-zinc-200"}`}>
                          ${v.insights.costPerLead.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-4">
                  Данные ещё не поступили. Запустите кампанию в Ads Manager.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {test.campaign_id && (
          <a
            href={`https://www.facebook.com/adsmanager/manage/campaigns?campaign_ids=${test.campaign_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
          >
            Открыть Ads Manager →
          </a>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:border-zinc-500 transition-colors"
        >
          🔄 Обновить данные
        </button>
      </div>
    </div>
  );
}
