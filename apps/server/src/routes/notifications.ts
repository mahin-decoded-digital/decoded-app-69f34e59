import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await db.collection('notifications').find();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body as {
      userId?: string;
      type?: 'task_assigned' | 'status_changed' | 'pr_merged' | 'comment_added' | 'sprint_started' | 'sprint_completed';
      title?: string;
      message?: string;
      read?: boolean;
      taskId?: string;
      createdAt?: Date;
    };

    if (!body.userId || !body.type || !body.title || !body.message || body.read === undefined || !body.createdAt) {
      res.status(400).json({ error: 'Missing required fields: userId, type, title, message, read, createdAt' });
      return;
    }

    const doc = {
      userId: body.userId,
      type: body.type,
      title: body.title,
      message: body.message,
      read: body.read,
      taskId: body.taskId,
      createdAt: new Date(String(body.createdAt)),
    };

    const id = await db.collection('notifications').insertOne(doc);
    const created = await db.collection('notifications').findById(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as {
      userId?: string;
      type?: 'task_assigned' | 'status_changed' | 'pr_merged' | 'comment_added' | 'sprint_started' | 'sprint_completed';
      title?: string;
      message?: string;
      read?: boolean;
      taskId?: string;
      createdAt?: Date;
    };

    const existing = await db.collection('notifications').findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const update: Record<string, unknown> = {};
    if (body.userId !== undefined) update.userId = body.userId;
    if (body.type !== undefined) update.type = body.type;
    if (body.title !== undefined) update.title = body.title;
    if (body.message !== undefined) update.message = body.message;
    if (body.read !== undefined) update.read = body.read;
    if (body.taskId !== undefined) update.taskId = body.taskId;
    if (body.createdAt !== undefined) update.createdAt = new Date(String(body.createdAt));

    const success = await db.collection('notifications').updateOne(id, update);
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const updated = await db.collection('notifications').findById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.collection('notifications').findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const success = await db.collection('notifications').deleteOne(id);
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;