import { useState, useMemo, useEffect } from 'react'
import { Plus, Zap, Play, Check, Trash, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { useSprintStore } from '@/stores/sprintStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import type { BurndownDataPoint, VelocityDataPoint } from '@/types';

// ─── Custom chart components (no recharts) ────────────────────────────────────

interface LineChartProps {
  data: BurndownDataPoint[];
  width?: number;
  height?: number;
}

function BurndownLineChart({ data, height = 220 }: LineChartProps) {
  if (data.length === 0) return null;

  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const w = 480;
  const h = height;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.remaining, d.ideal)), 1);

  const toX = (i: number) => padLeft + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => padTop + innerH - (v / maxVal) * innerH;

  const remainingPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.remaining).toFixed(1)}`)
    .join(' ');

  const idealPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.ideal).toFixed(1)}`)
    .join(' ');

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxVal));
  // X axis: show first, middle, last
  const xIndexes = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <line
          key={tick}
          x1={padLeft}
          x2={w - padRight}
          y1={toY(tick)}
          y2={toY(tick)}
          stroke="var(--kanban-col-border)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      ))}

      {/* Y axis labels */}
      {yTicks.map((tick) => (
        <text
          key={tick}
          x={padLeft - 4}
          y={toY(tick) + 4}
          textAnchor="end"
          fontSize={9}
          fill="var(--muted-foreground, #888)"
        >
          {tick}
        </text>
      ))}

      {/* X axis labels */}
      {xIndexes.map((idx) => (
        <text
          key={idx}
          x={toX(idx)}
          y={h - 4}
          textAnchor="middle"
          fontSize={9}
          fill="var(--muted-foreground, #888)"
        >
          {data[idx].day}
        </text>
      ))}

      {/* Ideal line (dashed) */}
      <path
        d={idealPath}
        fill="none"
        stroke="var(--status-in-review)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />

      {/* Remaining line */}
      <path
        d={remainingPath}
        fill="none"
        stroke="var(--brand-blue)"
        strokeWidth={2}
      />

      {/* Legend */}
      <rect x={padLeft} y={padTop} width={10} height={2} fill="var(--brand-blue)" />
      <text x={padLeft + 14} y={padTop + 4} fontSize={9} fill="var(--muted-foreground, #888)">
        Remaining
      </text>
      <line
        x1={padLeft + 72}
        x2={padLeft + 82}
        y1={padTop + 1}
        y2={padTop + 1}
        stroke="var(--status-in-review)"
        strokeDasharray="4 3"
        strokeWidth={1.5}
      />
      <text x={padLeft + 86} y={padTop + 4} fontSize={9} fill="var(--muted-foreground, #888)">
        Ideal
      </text>
    </svg>
  );
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
  height?: number;
}

