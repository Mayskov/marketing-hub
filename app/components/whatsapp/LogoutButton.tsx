"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/whatsapp-auth/logout", { method: "POST" });
    router.push("/whatsapp-agent/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-zinc-400 hover:text-white transition-colors"
    >
      Выйти
    </button>
  );
}
