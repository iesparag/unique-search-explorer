import express from 'express';
import config from './config/index.js';
import itemRoutes from './routes/itemRoutes.js';
import {initializeDb} from './models/item.js';
import cli from './routes/cli.js';
import process from 'process';

async function startServer() {
  await initializeDb(config.mongodbUri);

  const app = express();
  app.use(express.json());

  app.use('/items', itemRoutes);

  app.get('/', (req, res) => {
    res.send('Unique Search Explorer API');
  });

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
