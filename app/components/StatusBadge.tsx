import { cn } from "@/lib/utils"

type StatusBadgeProps = {
  status: "Новая" | "Согласована КМ" | "Согласована ДМП" | "Отклонена"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles = {
    Новая: "bg-blue-100 text-blue-800",
    "Согласована КМ": "bg-yellow-100 text-yellow-800",
    "Согласована ДМП": "bg-green-100 text-green-800",
    Отклонена: "bg-red-100 text-red-800",
  }

  return <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusStyles[status])}>{status}</span>
}

