"use client";

interface GeneratedContent {
  primaryText: string;
  headline: string;
  callToAction: string;
  interests: string[];
  campaignName: string;
  adSetName: string;
  adName: string;
}

interface AdPreviewProps {
  generated: GeneratedContent;
  imagePreview: string;
  publishImmediately: boolean;
  onConfirm: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  isCreating: boolean;
}

export default function AdPreview({
  generated,
  imagePreview,
  publishImmediately,
  onConfirm,
  onRegenerate,
  onBack,
  isCreating,
}: AdPreviewProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Предпросмотр рекламы</h1>

      <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Реклама"
            className="w-full max-h-64 object-cover"
          />
        )}
        <div className="p-4 space-y-2">
          <p className="text-white text-sm">{generated.primaryText}</p>
          <h2 className="text-lg font-bold text-white">
            {generated.headline}
          </h2>
          <span className="inline-block bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded">
            {generated.callToAction.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          Таргетинг
        </h3>
        <div className="flex flex-wrap gap-2">
          {generated.interests.map((interest, i) => (
            <span
              key={i}
              className="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Кампания</span>
          <span className="text-zinc-200">{generated.campaignName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Группа объявлений</span>
          <span className="text-zinc-200">{generated.adSetName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Объявление</span>
          <span className="text-zinc-200">{generated.adName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Статус</span>
          <span
            className={
              publishImmediately ? "text-red-400 font-medium" : "text-zinc-200"
            }
          >
            {publishImmediately ? "АКТИВНА (будут тратиться деньги)" : "НА ПАУЗЕ (черновик)"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Назад
        </button>
        <button
          onClick={onRegenerate}
          disabled={isCreating}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Перегенерировать
        </button>
        <button
          onClick={onConfirm}
          disabled={isCreating}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {isCreating ? "Создание..." : "Создать рекламу"}
        </button>
      </div>
    </div>
  );
}
