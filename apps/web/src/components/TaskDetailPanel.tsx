import { useState, useMemo } from 'react';
import {X, SplitSquareVertical, MicOff, Clock, Plus, Trash, Timer, ExternalLink, Minus, User} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Task, TaskStatus, TaskPriority } from '@/types';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const prStatusConfig: Record<string, { color: string; label: string }> = {
  open: { color: 'var(--pr-open)', label: 'Open' },
  merged: { color: 'var(--pr-merged)', label: 'Merged' },
  closed: { color: 'var(--pr-closed)', label: 'Closed' },
  draft: { color: 'var(--pr-draft)', label: 'Draft' },
};

const activityTypeIcons: Record<string, React.ReactNode> = {
  status_change: <Minus className="h-3 w-3" />,
  pr_linked: <SplitSquareVertical className="h-3 w-3" />,
  commit_linked: <MicOff className="h-3 w-3" />,
  time_logged: <Clock className="h-3 w-3" />,
  assigned: <User className="h-3 w-3" />,
  comment: <User className="h-3 w-3" />,
};

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const linkPR = useTaskStore((s) => s.linkPR);
  const linkCommit = useTaskStore((s) => s.linkCommit);
  const addTimeEntry = useTaskStore((s) => s.addTimeEntry);
  const deleteTimeEntry = useTaskStore((s) => s.deleteTimeEntry);
  const mergePR = useTaskStore((s) => s.mergePR);
  const addActivity = useTaskStore((s) => s.addActivity);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [editingTitle, setEditingTitle] = useState(false);

  // PR form state
  const [prNumber, setPrNumber] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [prBranch, setPrBranch] = useState('');
  const [showPrForm, setShowPrForm] = useState(false);

  // Commit form state
  const [commitSha, setCommitSha] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [commitUrl, setCommitUrl] = useState('');
  const [showCommitForm, setShowCommitForm] = useState(false);

  // Time entry form
  const [timeHours, setTimeHours] = useState('');
  const [timeDesc, setTimeDesc] = useState('');
  const [timeBillable, setTimeBillable] = useState(true);
  const [showTimeForm, setShowTimeForm] = useState(false);

  const totalHours = useMemo(
    () => task.timeEntries.reduce((sum, e) => sum + e.hours, 0),
    [task.timeEntries]
  );

  const memberOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...users.map((u) => ({ value: u.id, label: u.name })),
    ],
    [users]
  );

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    }
    setEditingTitle(false);
  };

  const handleDescBlur = () => {
    if (description !== task.description) {
      updateTask(task.id, { description });
    }
  };

  const handleStatusChange = (value: string) => {
    moveTask(task.id, value as TaskStatus);
    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        type: 'status_changed',
        title: 'Task status updated',
        message: `"${task.title}" moved to ${value.replace('_', ' ')}`,
        read: false,
        taskId: task.id,
      });
    }
  };

  const handleAssigneeChange = (value: string) => {
    updateTask(task.id, { assigneeId: value || null });
    if (value && currentUser) {
      addActivity(task.id, {
        taskId: task.id,
        userId: currentUser.id,
        userName: currentUser.name,
        type: 'assigned',
        content: `Assigned to ${users.find((u) => u.id === value)?.name ?? value}`,
      });
    }
  };

  const handleLinkPR = () => {
    if (!prNumber || !prTitle) return;
    linkPR(task.id, {
      number: parseInt(prNumber, 10),
      title: prTitle,
      url: prUrl,
      status: 'open',
      author: currentUser?.name ?? 'Unknown',
      taskId: task.id,
      branch: prBranch,
    });
    setPrNumber('');
    setPrTitle('');
    setPrUrl('');
    setPrBranch('');
    setShowPrForm(false);
  };

  const handleLinkCommit = () => {
    if (!commitSha || !commitMsg) return;
    linkCommit(task.id, {
      sha: commitSha,
      message: commitMsg,
      author: currentUser?.name ?? 'Unknown',
      url: commitUrl,
      taskId: task.id,
    });
    setCommitSha('');
    setCommitMsg('');
    setCommitUrl('');
    setShowCommitForm(false);
  };

  const handleAddTime = () => {
    const hours = parseFloat(timeHours);
    if (!hours || !timeDesc) return;
    addTimeEntry(task.id, {
      taskId: task.id,
      userId: currentUser?.id ?? '',
      description: timeDesc,
      hours,
      billable: timeBillable,
      date: new Date().toISOString().split('T')[0],
    });
    setTimeHours('');
    setTimeDesc('');
    setShowTimeForm(false);
  };

  const handleMergePR = (prId: string) => {
    mergePR(task.id, prId);
    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        type: 'pr_merged',
        title: 'Pull Request merged',
        message: `PR on "${task.title}" was merged. Task moved to Done.`,
        read: false,
        taskId: task.id,
      });
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 w-[520px] bg-background border-l flex flex-col z-30"
      style={{ borderColor: 'var(--topbar-border)', boxShadow: '-4px 0 20px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--topbar-border)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
            {task.id.slice(0, 10).toUpperCase()}
          </span>
          <Select
            value={task.status}
            onChange={handleStatusChange}
            options={statusOptions}
            className="w-36"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded hover:bg-muted transition-colors ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Title */}
          {editingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); }}
              className="text-base font-semibold"
              autoFocus
            />
          ) : (
            <h2
              className="text-base font-semibold text-foreground cursor-text hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {task.title}
            </h2>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Priority</Label>
              <Select
                value={task.priority}
                onChange={(v) => updateTask(task.id, { priority: v as TaskPriority })}
                options={priorityOptions}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Assignee</Label>
              <Select
                value={task.assigneeId ?? ''}
                onChange={handleAssigneeChange}
                options={memberOptions}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Story Points</Label>
              <Input
                type="number"
                value={task.storyPoints}
                onChange={(e) => updateTask(task.id, { storyPoints: parseInt(e.target.value, 10) || 0 })}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Due Date</Label>
              <Input
                type="date"
                value={task.dueDate ?? ''}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
                className="h-9"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="Add a description..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="git">
            <TabsList className="mb-4">
              <TabsTrigger value="git">
                <span className="flex items-center gap-1.5">
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                  Git ({task.linkedPRs.length + task.linkedCommits.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="time">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Time ({totalHours}h)
                </span>
              </TabsTrigger>
              <TabsTrigger value="activity">
                Activity ({task.activityFeed.length})
              </TabsTrigger>
            </TabsList>

            {/* Git Tab */}
            <TabsContent value="git" className="space-y-4">
              {/* PRs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pull Requests</h3>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowPrForm((v) => !v)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Link PR
                  </Button>
                </div>

                {showPrForm && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 mb-3 border border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="PR Number" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} className="h-8 text-sm" />
                      <Input placeholder="Branch name" value={prBranch} onChange={(e) => setPrBranch(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <Input placeholder="PR Title" value={prTitle} onChange={(e) => setPrTitle(e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="PR URL (optional)" value={prUrl} onChange={(e) => setPrUrl(e.target.value)} className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={handleLinkPR}>Link PR</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowPrForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {task.linkedPRs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No linked pull requests.</p>
                ) : (
                  <div className="space-y-2">
                    {task.linkedPRs.map((pr) => (
                      <div key={pr.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20">
                        <SplitSquareVertical className="h-4 w-4 flex-shrink-0" style={{ color: prStatusConfig[pr.status]?.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pr.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            #{pr.number} · {pr.branch} · {pr.author}
                          </p>
                        </div>
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0"
                          style={{
                            background: `${prStatusConfig[pr.status]?.color}18`,
                            color: prStatusConfig[pr.status]?.color,
                          }}
                        >
                          {pr.status}
                        </span>
                        {pr.url && (
                          <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {pr.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs flex-shrink-0"
                            onClick={() => handleMergePR(pr.id)}
                          >
                            <Timer className="h-3 w-3 mr-1" />
                            Merge
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Commits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commits</h3>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowCommitForm((v) => !v)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Link Commit
                  </Button>
                </div>

                {showCommitForm && (
                  <div className="bg-muted/40 rounded-lg p-3 space-y-2 mb-3 border border-border">
                    <Input placeholder="Commit SHA" value={commitSha} onChange={(e) => setCommitSha(e.target.value)} className="h-8 text-sm font-mono" />
                    <Input placeholder="Commit message" value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="Commit URL (optional)" value={commitUrl} onChange={(e) => setCommitUrl(e.target.value)} className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={handleLinkCommit}>Link Commit</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCommitForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {task.linkedCommits.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No linked commits.</p>
                ) : (
                  <div className="space-y-1.5">
                    {task.linkedCommits.map((commit) => (
                      <div key={commit.id} className="flex items-start gap-2 p-2 rounded border border-border bg-muted/20">
                        <MicOff className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{commit.message}</p>
                          <p className="text-xs text-muted-foreground font-mono">{commit.sha.slice(0, 8)} · {commit.author}</p>
                        </div>
                        {commit.url && (
                          <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Time Tab */}
            <TabsContent value="time" className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{totalHours}h logged</p>
                  <p className="text-xs text-muted-foreground">
                    {task.timeEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0)}h billable
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowTimeForm((v) => !v)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Log time
                </Button>
              </div>

              {showTimeForm && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-2 border border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Hours (e.g. 1.5)" type="number" step="0.25" value={timeHours} onChange={(e) => setTimeHours(e.target.value)} className="h-8 text-sm" />
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={timeBillable} onChange={(e) => setTimeBillable(e.target.checked)} className="rounded" />
                      Billable
                    </label>
                  </div>
                  <Input placeholder="Description" value={timeDesc} onChange={(e) => setTimeDesc(e.target.value)} className="h-8 text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={handleAddTime}>Add</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowTimeForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {task.timeEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No time logged yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {task.timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{entry.date} · {entry.billable ? 'Billable' : 'Non-billable'}</p>
                      </div>
                      <span className="text-sm font-mono font-medium">{entry.hours}h</span>
                      <button
                        type="button"
                        onClick={() => deleteTimeEntry(task.id, entry.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-2">
              {task.activityFeed.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...task.activityFeed].reverse().map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5">
                      <div className="mt-0.5 w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        {activityTypeIcons[item.type] ?? <User className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{item.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.userName} · {new Date(item.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
