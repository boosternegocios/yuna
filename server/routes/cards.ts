import express, { Response } from 'express';
import prisma from '../db.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1', 'h2', 'h3', 'img', 'span'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['style', 'class'],
    'a': ['href', 'name', 'target'],
  },
};

// Create a new card
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { columnId, title, postType, flagStatus, scheduledDate, description } = req.body;

    if (!columnId || !title) {
      return res.status(400).json({ error: 'Column ID and title are required' });
    }

    // Verify ownership via column -> board
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });

    if (!column || column.board.userId !== userId) {
      return res.status(404).json({ error: 'Column not found or unauthorized' });
    }

    // Get the highest position to append the new card
    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastCard ? lastCard.position + 1 : 0;

    const sanitizedDescription = description ? sanitizeHtml(description, sanitizeOptions) : null;

    const card = await prisma.card.create({
      data: {
        title,
        description: sanitizedDescription,
        columnId,
        position: newPosition,
        postType: postType || 'Static',
        flagStatus: flagStatus || 'Green',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
      include: {
        attachments: true,
      },
    });

    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// Update a card
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cardId = parseInt(req.params.id);
    const { title, postType, flagStatus, scheduledDate, position, columnId, description } = req.body;

    // Verify ownership via card -> column -> board
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });

    if (!card || card.column.board.userId !== userId) {
      return res.status(404).json({ error: 'Card not found or unauthorized' });
    }

    const sanitizedDescription = description !== undefined 
      ? (description ? sanitizeHtml(description, sanitizeOptions) : null) 
      : undefined;

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        title: title !== undefined ? title : undefined,
        description: sanitizedDescription,
        postType: postType !== undefined ? postType : undefined,
        flagStatus: flagStatus !== undefined ? flagStatus : undefined,
        scheduledDate: scheduledDate !== undefined ? (scheduledDate ? new Date(scheduledDate) : null) : undefined,
        position: position !== undefined ? position : undefined,
        columnId: columnId !== undefined ? columnId : undefined,
      },
      include: {
        attachments: true,
      },
    });

    res.json(updatedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Delete a card
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cardId = parseInt(req.params.id);

    // Verify ownership via card -> column -> board
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });

    if (!card || card.column.board.userId !== userId) {
      return res.status(404).json({ error: 'Card not found or unauthorized' });
    }

    await prisma.card.delete({
      where: { id: cardId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

export default router;
