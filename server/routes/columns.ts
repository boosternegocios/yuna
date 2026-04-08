import express, { Response } from 'express';
import prisma from '../db.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Create a new column
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { boardId, name } = req.body;

    if (!boardId || !name) {
      return res.status(400).json({ error: 'Board ID and name are required' });
    }

    // Verify board ownership
    const board = await prisma.board.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get the highest position to append the new column
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastColumn ? lastColumn.position + 1 : 0;

    const column = await prisma.column.create({
      data: {
        name,
        position: newPosition,
        boardId,
      },
    });

    res.status(201).json(column);
  } catch (error) {
    console.error('Error creating column:', error);
    res.status(500).json({ error: 'Failed to create column' });
  }
});

// Update a column (name or position)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const columnId = parseInt(req.params.id);
    const { name, position } = req.body;

    // Verify ownership via board
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (!column || column.board.userId !== userId) {
      return res.status(404).json({ error: 'Column not found or unauthorized' });
    }

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: {
        name: name !== undefined ? name : column.name,
        position: position !== undefined ? position : column.position,
      },
    });

    res.json(updatedColumn);
  } catch (error) {
    console.error('Error updating column:', error);
    res.status(500).json({ error: 'Failed to update column' });
  }
});

// Delete a column
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const columnId = parseInt(req.params.id);

    // Verify ownership via board
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (!column || column.board.userId !== userId) {
      return res.status(404).json({ error: 'Column not found or unauthorized' });
    }

    await prisma.column.delete({
      where: { id: columnId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ error: 'Failed to delete column' });
  }
});

export default router;
