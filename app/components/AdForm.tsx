"use client";

import { useState, useRef } from "react";

export interface AdFormData {
  description: string;
  location: string;
  dailyBudget: number;
  ageMin: number;
  ageMax: number;
  landingPageUrl: string;
  imageFile: File | null;
  imagePreview: string;
  publishImmediately: boolean;
}

interface AdFormProps {
  onSubmit: (data: AdFormData) => void;
  isLoading: boolean;
}

export default function AdForm({ onSubmit, isLoading }: AdFormProps) {
  const [form, setForm] = useState<AdFormData>({
    description: "",
    location: "",
    dailyBudget: 10,
    ageMin: 25,
    ageMax: 55,
    landingPageUrl: "",
    imageFile: null,
    imagePreview: "",
    publishImmediately: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageFile) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">
        Создать рекламу в Facebook
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        Заполните данные, и ИИ сгенерирует рекламный текст
      </p>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Описание продукта / услуги
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder='Например: "Я помогаю агентам по недвижимости находить больше покупателей через таргетированный маркетинг"'
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Целевая локация
        </label>
        <input
          type="text"
          value={form.location}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, location: e.target.value }))
          }
          placeholder='Например: "Астана, Казахстан"'
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Дневной бюджет (USD)
        </label>
        <input
          type="number"
          value={form.dailyBudget}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              dailyBudget: Number(e.target.value),
            }))
          }
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Мин. возраст
          </label>
          <input
            type="number"
            value={form.ageMin}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                ageMin: Number(e.target.value),
              }))
            }
            min={18}
            max={65}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Макс. возраст
          </label>
          <input
            type="number"
            value={form.ageMax}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                ageMax: Number(e.target.value),
              }))
            }
            min={18}
            max={65}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          URL посадочной страницы{" "}
          <span className="text-zinc-500 font-normal">(необязательно)</span>
        </label>
        <input
          type="url"
          value={form.landingPageUrl}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, landingPageUrl: e.target.value }))
          }
          placeholder="Например: https://yourbusiness.com/offer или https://calendly.com/your-booking"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Куда кнопка CTA перенаправит людей. Оставьте пустым, чтобы использовать вашу страницу Facebook.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Изображение для рекламы
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors"
        >
          {form.imagePreview ? (
            <img
              src={form.imagePreview}
              alt="Предпросмотр"
              className="max-h-48 mx-auto rounded"
            />
          ) : (
            <p className="text-zinc-500">Нажмите, чтобы загрузить изображение (JPG/PNG)</p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
        <div>
          <span className="text-sm text-zinc-300">Опубликовать сразу</span>
          {form.publishImmediately && (
            <span className="ml-2 text-xs text-red-400 font-medium">
              Будут тратиться реальные деньги
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              publishImmediately: !prev.publishImmediately,
            }))
          }
          className={`relative w-11 h-6 rounded-full transition-colors ${
            form.publishImmediately ? "bg-blue-500" : "bg-zinc-600"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              form.publishImmediately ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading || !form.imageFile}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors"
      >
        {isLoading ? "Генерация..." : "Сгенерировать рекламу"}
      </button>
    </form>
  );
}
