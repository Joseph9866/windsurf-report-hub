import { cn } from "@/lib/utils";

type Status = "new" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "medium" | "high" | "critical";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const statusLabels: Record<Status, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "status-badge",
        status === "new" && "status-new",
        status === "in_progress" && "status-in-progress",
        status === "resolved" && "status-resolved",
        status === "closed" && "status-closed",
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        priority === "low" && "priority-low",
        priority === "medium" && "priority-medium",
        priority === "high" && "priority-high",
        priority === "critical" && "priority-critical",
        className
      )}
    >
      {priorityLabels[priority]}
    </span>
  );
}