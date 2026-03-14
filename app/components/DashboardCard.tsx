import Link from "next/link";

interface DashboardCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

export default function DashboardCard({
  href,
  icon,
  title,
  description,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 hover:border-zinc-500 hover:bg-zinc-750 transition-all group"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
        {title}
      </h2>
      <p className="text-sm text-zinc-400">{description}</p>
    </Link>
  );
}
