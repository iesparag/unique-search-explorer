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

  // API routes
  app.use('/items', itemRoutes);

  // Serve the frontend static files
  // Frontend build output location
  const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

  // Serve static files from frontend dist
  app.use(express.static(frontendDistPath));

  // Serve index.html for root and for other frontend routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  // Fallback route to handle SPA (serve index.html)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  // Not found handler for other paths under /items or unknown
  app.use((req, res) => {
    res.status(404).json({error: 'Not found'});
  });

  app.listen(config.port, () => {
    console.log(`Server started on port ${config.port}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  // CLI supports: add-item and search-items
  if (args.length > 0 && ['add-item', 'search-items'].includes(args[0])) {
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
