# Unique Search Explorer

Unique Search Explorer is a Node.js application designed to find unique, rare, or one-of-a-kind items efficiently. It aggregates diverse data sources, indexes uniqueness, and offers powerful search filtering for uniqueness criteria through an intuitive REST API and CLI interface.

## Features
- Aggregate and store searchable items in MongoDB.
- Detect and tag items for uniqueness.
- Perform smooth and flexible search queries for unique items.
- Both API and CLI interfaces for ingestion and searching.

## Technology Stack
- Node.js 20+
- Express.js
- MongoDB
- dotenv for environment configuration
- Node's built-in test runner

## Project Structure
```
src/
  config/      # Environment configuration and validation
  models/      # MongoDB schemas
  services/    # Business logic and uniqueness computations
  routes/      # Express API routes and CLI commands
  utils/       # Helpers like hashing
tests/         # Automated tests
```

## Setup

1. Clone the repository.
   ```bash
   git clone <repository-url>
   cd unique-search-explorer
   ```

2. Create a `.env` file in the project root with the following production settings for deployment (for example on Vercel):

   ```dotenv
   MONGODB_URI=mongodb+srv://iesparagjain:iesparagjain@cluster0.boltvzz.mongodb.net/
   PORT=3010
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the API server:
   ```bash
   npm start
   ```

5. Run tests once (all tests must pass):
   ```bash
   npm test
   ```

## Environment Variables

| Variable    | Description                           | Example                              |
|-------------|-------------------------------------|------------------------------------|
| MONGODB_URI | MongoDB connection URI               | mongodb://localhost:27017/unique_search_explorer |
| PORT        | Port for Express.js server           | 3000 (Default), use 3010 in production |


## Usage Examples

### REST API

- **Add a new item**

  ```bash
  curl -X POST http://localhost:3010/items \
    -H 'Content-Type: application/json' \
    -d '{"content":"Unique item content","title":"Sample Title","source":"API Example"}'
  ```

  Response:
  ```json
  {
    "content": "Unique item content",
    "title": "Sample Title",
    "source": "API Example",
    "hash": "<computed_hash>",
    "frequency": 1,
    "uniquenessTag": "UNIQUE",
    "createdAt": "2024-xx-xxTxx:xx:xx.xxxZ",
    "lastSeen": "2024-xx-xxTxx:xx:xx.xxxZ"
  }
  ```

- **Search items**

  Fetch items matching a query, optionally filtering by uniqueness tag and sorting.

  ```bash
  curl http://localhost:3010/items?query=unique&uniquenessTag=UNIQUE&sort=createdAt&page=1&limit=10
  ```

  Response will contain matched items with pagination.

- **Get aggregated statistics**

  ```bash
  curl http://localhost:3010/items/stats
  ```

  Response provides counts for unique, rare, common items, and frequency distribution.

### CLI

The CLI tool provides commands to add and search items.

- **Add an item**

  ```bash
  node src/index.js add-item content="Example content" title="Example Title" source="CLI"
  ```

  Or shorthand:
  ```bash
  node src/index.js add "Example content"
  ```

- **Search items**

  ```bash
  node src/index.js search-items --query "unique" --onlyUnique --limit 10 --page 1
  ```

  Arguments:
  - `--query <text>` : Text to search in content
  - `--onlyUnique` : Return only items tagged UNIQUE
  - `--limit <number>` : Number of results per page (default 20)
  - `--page <number>` : Page number to display (default 1)

### Help

Run without arguments to see CLI usage:

```bash
node src/index.js
```

## Uniqueness Concept

The uniqueness of an item is derived from its content's SHA256 hash and measured by how many items share the same hash:

- `UNIQUE`: Frequency = 1 (only one item with that content).
- `RARE`: Frequency between 2 and 5.
- `COMMON`: Frequency greater than 5.

When new items are added that share content, the system updates frequency counts and uniqueness tags accordingly.

## Troubleshooting Tips

- **Database connection issues:** Ensure `MONGODB_URI` is correctly set and MongoDB server is running.
- **Port in use:** The configured `PORT` might be in use. Change it in `.env` if needed.
- **Duplicate item errors:** Duplicate content generates a hash conflict handled gracefully when adding. Use unique content or update existing.
- **Tests failing:** Verify MongoDB is reachable and environment variables are correct.
- **CLI errors:** Ensure you use correct argument formats: key=value pairs or positional content argument.

## Deployment on Vercel

- The `.env` file as specified should be used for local development and can be replicated using [Vercel Environment Variables](https://vercel.com/docs/environment-variables) in Vercel dashboard.
- Vercel deployment will pick up the `PORT` environment variable; however, Vercel dynamically assigns ports. The included server code uses `process.env.PORT` which matches best practice for Vercel.
- Vercel supports Node.js 20+ and Express apps; this project is compatible as-is.

## License

MIT
