import express, { Response } from 'express';
import prisma from '../db.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

// Upload attachments
router.post('/:cardId/attachments', authenticateToken, upload.array('files', 10), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cardId = parseInt(req.params.cardId);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify ownership
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });

    if (!card || card.column.board.userId !== userId) {
      // Clean up uploaded files if unauthorized
      files.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({ error: 'Card not found or unauthorized' });
    }

    // Get current max position
    const lastAttachment = await prisma.attachment.findFirst({
      where: { cardId },
      orderBy: { position: 'desc' },
    });
    let startPosition = lastAttachment ? lastAttachment.position + 1 : 0;

    const attachmentsData = files.map((file, index) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      cardId,
      position: startPosition + index,
    }));

    // Save to DB
    // Prisma doesn't support createMany with SQLite for relations easily in one go returning all, 
    // but createMany is supported in recent versions. However, we want to return the created objects.
    // Let's use a transaction or just Promise.all
    const createdAttachments = await prisma.$transaction(
      attachmentsData.map(data => prisma.attachment.create({ data }))
    );

    res.status(201).json(createdAttachments);
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// Get attachments for a card
router.get('/:cardId/attachments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cardId = parseInt(req.params.cardId);

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } },
    });

    if (!card || card.column.board.userId !== userId) {
      return res.status(404).json({ error: 'Card not found or unauthorized' });
    }

    const attachments = await prisma.attachment.findMany({
      where: { cardId },
      orderBy: { position: 'asc' },
    });

    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Delete attachment
router.delete('/attachments/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const attachmentId = parseInt(req.params.id);

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { card: { include: { column: { include: { board: true } } } } },
    });

    if (!attachment || attachment.card.column.board.userId !== userId) {
      return res.status(404).json({ error: 'Attachment not found or unauthorized' });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from DB
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Reorder attachments
router.patch('/:cardId/attachments/reorder', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const cardId = parseInt(req.params.cardId);
        const { attachmentIds } = req.body; // Array of IDs in new order

        if (!Array.isArray(attachmentIds)) {
            return res.status(400).json({ error: 'Invalid attachment IDs' });
        }

        const card = await prisma.card.findUnique({
            where: { id: cardId },
            include: { column: { include: { board: true } } },
        });
  
        if (!card || card.column.board.userId !== userId) {
            return res.status(404).json({ error: 'Card not found or unauthorized' });
        }

        // Update positions in transaction
        await prisma.$transaction(
            attachmentIds.map((id, index) => 
                prisma.attachment.update({
                    where: { id },
                    data: { position: index }
                })
            )
        );

        res.status(200).json({ message: 'Attachments reordered' });

    } catch (error) {
        console.error('Error reordering attachments:', error);
        res.status(500).json({ error: 'Failed to reorder attachments' });
    }
});

export default router;
