import express, { Response } from 'express';
import prisma from '../db.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Get all boards for the logged-in user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const boards = await prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// Get a single board with columns
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const boardId = parseInt(req.params.id);

    const board = await prisma.board.findFirst({
      where: { id: boardId, userId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// Create a new board
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const board = await prisma.board.create({
      data: {
        title,
        userId,
      },
    });
    res.status(201).json(board);
  } catch (error: any) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Failed to create board', details: error.message });
  }
});

// Update a board
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const boardId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Ensure the board belongs to the user
    const existingBoard = await prisma.board.findFirst({
      where: { id: boardId, userId },
    });

    if (!existingBoard) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: { title },
    });

    res.json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

// Delete a board
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const boardId = parseInt(req.params.id);

    // Ensure the board belongs to the user
    const existingBoard = await prisma.board.findFirst({
      where: { id: boardId, userId },
    });

    if (!existingBoard) {
      return res.status(404).json({ error: 'Board not found' });
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

export default router;
