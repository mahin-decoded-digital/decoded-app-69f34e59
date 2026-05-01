import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

// list
router.get('/', async (req, res) => {
  try {
    const projects = await db.collection('projects').find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// create
router.post('/', async (req, res) => {
  try {
    const body = req.body as {
      name?: string;
      description?: string;
      ownerId?: string;
      repoUrl?: string;
      repoProvider?: 'github' | 'gitlab' | 'none';
      memberIds?: string[];
      color?: string;
      createdAt?: Date;
    };

    if (!body.name || !body.description || !body.ownerId || !body.repoUrl || !body.repoProvider || !body.memberIds || !body.color) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const doc = {
      name: String(body.name),
      description: String(body.description),
      ownerId: String(body.ownerId),
      repoUrl: String(body.repoUrl),
      repoProvider: body.repoProvider,
      memberIds: body.memberIds,
      color: String(body.color),
      createdAt: body.createdAt ? new Date(String(body.createdAt)) : new Date(),
    };

    const id = await db.collection('projects').insertOne(doc);
    const created = await db.collection('projects').findById(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as {
      name?: string;
      description?: string;
      ownerId?: string;
      repoUrl?: string;
      repoProvider?: 'github' | 'gitlab' | 'none';
      memberIds?: string[];
      color?: string;
      createdAt?: Date;
    };

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = String(body.name);
    if (body.description !== undefined) update.description = String(body.description);
    if (body.ownerId !== undefined) update.ownerId = String(body.ownerId);
    if (body.repoUrl !== undefined) update.repoUrl = String(body.repoUrl);
    if (body.repoProvider !== undefined) update.repoProvider = body.repoProvider;
    if (body.memberIds !== undefined) update.memberIds = body.memberIds;
    if (body.color !== undefined) update.color = String(body.color);
    if (body.createdAt !== undefined) update.createdAt = new Date(String(body.createdAt));

    const success = await db.collection('projects').updateOne(String(id), update);
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const updated = await db.collection('projects').findById(String(id));
    if (!updated) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.collection('projects').deleteOne(String(id));
    if (!success) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;