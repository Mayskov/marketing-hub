import DashboardCard from "./components/DashboardCard";

const tools = [
  {
    href: "/content-plan",
    icon: "📅",
    title: "Генератор контент-плана",
    description:
      "Создайте контент-план для социальных сетей на 30 дней с ИИ-генерацией постов и подписей.",
  },
  {
    href: "/create-post",
    icon: "📸",
    title: "Создать и опубликовать пост",
    description:
      "Создайте пост для Instagram с ИИ-генерацией текста и изображения, и опубликуйте напрямую.",
  },
  {
    href: "/calendar",
    icon: "🗓️",
    title: "Календарь публикаций",
    description:
      "Просматривайте запланированные и опубликованные посты в удобном календарном виде.",
  },
  {
    href: "/create-ad",
    icon: "📢",
    title: "Создать рекламу в Facebook",
    description:
      "Сгенерируйте рекламный текст с помощью ИИ и опубликуйте кампанию напрямую в Meta Ads Manager.",
  },
  {
    href: "/ab-testing",
    icon: "🧪",
    title: "A/B Тестирование",
    description:
      "Создайте несколько вариантов рекламы с ИИ и сравните их эффективность в Meta Ads.",
  },
  {
    href: "/analytics",
    icon: "📊",
    title: "Аналитика рекламы",
    description:
      "Просматривайте аналитику кампаний в реальном времени. Экспорт отчётов в PDF и Excel.",
  },
  {
    href: "/competitors",
    icon: "🔍",
    title: "Анализ конкурентов",
    description:
      "Парсинг постов конкурентов из Instagram с ИИ-анализом — находите аутлайеры и идеи для контента.",
  },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Маркетинг Хаб</h1>
        <p className="text-zinc-400 mt-2">
          Выберите инструмент для работы с вашим маркетингом
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {tools.map((tool) => (
          <DashboardCard key={tool.href} {...tool} />
        ))}
      </div>
    </div>
  );
}
