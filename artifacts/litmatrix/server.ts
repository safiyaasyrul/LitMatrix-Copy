import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { db } from './src/db/index'; // We will create this
import apiRoutes from './server/routes';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const _dirname = path.resolve(import.meta.dirname);

  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(cors());
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(_dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: _dirname,
      configFile: path.join(_dirname, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    app.use(express.static(path.join(_dirname, 'dist')));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(_dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
