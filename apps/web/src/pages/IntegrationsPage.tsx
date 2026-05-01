import { useState, useMemo } from 'react';
import {AlignRight, SplitSquareVertical, MicOff, ExternalLink, Plus, Search, X} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';

const prStatusConfig: Record<string, { color: string; label: string }> = {
  open: { color: 'var(--pr-open)', label: 'Open' },
  merged: { color: 'var(--pr-merged)', label: 'Merged' },
  closed: { color: 'var(--pr-closed)', label: 'Closed' },
  draft: { color: 'var(--pr-draft)', label: 'Draft' },
};

export default function IntegrationsPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const updateProject = useProjectStore((s) => s.updateProject);

  const [search, setSearch] = useState('');

  const allPRs = useMemo(
    () =>
      tasks.flatMap((task) =>
        task.linkedPRs.map((pr) => ({ ...pr, taskTitle: task.title, taskId: task.id }))
      ),
    [tasks]
  );

  const allCommits = useMemo(
    () =>
      tasks.flatMap((task) =>
        task.linkedCommits.map((c) => ({ ...c, taskTitle: task.title, taskId: task.id }))
      ),
    [tasks]
  );

  const filteredPRs = useMemo(() => {
    if (!search) return allPRs;
    const q = search.toLowerCase();
    return allPRs.filter(
      (pr) =>
        pr.title.toLowerCase().includes(q) ||
        pr.branch.toLowerCase().includes(q) ||
        pr.taskTitle.toLowerCase().includes(q)
    );
  }, [allPRs, search]);

  const filteredCommits = useMemo(() => {
    if (!search) return allCommits;
    const q = search.toLowerCase();
    return allCommits.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.sha.toLowerCase().includes(q) ||
        c.taskTitle.toLowerCase().includes(q)
    );
  }, [allCommits, search]);

  const prStats = useMemo(() => {
    const open = allPRs.filter((pr) => pr.status === 'open').length;
    const merged = allPRs.filter((pr) => pr.status === 'merged').length;
    const draft = allPRs.filter((pr) => pr.status === 'draft').length;
    return { open, merged, draft };
  }, [allPRs]);

  return (
    <div>
      <PageHeader
        title="Git Integration"
        description="Pull Requests and commits linked across all tasks and projects."
      />

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open PRs', value: prStats.open, color: 'var(--pr-open)' },
            { label: 'Merged PRs', value: prStats.merged, color: 'var(--pr-merged)' },
            { label: 'Linked Commits', value: allCommits.length, color: 'var(--brand-steel)' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project repo links */}
        {projects.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Repository Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <AlignRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{project.name}</p>
                    {project.repoUrl ? (
                      <p className="text-xs text-muted-foreground font-mono truncate">{project.repoUrl}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No repository linked</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs flex-shrink-0">
                    {project.repoProvider}
                  </Badge>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* PRs + Commits */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Activity Feed</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-7 pl-8 text-xs w-40"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="prs">
              <TabsList className="mb-4">
                <TabsTrigger value="prs">
                  Pull Requests ({filteredPRs.length})
                </TabsTrigger>
                <TabsTrigger value="commits">
                  Commits ({filteredCommits.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prs">
                {filteredPRs.length === 0 ? (
                  <div className="py-10 text-center">
                    <SplitSquareVertical className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No pull requests linked</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Open a task on the Kanban board and link a PR to see it here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPRs.map((pr) => (
                      <div key={pr.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 transition-colors">
                        <SplitSquareVertical
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: prStatusConfig[pr.status]?.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pr.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            #{pr.number} · {pr.branch} · from: {pr.taskTitle}
                          </p>
                        </div>
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0 capitalize"
                          style={{
                            background: `${prStatusConfig[pr.status]?.color}18`,
                            color: prStatusConfig[pr.status]?.color,
                          }}
                        >
                          {pr.status}
                        </span>
                        {pr.url && (
                          <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="commits">
                {filteredCommits.length === 0 ? (
                  <div className="py-10 text-center">
                    <MicOff className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No commits linked</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Link commits to tasks to track your code changes here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCommits.map((commit) => (
                      <div key={commit.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/30 transition-colors">
                        <MicOff className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{commit.message}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {commit.sha.slice(0, 8)} · {commit.author} · {commit.taskTitle}
                          </p>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
