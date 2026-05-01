import { useState, useMemo, useCallback } from 'react';
import {Plus, Search, Filter, X, Ban} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSprintStore } from '@/stores/sprintStore';
import { useAuthStore } from '@/stores/authStore';
import type { TaskStatus, TaskPriority } from '@/types';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'var(--status-backlog)' },
  { id: 'todo', label: 'To Do', color: 'var(--status-todo)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--status-in-progress)' },
  { id: 'in_review', label: 'In Review', color: 'var(--status-in-review)' },
  { id: 'done', label: 'Done', color: 'var(--status-done)' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

interface NewTaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  storyPoints: string;
  assigneeId: string;
  sprintId: string;
  labels: string;
  dueDate: string;
}

const emptyForm: NewTaskForm = {
  title: '',
  description: '',
  priority: 'medium',
  storyPoints: '1',
  assigneeId: '',
  sprintId: '',
  labels: '',
  dueDate: '',
};

export default function KanbanPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);
  const selectTask = useTaskStore((s) => s.selectTask);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const sprints = useSprintStore((s) => s.sprints);
  const users = useAuthStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [form, setForm] = useState<NewTaskForm>(emptyForm);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null),
    [tasks, selectedTaskId]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (activeProjectId) result = result.filter((t) => t.projectId === activeProjectId);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (filterAssignee) result = result.filter((t) => t.assigneeId === filterAssignee);
    return result;
  }, [tasks, activeProjectId, search, filterAssignee]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, typeof filteredTasks> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const t of filteredTasks) {
      map[t.status].push(t);
    }
    return map;
  }, [filteredTasks]);

  const memberOptions = useMemo(
    () => [
      { value: '', label: 'All members' },
      ...users.map((u) => ({ value: u.id, label: u.name })),
    ],
    [users]
  );

  const assigneeFormOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...users.map((u) => ({ value: u.id, label: u.name })),
    ],
    [users]
  );

  const sprintOptions = useMemo(
    () => [
      { value: '', label: 'No sprint (Backlog)' },
      ...sprints.filter((s) => s.status !== 'completed').map((s) => ({ value: s.id, label: s.name })),
    ],
    [sprints]
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );

  const handleOpenDialog = (status: TaskStatus) => {
    setDefaultStatus(status);
    setForm({ ...emptyForm, sprintId: sprints.find((s) => s.status === 'active')?.id ?? '' });
    setDialogOpen(true);
  };

  const handleCreateTask = () => {
    if (!form.title.trim()) return;
    addTask({
      projectId: activeProjectId ?? (projects[0]?.id ?? 'default'),
      sprintId: form.sprintId || null,
      title: form.title.trim(),
      description: form.description,
      status: defaultStatus,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      reporterId: currentUser?.id ?? '',
      storyPoints: parseInt(form.storyPoints, 10) || 1,
      labels: form.labels ? form.labels.split(',').map((l) => l.trim()).filter(Boolean) : [],
      dueDate: form.dueDate || null,
    });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragTaskId) {
      moveTask(dragTaskId, status);
    }
    setDragTaskId(null);
    setDragOverCol(null);
  }, [dragTaskId, moveTask]);

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Ban Board"
        description={activeProject ? `Project: ${activeProject.name}` : 'All projects · drag cards to move between stages'}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="h-8 pl-8 text-sm w-48"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filter
            </Button>
            <Button size="sm" className="h-8" onClick={() => handleOpenDialog('todo')}>
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>
        }
      />

      {showFilters && (
        <div
          className="px-6 py-3 border-b flex items-center gap-4"
          style={{ background: 'var(--topbar-bg)', borderColor: 'var(--topbar-border)' }}
        >
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Assignee</Label>
            <Select
              value={filterAssignee}
              onChange={setFilterAssignee}
              options={memberOptions}
              className="w-40"
            />
          </div>
          {filterAssignee && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFilterAssignee('')}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Board */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden p-4"
        style={{ background: 'var(--kanban-bg)' }}
      >
        {tasks.length === 0 && !search && !filterAssignee ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <Ban className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <h2 className="text-base font-semibold text-foreground mb-2">Your board is wide open</h2>
              <p className="text-sm text-muted-foreground mb-4">
                No tasks yet — add your first ticket and start tracking your team's development pipeline.
              </p>
              <Button onClick={() => handleOpenDialog('todo')}>
                <Plus className="h-4 w-4 mr-2" />
                Create first task
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 h-full min-w-max">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id];
              return (
                <div
                  key={col.id}
                  className="flex flex-col rounded-lg w-72 flex-shrink-0"
                  style={{
                    background: dragOverCol === col.id ? 'var(--kanban-col-border)' : 'var(--kanban-col-bg)',
                    border: `1px solid ${dragOverCol === col.id ? col.color + '50' : 'var(--kanban-col-border)'}`,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-semibold text-foreground">{col.label}</span>
                      <span className="text-xs font-mono text-muted-foreground ml-1">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDialog(col.id)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px]">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => selectTask(task.id)}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center h-16 rounded-md border border-dashed border-muted-foreground/20">
                        <p className="text-xs text-muted-foreground">Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => selectTask(null)}
        />
      )}

      {/* Create task dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What needs to be done?"
                rows={3}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Priority</Label>
                <Select
                  value={form.priority}
                  onChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
                  options={priorityOptions}
                />
              </div>
              <div>
                <Label htmlFor="story-pts">Story Points</Label>
                <Input
                  id="story-pts"
                  type="number"
                  min={0}
                  value={form.storyPoints}
                  onChange={(e) => setForm((f) => ({ ...f, storyPoints: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="mb-1 block">Assignee</Label>
                <Select
                  value={form.assigneeId}
                  onChange={(v) => setForm((f) => ({ ...f, assigneeId: v }))}
                  options={assigneeFormOptions}
                />
              </div>
              <div>
                <Label className="mb-1 block">Sprint</Label>
                <Select
                  value={form.sprintId}
                  onChange={(v) => setForm((f) => ({ ...f, sprintId: v }))}
                  options={sprintOptions}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task-labels">Labels (comma-separated)</Label>
                <Input
                  id="task-labels"
                  value={form.labels}
                  onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))}
                  placeholder="bug, feature, docs"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateTask} disabled={!form.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
