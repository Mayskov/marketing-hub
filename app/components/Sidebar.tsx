"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Главная", icon: "⊞" },
  { href: "/content-plan", label: "Контент-план", icon: "📅" },
  { href: "/create-ad", label: "Создать рекламу", icon: "📢" },
  { href: "/analytics", label: "Аналитика", icon: "📊" },
  { href: "/competitors", label: "Анализ конкурентов", icon: "🔍" },
  { href: "/create-post", label: "Создать пост", icon: "📸" },
  { href: "/whatsapp-agent", label: "WhatsApp Агент", icon: "💬", external: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on WhatsApp agent pages (they open in a new tab with their own layout)
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
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
              ? "bg-blue-600/20 text-blue-400 font-medium"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`;

          if ("external" in item && item.external) {
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
            <Link
              key={item.href}
              href={item.href}
              className={className}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto" />
    </aside>
  );
}
