import express, { Response } from 'express';
import prisma from '../db.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Move a card (update position and/or column)
router.patch('/:id/move', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cardId = parseInt(req.params.id);
    const { newColumnId, newPosition } = req.body;

    if (newColumnId === undefined || newPosition === undefined) {
      return res.status(400).json({ error: 'New column ID and position are required' });
    }

    // Verify ownership and get current card details
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });

    if (!card || card.column.board.userId !== userId) {
      return res.status(404).json({ error: 'Card not found or unauthorized' });
    }

    const oldColumnId = card.columnId;
    const oldPosition = card.position;

    // Transaction to update positions
    await prisma.$transaction(async (tx) => {
      // 1. If moving to a different column
      if (oldColumnId !== newColumnId) {
        // Verify target column belongs to user (via board)
        const targetColumn = await tx.column.findUnique({
          where: { id: newColumnId },
          include: { board: true },
        });

        if (!targetColumn || targetColumn.board.userId !== userId) {
          throw new Error('Target column not found or unauthorized');
        }

        // Decrement positions in old column for cards > oldPosition
        await tx.card.updateMany({
          where: {
            columnId: oldColumnId,
            position: { gt: oldPosition },
          },
          data: { position: { decrement: 1 } },
        });

        // Increment positions in new column for cards >= newPosition
        await tx.card.updateMany({
          where: {
            columnId: newColumnId,
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });

        // Update the card itself
        await tx.card.update({
          where: { id: cardId },
          data: { columnId: newColumnId, position: newPosition },
        });
      } 
      // 2. If moving within the same column
      else if (oldPosition !== newPosition) {
        if (newPosition > oldPosition) {
          // Moving down: Shift items between old and new positions UP (decrement)
          await tx.card.updateMany({
            where: {
              columnId: oldColumnId,
              position: { gt: oldPosition, lte: newPosition },
            },
            data: { position: { decrement: 1 } },
          });
        } else {
          // Moving up: Shift items between new and old positions DOWN (increment)
          await tx.card.updateMany({
            where: {
              columnId: oldColumnId,
              position: { gte: newPosition, lt: oldPosition },
            },
            data: { position: { increment: 1 } },
          });
        }

        // Update the card itself
        await tx.card.update({
          where: { id: cardId },
          data: { position: newPosition },
        });
      }
    });

    res.status(200).json({ message: 'Card moved successfully' });
  } catch (error) {
    console.error('Error moving card:', error);
    res.status(500).json({ error: 'Failed to move card' });
  }
});

export default router;
