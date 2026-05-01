import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {Ban, Zap, Clock, SplitSquareVertical, Plus, ArrowRight, CheckCircle2, AlertCircle} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSprintStore } from '@/stores/sprintStore';

export default function DashboardPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const sprints = useSprintStore((s) => s.sprints);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === currentUser?.id),
    [tasks, currentUser?.id]
  );

  const inProgressTasks = useMemo(
    () => myTasks.filter((t) => t.status === 'in_progress'),
    [myTasks]
  );

  const activeSprints = useMemo(
    () => sprints.filter((s) => s.status === 'active'),
    [sprints]
  );

  const openPRs = useMemo(
    () => tasks.flatMap((t) => t.linkedPRs).filter((pr) => pr.status === 'open'),
    [tasks]
  );

  const totalHoursThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString().split('T')[0];
    return tasks
      .flatMap((t) => t.timeEntries)
      .filter((e) => e.userId === currentUser?.id && e.date >= weekStr)
      .reduce((sum, e) => sum + e.hours, 0);
  }, [tasks, currentUser?.id]);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [tasks]
  );

  const statusColorMap: Record<string, string> = {
    backlog: 'var(--status-backlog)',
    todo: 'var(--status-todo)',
    in_progress: 'var(--status-in-progress)',
    in_review: 'var(--status-in-review)',
    done: 'var(--status-done)',
  };

  const stats = [
    {
      title: 'My Open Tasks',
      value: myTasks.filter((t) => t.status !== 'done').length,
      sub: `${inProgressTasks.length} in progress`,
      icon: Ban,
      color: 'var(--brand-blue)',
    },
    {
      title: 'Active Sprints',
      value: activeSprints.length,
      sub: `${sprints.filter((s) => s.status === 'planning').length} in planning`,
      icon: Zap,
      color: 'var(--priority-high)',
    },
    {
      title: 'Open PRs',
      value: openPRs.length,
      sub: 'Awaiting review/merge',
      icon: SplitSquareVertical,
      color: 'var(--pr-open)',
    },
    {
      title: 'Hours This Week',
      value: totalHoursThisWeek,
      sub: 'Logged across all tasks',
      icon: Clock,
      color: 'var(--status-done)',
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Good to have you back, ${currentUser?.name?.split(' ')[0] ?? 'there'}.`}
        description="Here's what's happening across your projects today."
        actions={
          <Link to="/kanban">
            <Button size="sm">
              <Ban className="h-4 w-4 mr-2" />
              Open Ban
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1 text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${stat.color}18` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Active sprints */}
          <div className="xl:col-span-2">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Active Sprints</CardTitle>
                  <Link to="/sprints">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View all <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activeSprints.length === 0 ? (
                  <div className="py-8 text-center">
                    <Zap className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No active sprints</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your team's sprint velocity and progress will appear here once a sprint is started.
                    </p>
                    <Link to="/sprints">
                      <Button variant="outline" size="sm" className="mt-3 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Start a Sprint
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSprints.map((sprint) => {
                      const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
                      const doneTasks = sprintTasks.filter((t) => t.status === 'done');
                      const pct = sprintTasks.length > 0 ? (doneTasks.length / sprintTasks.length) * 100 : 0;
                      const daysLeft = Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000));
                      return (
                        <div key={sprint.id} className="p-3 rounded-lg border border-border bg-muted/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{sprint.name}</p>
                            <span className="text-xs text-muted-foreground">{daysLeft}d left</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{sprint.goal}</p>
                          <Progress value={pct} className="h-1.5 mb-1" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{doneTasks.length}/{sprintTasks.length} tasks done</span>
                            <span>{Math.round(pct)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My tasks */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">My Tasks</CardTitle>
                <Link to="/kanban">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Board <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {myTasks.filter((t) => t.status !== 'done').length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
                  <p className="text-xs text-muted-foreground mt-1">Tasks assigned to you will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myTasks.filter((t) => t.status !== 'done').slice(0, 6).map((task) => (
                    <div key={task.id} className="flex items-start gap-2 py-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: statusColorMap[task.status] ?? 'var(--brand-steel)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {task.status.replace('_', ' ')} · {task.storyPoints}pt
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No tasks created yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a project, start a sprint, and add tasks to your Ban board to get started.
                </p>
                <Link to="/kanban">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add first task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Title</th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Priority</th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map((task) => (
                      <tr key={task.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 font-medium truncate max-w-xs">{task.title}</td>
                        <td className="py-2 pr-4">
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded-sm capitalize"
                            style={{
                              background: `${statusColorMap[task.status] ?? 'var(--brand-steel)'}18`,
                              color: statusColorMap[task.status] ?? 'var(--brand-steel)',
                            }}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">
                          {new Date(task.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