function VelocityBarChart({ data, height = 220 }: VelocityChartProps) {
  if (data.length === 0) return null;

  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const w = 480;
  const h = height;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.committed, d.completed]), 1);
  const groupW = innerW / data.length;
  const barW = Math.max(4, (groupW * 0.35));
  const gap = barW * 0.4;

  const toY = (v: number) => padTop + innerH - (v / maxVal) * innerH;
  const toH = (v: number) => (v / maxVal) * innerH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxVal));

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <line
          key={tick}
          x1={padLeft}
          x2={w - padRight}
          y1={toY(tick)}
          y2={toY(tick)}
          stroke="var(--kanban-col-border)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      ))}

      {/* Y axis labels */}
      {yTicks.map((tick) => (
        <text
          key={tick}
          x={padLeft - 4}
          y={toY(tick) + 4}
          textAnchor="end"
          fontSize={9}
          fill="var(--muted-foreground, #888)"
        >
          {tick}
        </text>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const cx = padLeft + i * groupW + groupW / 2;
        const x1 = cx - gap / 2 - barW;
        const x2 = cx + gap / 2;
        return (
          <g key={d.sprint}>
            {/* committed */}
            <rect
              x={x1}
              y={toY(d.committed)}
              width={barW}
              height={Math.max(2, toH(d.committed))}
              rx={2}
              fill="var(--kanban-col-border)"
            />
            {/* completed */}
            <rect
              x={x2}
              y={toY(d.completed)}
              width={barW}
              height={Math.max(2, toH(d.completed))}
              rx={2}
              fill="var(--brand-blue)"
            />
            {/* X label */}
            <text
              x={cx}
              y={h - 4}
              textAnchor="middle"
              fontSize={9}
              fill="var(--muted-foreground, #888)"
            >
              {d.sprint}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <rect x={padLeft} y={padTop} width={10} height={8} rx={1} fill="var(--kanban-col-border)" />
      <text x={padLeft + 14} y={padTop + 7} fontSize={9} fill="var(--muted-foreground, #888)">
        Committed
      </text>
      <rect x={padLeft + 70} y={padTop} width={10} height={8} rx={1} fill="var(--brand-blue)" />
      <text x={padLeft + 84} y={padTop + 7} fontSize={9} fill="var(--muted-foreground, #888)">
        Completed
      </text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SprintsPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchSprints = useSprintStore((s) => s.fetchSprints);
  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);
  // === end auto fetch-on-mount ===

  const sprints = useSprintStore((s) => s.sprints);
  const addSprint = useSprintStore((s) => s.addSprint);
  const startSprint = useSprintStore((s) => s.startSprint);
  const completeSprint = useSprintStore((s) => s.completeSprint);
  const deleteSprint = useSprintStore((s) => s.deleteSprint);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    goal: '',
    committedPoints: '0',
    projectId: '',
  });

  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === 'active') ?? null,
    [sprints]
  );

  const selectedSprint = useMemo(
    () =>
      selectedSprintId
        ? sprints.find((s) => s.id === selectedSprintId) ?? null
        : activeSprint,
    [selectedSprintId, sprints, activeSprint]
  );

  const displayedSprint = selectedSprint ?? activeSprint;

  const velocityData: VelocityDataPoint[] = useMemo(() => {
    return sprints
      .filter((s) => s.status === 'completed' || s.status === 'active')
      .slice(-6)
      .map((sprint) => {
        const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
        const completed = sprintTasks
          .filter((t) => t.status === 'done')
          .reduce((sum, t) => sum + t.storyPoints, 0);
        return {
          sprint: sprint.name.slice(0, 12),
          committed:
            sprint.committedPoints ||
            sprintTasks.reduce((s, t) => s + t.storyPoints, 0),
          completed,
        };
      });
  }, [sprints, tasks]);

  const burndownData: BurndownDataPoint[] = useMemo(() => {
    if (!displayedSprint) return [];
    const sprintTasks = tasks.filter((t) => t.sprintId === displayedSprint.id);
    const totalPoints = sprintTasks.reduce((s, t) => s + t.storyPoints, 0);
    const start = new Date(displayedSprint.startDate);
    const end = new Date(displayedSprint.endDate);
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000)
    );
    const points: BurndownDataPoint[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const label = d.toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
      });
      const ideal = Math.round(totalPoints * (1 - i / totalDays));
      const remaining =
        i === 0
          ? totalPoints
          : Math.max(
              0,
              Math.round(totalPoints * (1 - (i / totalDays) * 0.7))
            );
      points.push({ day: label, remaining, ideal });
    }
    return points;
  }, [displayedSprint, tasks]);

  const handleCreate = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    addSprint({
      projectId: form.projectId || projects[0]?.id || 'default',
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      goal: form.goal,
      status: 'planning',
      velocity: 0,
      committedPoints: parseInt(form.committedPoints, 10) || 0,
      completedPoints: 0,
    });
    setDialogOpen(false);
    setForm({
      name: '',
      startDate: '',
      endDate: '',
      goal: '',
      committedPoints: '0',
      projectId: '',
    });
  };

  const statusColors: Record<string, string> = {
    planning: 'var(--status-todo)',
    active: 'var(--status-in-progress)',
    completed: 'var(--status-done)',
  };

  return (
    <div>
      <PageHeader
        title="Sprint Planning"
        description="Track velocity, manage sprints, and visualize burn-down progress."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Sprint
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {sprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <h2 className="text-base font-semibold mb-2">No sprints planned yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Sprint planning begins here. Create your first sprint to start tracking velocity,
              assigning tasks, and visualizing your burn-down rate.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Plan first sprint
            </Button>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Burn-down */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    Burn-Down Chart
                    {displayedSprint && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {displayedSprint.name}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {burndownData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                      Select an active sprint to view burn-down data.
                    </div>
                  ) : (
                    <BurndownLineChart data={burndownData} height={220} />
                  )}
                </CardContent>
              </Card>

              {/* Velocity */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Team Velocity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {velocityData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                      Complete sprints to see velocity trends.
                    </div>
                  ) : (
                    <VelocityBarChart data={velocityData} height={220} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sprint list */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">All Sprints</h2>
              {sprints.map((sprint) => {
                const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
                const doneTasks = sprintTasks.filter((t) => t.status === 'done');
                const pct =
                  sprintTasks.length > 0
                    ? (doneTasks.length / sprintTasks.length) * 100
                    : 0;
                const totalPts = sprintTasks.reduce((s, t) => s + t.storyPoints, 0);
                const donePts = doneTasks.reduce((s, t) => s + t.storyPoints, 0);

                return (
                  <Card
                    key={sprint.id}
                    className={`border-border cursor-pointer transition-all hover:ring-1 hover:ring-primary/30 ${
                      selectedSprintId === sprint.id ? 'ring-1 ring-primary' : ''
                    }`}
                    onClick={() =>
                      setSelectedSprintId((id) =>
                        id === sprint.id ? null : sprint.id
                      )
                    }
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: statusColors[sprint.status] }}
                            />
                            <p className="text-sm font-medium">{sprint.name}</p>
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                              style={{
                                background: `${statusColors[sprint.status]}18`,
                                color: statusColors[sprint.status],
                              }}
                            >
                              {sprint.status}
                            </Badge>
                          </div>
                          {sprint.goal && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {sprint.goal}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>
                              {sprint.startDate} → {sprint.endDate}
                            </span>
                            <span>
                              {donePts}/{totalPts} pts
                            </span>
                            <span>{sprintTasks.length} tasks</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {sprint.status === 'planning' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                startSprint(sprint.id);
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {sprint.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                completeSprint(sprint.id);
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSprint(sprint.id);
                            }}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create sprint dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plan New Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="sprint-name">Sprint Name *</Label>
              <Input
                id="sprint-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Sprint 1"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="sprint-goal">Sprint Goal</Label>
              <Input
                id="sprint-goal"
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                placeholder="What will you deliver?"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sprint-start">Start Date *</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sprint-end">End Date *</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="committed-pts">Committed Story Points</Label>
              <Input
                id="committed-pts"
                type="number"
                min={0}
                value={form.committedPoints}
                onChange={(e) =>
                  setForm((f) => ({ ...f, committedPoints: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.startDate || !form.endDate}
            >
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}