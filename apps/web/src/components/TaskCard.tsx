import { useMemo } from 'react';
import {SplitSquareVertical, MicOff, Clock, AlertCircle, ChevronUp, Minus, ChevronDown} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

const priorityConfig = {
  critical: { icon: AlertCircle, label: 'Critical', color: 'var(--priority-critical)' },
  high: { icon: ChevronUp, label: 'High', color: 'var(--priority-high)' },
  medium: { icon: Minus, label: 'Medium', color: 'var(--priority-medium)' },
  low: { icon: ChevronDown, label: 'Low', color: 'var(--priority-low)' },
};

const prStatusConfig = {
  open: { label: 'Open', color: 'var(--pr-open)' },
  merged: { label: 'Merged', color: 'var(--pr-merged)' },
  closed: { label: 'Closed', color: 'var(--pr-closed)' },
  draft: { label: 'Draft', color: 'var(--pr-draft)' },
};

export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const users = useAuthStore((s) => s.users);
  const assignee = useMemo(
    () => (task.assigneeId ? users.find((u) => u.id === task.assigneeId) : null),
    [users, task.assigneeId]
  );

  const totalHours = useMemo(
    () => task.timeEntries.reduce((sum, e) => sum + e.hours, 0),
    [task.timeEntries]
  );

  const prConfig = priorityConfig[task.priority];
  const PriorityIcon = prConfig.icon;
  const openPRs = task.linkedPRs.filter((pr) => pr.status === 'open' || pr.status === 'draft');
  const mergedPRs = task.linkedPRs.filter((pr) => pr.status === 'merged');

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-background rounded-lg p-3 cursor-pointer group hover:ring-1 hover:ring-primary/30 transition-all"
      style={{
        boxShadow: 'var(--card-shadow)',
        transition: 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Priority + Labels row */}
      <div className="flex items-center gap-1.5 mb-2">
        <Tooltip content={prConfig.label}>
          <PriorityIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: prConfig.color }} />
        </Tooltip>
        {task.labels.slice(0, 2).map((label) => (
          <Badge key={label} variant="secondary" className="text-xs px-1.5 py-0">
            {label}
          </Badge>
        ))}
        {task.labels.length > 2 && (
          <span className="text-xs text-muted-foreground">+{task.labels.length - 2}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {task.storyPoints}pt
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-foreground leading-snug mb-2.5 line-clamp-2">
        {task.title}
      </p>

      {/* PR/Commit badges */}
      {(task.linkedPRs.length > 0 || task.linkedCommits.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.linkedPRs.slice(0, 2).map((pr) => (
            <Tooltip key={pr.id} content={`PR #${pr.number}: ${pr.title}`}>
              <span
                className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded-sm"
                style={{
                  background: `${prStatusConfig[pr.status].color}18`,
                  color: prStatusConfig[pr.status].color,
                  border: `1px solid ${prStatusConfig[pr.status].color}40`,
                }}
              >
                <SplitSquareVertical className="h-3 w-3" />
                #{pr.number}
                <span className="opacity-80">·{pr.status}</span>
              </span>
            </Tooltip>
          ))}
          {task.linkedCommits.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded-sm"
              style={{
                background: 'var(--brand-steel)18',
                color: 'var(--brand-steel)',
                border: '1px solid var(--brand-steel)40',
              }}
            >
              <MicOff className="h-3 w-3" />
              {task.linkedCommits.length} commit{task.linkedCommits.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2">
        {totalHours > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {totalHours}h
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {assignee && (
            <Tooltip content={assignee.name}>
              <Avatar initials={assignee.avatarInitials} size="sm" />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
