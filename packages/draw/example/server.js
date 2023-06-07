import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { readFromFileSystem } from '@mindgraph/read';

const PORT = 5173;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  app.get('/api/notes', async (_req, res, next) => {
    try {
      const notes = await readFromFileSystem(path.resolve(__dirname, 'notes'));
      res.send(notes);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.use('/tests/*', async (req, res, next) => {
    try {
      const html = await vite.transformIndexHtml(
        req.originalUrl,
        fs.readFileSync(
          path.resolve(`${__dirname}`, req.originalUrl.replace('/', '')),
          'utf-8',
        ),
      );

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });

  app.use('*', async (req, res, next) => {
    try {
      const html = await vite.transformIndexHtml(
        req.originalUrl,
        fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8'),
      );

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });

  console.log(`dev server running at http://localhost:${PORT}`);
  app.listen(PORT);
}

createServer();
