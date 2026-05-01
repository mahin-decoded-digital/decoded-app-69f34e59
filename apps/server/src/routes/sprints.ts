import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

// list
router.get('/', async (req, res) => {
  try {
    const sprints = await db.collection('sprints').find();
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
});

// create
router.post('/', async (req, res) => {
  try {
    const body = req.body as {
      projectId?: string;
      name?: string;
      startDate?: string;
      endDate?: string;
      goal?: string;
      status?: 'planning' | 'active' | 'completed';
      velocity?: number;
      committedPoints?: number;
      completedPoints?: number;
      createdAt?: Date;
    };

    if (!body.projectId || !body.name || !body.startDate || !body.endDate || !body.goal || !body.status || body.velocity === undefined || body.committedPoints === undefined || body.completedPoints === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const doc = {
      projectId: String(body.projectId),
      name: String(body.name),
      startDate: String(body.startDate),
      endDate: String(body.endDate),
      goal: String(body.goal),
      status: body.status,
      velocity: Number(body.velocity),
      committedPoints: Number(body.committedPoints),
      completedPoints: Number(body.completedPoints),
      createdAt: body.createdAt ? new Date(String(body.createdAt)) : new Date(),
    };

    const id = await db.collection('sprints').insertOne(doc);
    const created = await db.collection('sprints').findById(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sprint' });
  }
});

// update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as {
      projectId?: string;
      name?: string;
      startDate?: string;
      endDate?: string;
      goal?: string;
      status?: 'planning' | 'active' | 'completed';
      velocity?: number;
      committedPoints?: number;
      completedPoints?: number;
      createdAt?: Date;
    };

    const update: Record<string, unknown> = {};
    if (body.projectId !== undefined) update.projectId = String(body.projectId);
    if (body.name !== undefined) update.name = String(body.name);
    if (body.startDate !== undefined) update.startDate = String(body.startDate);
    if (body.endDate !== undefined) update.endDate = String(body.endDate);
    if (body.goal !== undefined) update.goal = String(body.goal);
    if (body.status !== undefined) update.status = body.status;
    if (body.velocity !== undefined) update.velocity = Number(body.velocity);
    if (body.committedPoints !== undefined) update.committedPoints = Number(body.committedPoints);
    if (body.completedPoints !== undefined) update.completedPoints = Number(body.completedPoints);
    if (body.createdAt !== undefined) update.createdAt = new Date(String(body.createdAt));

    const found = await db.collection('sprints').updateOne(String(id), update);
    if (!found) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const updated = await db.collection('sprints').findById(String(id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sprint' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.collection('sprints').deleteOne(String(id));
    if (!deleted) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete sprint' });
  }
});

export default router;