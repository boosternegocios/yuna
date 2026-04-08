import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import prisma from "./server/db.ts";
import authRoutes from "./server/routes/auth.ts";
import boardRoutes from "./server/routes/boards.ts";
import columnRoutes from "./server/routes/columns.ts";
import cardRoutes from "./server/routes/cards.ts";
import cardMoveRoutes from "./server/routes/cards_move.ts";
import attachmentRoutes from "./server/routes/attachments.ts";
import { authenticateToken, AuthRequest } from "./server/middleware/auth.ts";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/boards", boardRoutes);
  app.use("/api/columns", columnRoutes);
  app.use("/api/cards", cardRoutes);
  app.use("/api/cards", cardMoveRoutes);
  app.use("/api", attachmentRoutes); // Mounts at /api (routes include /:cardId/attachments etc)

  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Protected route example
  app.get("/api/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        select: { id: true, email: true, name: true }
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Example API route using Prisma
  app.get("/api/users", authenticateToken, async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // SPA fallback for non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
