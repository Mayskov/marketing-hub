"use client";

import { useState, useEffect } from "react";

interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective: string;
  createdTime: string;
  dailyBudget: string | null;
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

interface Totals {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  leads: number;
  ctr: number;
  cpc: number;
  costPerLead: number;
}

interface CampaignResponse {
  campaigns: CampaignData[];
  totals: Totals;
  accountId: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-900/30 text-green-400 border-green-700",
  PAUSED: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  DELETED: "bg-red-900/30 text-red-400 border-red-700",
  ARCHIVED: "bg-zinc-800 text-zinc-500 border-zinc-700",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Активна",
  PAUSED: "На паузе",
  DELETED: "Удалена",
  ARCHIVED: "В архиве",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "М";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "К";
  return n.toLocaleString();
}

function formatMoney(n: number): string {
  return "$" + n.toFixed(2);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<CampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось загрузить данные");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCampaigns =
    !data
      ? []
      : filterStatus === "All"
        ? data.campaigns
        : data.campaigns.filter((c) => c.status === filterStatus);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Аналитика рекламы</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Данные кампаний из вашего аккаунта Meta Ads в реальном времени (за последние 30 дней)
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg hover:border-zinc-500 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Загрузка..." : "↻ Обновить"}
        </button>
      </div>

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

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">
              Загружаем данные кампаний из Meta...
            </p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Карточки с итогами */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Общие расходы
              </p>
              <p className="text-2xl font-bold text-white">
                {formatMoney(data.totals.spend)}
              </p>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Показы
              </p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(data.totals.impressions)}
              </p>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Клики
              </p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(data.totals.clicks)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                CTR: {data.totals.ctr.toFixed(2)}%
              </p>
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Лиды
              </p>
              <p className="text-2xl font-bold text-white">
                {data.totals.leads}
              </p>
              {data.totals.leads > 0 && (
                <p className="text-xs text-zinc-500 mt-1">
                  Цена лида: {formatMoney(data.totals.costPerLead)}
                </p>
              )}
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {["All", "ACTIVE", "PAUSED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    filterStatus === status
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {status === "All"
                    ? `Все (${data.campaigns.length})`
                    : `${statusLabels[status] || status} (${data.campaigns.filter((c) => c.status === status).length})`}
                </button>
              ))}
            </div>
            <a
              href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${data.accountId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Открыть Ads Manager →
            </a>
          </div>

          {/* Таблица кампаний */}
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <p className="text-zinc-500">Кампании не найдены</p>
              <p className="text-zinc-600 text-sm mt-1">
                Создайте вашу первую рекламу, чтобы увидеть здесь аналитику
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 px-3 text-zinc-400 font-medium">
                      Кампания
                    </th>
                    <th className="text-left py-3 px-3 text-zinc-400 font-medium">
                      Статус
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      Бюджет/день
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      Расходы
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      Показы
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      Клики
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      CTR
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      CPC
                    </th>
                    <th className="text-right py-3 px-3 text-zinc-400 font-medium">
                      Лиды
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <td className="py-3 px-3">
                        <a
                          href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${data.accountId}&campaign_ids=${campaign.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-200 hover:text-blue-400 font-medium transition-colors"
                        >
                          {campaign.name}
                        </a>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Создана{" "}
                          {new Date(campaign.createdTime).toLocaleDateString("ru-RU")}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${statusColors[campaign.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                        >
                          {statusLabels[campaign.status] || campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.dailyBudget
                          ? formatMoney(parseFloat(campaign.dailyBudget))
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.spend > 0
                          ? formatMoney(campaign.spend)
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.impressions > 0
                          ? formatNumber(campaign.impressions)
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.clicks > 0
                          ? formatNumber(campaign.clicks)
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.ctr > 0
                          ? campaign.ctr.toFixed(2) + "%"
                          : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.cpc > 0 ? formatMoney(campaign.cpc) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300">
                        {campaign.leads > 0 ? campaign.leads : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-zinc-600 text-xs mt-4">
            Данные из Meta Marketing API (за 30 дней) · {filteredCampaigns.length} кампани{filteredCampaigns.length === 1 ? "я" : filteredCampaigns.length < 5 ? "и" : "й"} показано
          </p>
        </>
      ) : null}
    </div>
  );
}
