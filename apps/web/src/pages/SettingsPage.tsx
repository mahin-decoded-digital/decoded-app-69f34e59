import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, FolderOpen, Shield, Bell, Plus, Trash, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { UserRole } from '@/types';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'team', label: 'Team & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const roleOptions = [
  { value: 'developer', label: 'Developer' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'stakeholder', label: 'Stakeholder' },
];

const repoProviderOptions = [
  { value: 'none', label: 'None' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
];

const projectColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#14b8a6', '#f59e0b', '#ef4444'];

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full access to all features, settings, and team management.',
  pm: 'Can manage projects, sprints, and assign tasks to developers.',
  developer: 'Can view and update tasks, log time, and link Git activity.',
  stakeholder: 'Read-only access to project status and reports.',
};

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'profile';

  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const projects = useProjectStore((s) => s.projects);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [profileName, setProfileName] = useState(currentUser?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Project dialog
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    repoUrl: '',
    repoProvider: 'none' as 'github' | 'gitlab' | 'none',
    color: projectColors[0],
  });

  const handleSaveProfile = () => {
    updateProfile({ name: profileName, email: profileEmail });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const openNewProject = () => {
    setEditProjectId(null);
    setProjectForm({ name: '', description: '', repoUrl: '', repoProvider: 'none', color: projectColors[0] });
    setProjectDialogOpen(true);
  };

  const openEditProject = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;
    setEditProjectId(projId);
    setProjectForm({
      name: proj.name,
      description: proj.description,
      repoUrl: proj.repoUrl,
      repoProvider: proj.repoProvider,
      color: proj.color,
    });
    setProjectDialogOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectForm.name.trim()) return;
    if (editProjectId) {
      updateProject(editProjectId, projectForm);
    } else {
      addProject({
        ...projectForm,
        ownerId: currentUser?.id ?? '',
        memberIds: [currentUser?.id ?? ''],
      });
    }
    setProjectDialogOpen(false);
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your workspace, projects, team, and notifications." />

      <div className="flex gap-0">
        {/* Sidebar nav */}
        <nav
          className="w-48 flex-shrink-0 border-r p-4 space-y-1"
          style={{ borderColor: 'var(--topbar-border)', minHeight: 'calc(100vh - 80px)' }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 p-6 max-w-2xl">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold mb-4">Profile</h2>
                <Card className="border-border">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar initials={currentUser?.avatarInitials ?? '??'} size="lg" />
                      <div>
                        <p className="font-semibold">{currentUser?.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{currentUser?.role}</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="p-name">Display Name</Label>
                      <Input
                        id="p-name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="p-email">Email</Label>
                      <Input
                        id="p-email"
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      {profileSaved ? 'Saved!' : 'Save changes'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Projects</h2>
                <Button size="sm" onClick={openNewProject}>
                  <Plus className="h-4 w-4 mr-1" />
                  New project
                </Button>
              </div>
              {projects.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-10 text-center">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No projects yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Projects are the top-level containers for sprints, tasks, and repositories.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={openNewProject}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create first project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <Card key={proj.id} className="border-border">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: proj.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{proj.name}</p>
                            {proj.description && (
                              <p className="text-xs text-muted-foreground truncate">{proj.description}</p>
                            )}
                            {proj.repoUrl && (
                              <p className="text-xs font-mono text-muted-foreground truncate">{proj.repoUrl}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
                            {proj.repoProvider}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEditProject(proj.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteProject(proj.id)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Team & Permissions</h2>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Role Definitions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Object.entries(roleDescriptions) as [UserRole, string][]).map(([role, desc]) => (
                    <div key={role} className="flex items-start gap-3">
                      <Badge variant="secondary" className="capitalize text-xs flex-shrink-0 mt-0.5">
                        {role}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Team Members ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No team members registered yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <Avatar initials={user.avatarInitials} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {user.role}
                          </Badge>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-muted-foreground">(you)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Notification Preferences</h2>
              <Card className="border-border">
                <CardContent className="pt-5 space-y-4">
                  {[
                    { label: 'Task assignments', desc: 'When you are assigned to a task' },
                    { label: 'Status changes', desc: 'When task status changes' },
                    { label: 'PR events', desc: 'When a linked PR is merged or closed' },
                    { label: 'Sprint updates', desc: 'When a sprint starts or completes' },
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{pref.label}</p>
                        <p className="text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-background rounded-full transition-all peer-checked:translate-x-4" />
                      </label>
                    </div>
                  ))}
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    In-app notifications are always enabled. Email and Slack integrations are configured at the workspace level.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Project dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editProjectId ? 'Edit Project' : 'Create Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Project Name *</Label>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="My Project"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={projectForm.description}
                onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What is this project about?"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Repository Provider</Label>
                <Select
                  value={projectForm.repoProvider}
                  onChange={(v) => setProjectForm((f) => ({ ...f, repoProvider: v as 'github' | 'gitlab' | 'none' }))}
                  options={repoProviderOptions}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {projectColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProjectForm((f) => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${projectForm.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Repository URL</Label>
              <Input
                value={projectForm.repoUrl}
                onChange={(e) => setProjectForm((f) => ({ ...f, repoUrl: e.target.value }))}
                placeholder="https://github.com/org/repo"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveProject} disabled={!projectForm.name.trim()}>
              {editProjectId ? 'Save changes' : 'Create project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
