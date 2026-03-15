import LoginForm from "../../components/whatsapp/LoginForm";

export default function WhatsAppLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">💬</span>
          <h2 className="text-xl font-bold text-white mt-3">WhatsApp Agent</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Войдите для просмотра диалогов
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
