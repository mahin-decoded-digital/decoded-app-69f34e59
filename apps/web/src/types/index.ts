export type UserRole = 'admin' | 'pm' | 'developer' | 'stakeholder';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type PRStatus = 'open' | 'merged' | 'closed' | 'draft';
export type NotificationType = 'task_assigned' | 'status_changed' | 'pr_merged' | 'comment_added' | 'sprint_started' | 'sprint_completed';

export interface User {
  id: string;
  createdAt: Date;
  email: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
}

export interface Project {
  id: string;
  createdAt: Date;
  name: string;
  description: string;
  ownerId: string;
  repoUrl: string;
  repoProvider: 'github' | 'gitlab' | 'none';
  memberIds: string[];
  color: string;
}

export interface Sprint {
  id: string;
  createdAt: Date;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  status: 'planning' | 'active' | 'completed';
  velocity: number;
  committedPoints: number;
  completedPoints: number;
}

export interface Commit {
  id: string;
  createdAt: Date;
  sha: string;
  message: string;
  author: string;
  url: string;
  taskId: string;
}

export interface PullRequest {
  id: string;
  createdAt: Date;
  number: number;
  title: string;
  url: string;
  status: PRStatus;
  author: string;
  taskId: string;
  branch: string;
}

export interface TimeEntry {
  id: string;
  createdAt: Date;
  taskId: string;
  userId: string;
  description: string;
  hours: number;
  billable: boolean;
  date: string;
}

export interface ActivityItem {
  id: string;
  createdAt: Date;
  taskId: string;
  userId: string;
  userName: string;
  type: 'status_change' | 'comment' | 'pr_linked' | 'commit_linked' | 'assigned' | 'time_logged';
  content: string;
  metadata?: Record<string, string>;
}

export interface Task {
  id: string;
  createdAt: Date;
  projectId: string;
  sprintId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  reporterId: string;
  storyPoints: number;
  labels: string[];
  dueDate: string | null;
  linkedPRs: PullRequest[];
  linkedCommits: Commit[];
  timeEntries: TimeEntry[];
  activityFeed: ActivityItem[];
}

export interface Notification {
  id: string;
  createdAt: Date;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
}

export interface BurndownDataPoint {
  day: string;
  remaining: number;
  ideal: number;
}

export interface VelocityDataPoint {
  sprint: string;
  committed: number;
  completed: number;
}
