import express from 'express';
import config from './config/index.js';
import itemRoutes from './routes/itemRoutes.js';
import {initializeDb} from './models/item.js';
import cli from './routes/cli.js';
import process from 'process';
import path from 'path';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  await initializeDb(config.mongodbUri);

  const app = express();
  app.use(express.json());

  // API routes mounted under /items with logging
  app.use(['/items', '/api/items'], (req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  }, itemRoutes);

  // Path to frontend dist directory
  const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

  // Serve frontend static files for root and general frontend SPA path
  app.use(express.static(frontendDistPath));

  // Requests that start with /api or /items have been handled by API routes above.
  // For any other request that does not match /api or /items, serve SPA index.html to support client side routing
  app.get(/^\/((?!api|items).)*$/, (req, res) => {
    console.log(`[Frontend] Serving index.html for route: ${req.url}`);
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  // Catch not found routes under /items or /api (should rarely get here due to above)
  app.use((req, res) => {
    if(req.path.startsWith('/items') || req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API route not found' });
    } else {
      res.status(404).send('Not found');
    }
  });

  app.listen(config.port, () => {
    console.log(`Server started on port ${config.port}`);
    console.log(`Serving frontend static files from ${frontendDistPath} on root path /`);
    console.log(`Serving API routes on /items (and /api/items)`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  // CLI mode check for add-item or search-items
  if (args.length > 0 && ['add-item', 'search-items', 'add', 'search'].includes(args[0])) {
    try {
      await initializeDb(config.mongodbUri);
      await cli();
    } catch (err) {
      console.error('Failed to run CLI:', err);
      process.exit(1);
    }
  } else {
    try {
      await startServer();
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  }
}

main();
