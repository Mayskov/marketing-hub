import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Маркетинг Хаб",
  description: "Маркетинговые инструменты на базе ИИ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased bg-zinc-900 text-white flex">
        <Sidebar />
        <main className="flex-1 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
