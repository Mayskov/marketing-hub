"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Главная", icon: "⊞" },
  { href: "/create-ad", label: "Создать рекламу", icon: "📢" },
  { href: "/content-plan", label: "Контент-план", icon: "📅" },
  { href: "/analytics", label: "Аналитика", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Маркетинг Хаб</h1>
        <p className="text-xs text-zinc-500 mt-1">ИИ-инструменты для маркетинга</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 font-medium"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
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
