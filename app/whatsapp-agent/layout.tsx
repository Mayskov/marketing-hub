import { createSupabaseServer } from "../lib/supabase-server";
import LogoutButton from "../components/whatsapp/LogoutButton";

export const metadata = {
  title: "WhatsApp Agent — Маркетинг Хаб",
};

export default async function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="-m-8 min-h-screen bg-zinc-950 flex flex-col">
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <h1 className="text-white font-semibold text-lg">WhatsApp Agent</h1>
        </div>
        {user && <LogoutButton />}
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
