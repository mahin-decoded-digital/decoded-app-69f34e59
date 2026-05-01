import { useMemo, useState } from 'react';
import { Clock, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

// ─── Inline bar chart components (no external charting lib) ───────────────────

interface HBarDatum {
  label: string;
  value: number;
}

function VerticalBarChart({ data }: { data: HBarDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full h-48 flex items-end gap-1 pt-2">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div
            key={d.label}
            className="flex flex-col items-center flex-1 min-w-0 group"
          >
            <span className="text-[10px] font-mono text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {d.value}h
            </span>
            <div
              className="w-full rounded-t-sm transition-all duration-300"
              style={{
                height: `${Math.max(pct, 2)}%`,
                background: 'var(--brand-blue)',
                minHeight: '4px',
              }}
            />
            <span
              className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center"
              title={d.label}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ data }: { data: HBarDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full flex flex-col gap-2 py-2">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="flex items-center gap-2">
            <span
              className="text-[10px] text-muted-foreground truncate w-28 shrink-0 text-right"
              title={d.label}
            >
              {d.label.slice(0, 18)}
            </span>
            <div className="flex-1 bg-muted/40 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: 'var(--status-in-review)',
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">
              {d.value}h
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimeTrackingPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const users = useAuthStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.currentUser);
  const projects = useProjectStore((s) => s.projects);

  const [filterUser, setFilterUser] = useState(currentUser?.id ?? '');
  const [filterBillable, setFilterBillable] = useState('all');

  const userOptions = useMemo(
    () => [
      { value: '', label: 'All members' },
      ...users.map((u) => ({ value: u.id, label: u.name })),
    ],
    [users]
  );

  const billableOptions = [
    { value: 'all', label: 'All' },
    { value: 'billable', label: 'Billable only' },
    { value: 'nonbillable', label: 'Non-billable only' },
  ];

  const allEntries = useMemo(
    () =>
      tasks.flatMap((task) =>
        (task.timeEntries ?? []).map((entry) => ({
          ...entry,
          taskTitle: task.title,
          taskId: task.id,
          projectId: task.projectId,
        }))
      ),
    [tasks]
  );

  const filteredEntries = useMemo(() => {
    let result = allEntries;
    if (filterUser) result = result.filter((e) => e.userId === filterUser);
    if (filterBillable === 'billable') result = result.filter((e) => e.billable);
    if (filterBillable === 'nonbillable') result = result.filter((e) => !e.billable);
    return result;
  }, [allEntries, filterUser, filterBillable]);

  const totalHours = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.hours, 0),
    [filteredEntries]
  );

  const billableHours = useMemo(
    () =>
      filteredEntries
        .filter((e) => e.billable)
        .reduce((sum, e) => sum + e.hours, 0),
    [filteredEntries]
  );

  const billabilityRate =
    totalHours > 0 ? `${Math.round((billableHours / totalHours) * 100)}%` : '—';

  const byDateData: HBarDatum[] = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredEntries) {
      map[e.date] = (map[e.date] ?? 0) + e.hours;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, hours]) => ({
        label: new Date(date).toLocaleDateString('en', {
          month: 'short',
          day: 'numeric',
        }),
        value: Math.round(hours * 10) / 10,
      }));
  }, [filteredEntries]);

  const byTaskData: HBarDatum[] = useMemo(() => {
    const map: Record<string, { hours: number; title: string }> = {};
    for (const e of filteredEntries) {
      if (!map[e.taskId]) map[e.taskId] = { hours: 0, title: e.taskTitle };
      map[e.taskId].hours += e.hours;
    }
    return Object.entries(map)
      .map(([, v]) => ({ label: v.title, value: Math.round(v.hours * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredEntries]);

  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name ?? userId;

  void projects;

  return (
    <div>
      <PageHeader
        title="Time Tracking"
        description="Log and review billable hours across tickets and projects."
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterUser}
              onChange={setFilterUser}
              options={userOptions}
              className="w-40"
            />
            <Select
              value={filterBillable}
              onChange={setFilterBillable}
              options={billableOptions}
              className="w-40"
            />
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total Hours',
              value: `${totalHours}h`,
              color: 'var(--brand-blue)',
            },
            {
              label: 'Billable Hours',
              value: `${billableHours}h`,
              color: 'var(--status-done)',
            },
            {
              label: 'Billability Rate',
              value: billabilityRate,
              color: 'var(--priority-high)',
            },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Hours by Day (last 14 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {byDateData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  No time entries to display.
                </div>
              ) : (
                <VerticalBarChart data={byDateData} />
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Hours by Task (top 8)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {byTaskData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  No time entries to display.
                </div>
              ) : (
                <HorizontalBarChart data={byTaskData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Entries table */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No time logged yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Open a task on the Kanban board to start logging billable hours
                  against it.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">
                        Task
                      </th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">
                        Member
                      </th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">
                        Hours
                      </th>
                      <th className="text-left pb-2 text-xs font-medium text-muted-foreground">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-2 pr-4 font-medium truncate max-w-[180px] text-xs">
                          {entry.taskTitle}
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground truncate max-w-[200px]">
                          {entry.description}
                        </td>
                        <td className="py-2 pr-4 text-xs">
                          {getUserName(entry.userId)}
                        </td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground font-mono">
                          {entry.date}
                        </td>
                        <td className="py-2 pr-4 font-mono text-sm font-semibold">
                          {entry.hours}h
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={entry.billable ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {entry.billable ? 'Billable' : 'Non-billable'}
                          </Badge>
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