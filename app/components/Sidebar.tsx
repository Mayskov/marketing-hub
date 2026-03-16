"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "",
    items: [{ href: "/", label: "Главная", icon: "⊞" }],
  },
  {
    title: "Контент",
    items: [
      { href: "/content-plan", label: "Контент-план", icon: "📅" },
      { href: "/create-post", label: "Создать пост", icon: "📸" },
      { href: "/calendar", label: "Календарь", icon: "🗓️" },
    ],
  },
  {
    title: "Реклама",
    items: [
      { href: "/create-ad", label: "Создать рекламу", icon: "📢" },
      { href: "/ab-testing", label: "A/B тесты", icon: "🧪" },
    ],
  },
  {
    title: "Аналитика",
    items: [
      { href: "/analytics", label: "Аналитика", icon: "📊" },
      { href: "/competitors", label: "Анализ конкурентов", icon: "🔍" },
    ],
  },
  {
    title: "Другое",
    items: [
      {
        href: "/whatsapp-agent",
        label: "WhatsApp Агент",
        icon: "💬",
        external: true,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  if (pathname.startsWith("/whatsapp-agent")) {
    return null;
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Маркетинг Хаб</h1>
        <p className="text-xs text-zinc-500 mt-1">ИИ-инструменты для маркетинга</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navGroups.map((group) => (
          <div key={group.title || "_home"} className={group.title ? "mt-3" : ""}>
            {group.title && (
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold px-3 mb-1">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 font-medium"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`;

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                    <span className="text-xs text-zinc-600 ml-auto">↗</span>
                  </a>
                );
              }

              return (
                <Link key={item.href} href={item.href} className={className}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto" />
    </aside>
  );
}
