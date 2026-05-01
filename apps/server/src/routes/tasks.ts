import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

interface PullRequest {
  [key: string]: unknown;
}

interface Commit {
  [key: string]: unknown;
}

interface TimeEntry {
  [key: string]: unknown;
}

interface ActivityItem {
  [key: string]: unknown;
}

interface TaskBody {
  projectId?: string;
  sprintId?: string | null;
  title?: string;
  description?: string;
  status?: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string | null;
  reporterId?: string;
  storyPoints?: number;
  labels?: string[];
  dueDate?: string | null;
  linkedPRs?: PullRequest[];
  linkedCommits?: Commit[];
  timeEntries?: TimeEntry[];
  activityFeed?: ActivityItem[];
  createdAt?: Date;
}

// list
router.get('/', async (req, res) => {
  try {
    const tasks = await db.collection('tasks').find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create
router.post('/', async (req, res) => {
  try {
    const body = req.body as TaskBody;

    if (!body.projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }
    if (!body.title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    if (!body.description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }
    if (!body.status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }
    if (!body.priority) {
      res.status(400).json({ error: 'priority is required' });
      return;
    }
    if (!body.reporterId) {
      res.status(400).json({ error: 'reporterId is required' });
      return;
    }
    if (body.storyPoints === undefined || body.storyPoints === null) {
      res.status(400).json({ error: 'storyPoints is required' });
      return;
    }
    if (!body.labels) {
      res.status(400).json({ error: 'labels is required' });
      return;
    }
    if (!body.linkedPRs) {
      res.status(400).json({ error: 'linkedPRs is required' });
      return;
    }
    if (!body.linkedCommits) {
      res.status(400).json({ error: 'linkedCommits is required' });
      return;
    }
    if (!body.timeEntries) {
      res.status(400).json({ error: 'timeEntries is required' });
      return;
    }
    if (!body.activityFeed) {
      res.status(400).json({ error: 'activityFeed is required' });
      return;
    }

    const doc: Record<string, unknown> = {
      projectId: body.projectId,
      sprintId: body.sprintId ?? null,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assigneeId: body.assigneeId ?? null,
      reporterId: body.reporterId,
      storyPoints: Number(body.storyPoints),
      labels: body.labels,
      dueDate: body.dueDate ?? null,
      linkedPRs: body.linkedPRs,
      linkedCommits: body.linkedCommits,
      timeEntries: body.timeEntries,
      activityFeed: body.activityFeed,
      createdAt: body.createdAt ? new Date(String(body.createdAt)) : new Date(),
    };

    const id = await db.collection('tasks').insertOne(doc);
    const created = await db.collection('tasks').findById(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as TaskBody;

    const existing = await db.collection('tasks').findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const update: Record<string, unknown> = {};
    if (body.projectId !== undefined) update.projectId = body.projectId;
    if (body.sprintId !== undefined) update.sprintId = body.sprintId;
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.status !== undefined) update.status = body.status;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.assigneeId !== undefined) update.assigneeId = body.assigneeId;
    if (body.reporterId !== undefined) update.reporterId = body.reporterId;
    if (body.storyPoints !== undefined) update.storyPoints = Number(body.storyPoints);
    if (body.labels !== undefined) update.labels = body.labels;
    if (body.dueDate !== undefined) update.dueDate = body.dueDate;
    if (body.linkedPRs !== undefined) update.linkedPRs = body.linkedPRs;
    if (body.linkedCommits !== undefined) update.linkedCommits = body.linkedCommits;
    if (body.timeEntries !== undefined) update.timeEntries = body.timeEntries;
    if (body.activityFeed !== undefined) update.activityFeed = body.activityFeed;
    if (body.createdAt !== undefined) update.createdAt = new Date(String(body.createdAt));

    const success = await db.collection('tasks').updateOne(id, update);
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const updated = await db.collection('tasks').findById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.collection('tasks').findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const success = await db.collection('tasks').deleteOne(id);
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;