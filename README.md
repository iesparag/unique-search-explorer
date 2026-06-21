# Unique Search Explorer

Unique Search Explorer is a Node.js application designed to find unique, rare, or one-of-a-kind items efficiently. It aggregates diverse data sources, indexes uniqueness, and offers powerful search filtering for uniqueness criteria through an intuitive REST API and CLI interface.

## Features
- Aggregate and store searchable items in MongoDB.
- Detect and tag items for uniqueness.
- Perform smooth and flexible search queries for unique items.
- Both API and CLI interfaces for ingestion and searching.
- Minimal React frontend SPA served from the same Express server.

## Technology Stack
- Node.js 20+
- Express.js
- MongoDB
- React (frontend)
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
  frontend/    # React frontend application source and build output
tests/         # Automated tests
```

## Setup

1. Clone the repository.
   ```bash
   git clone <repository-url>
   cd unique-search-explorer
   ```

2. Create a `.env` file in the project root with the following production settings for deployment (example):

   ```dotenv
   MONGODB_URI=mongodb+srv://iesparagjain:iesparagjain@cluster0.boltvzz.mongodb.net/
   PORT=3010
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the frontend React application:

   ```bash
   npm run frontend:build
   ```

5. Start the API and frontend server:

   ```bash
   npm start
   ```

6. Visit `http://localhost:3010/` in your browser to use the frontend SPA.

## Environment Variables

| Variable    | Description                           | Example                              |
|-------------|-------------------------------------|------------------------------------|
| MONGODB_URI | MongoDB connection URI               | mongodb://localhost:27017/unique_search_explorer |
| PORT        | Port for Express.js server           | 3010 (default port)                |

## Usage Examples

### Frontend Usage

- The frontend SPA is served on the root path `/` of the same server as the API.
- Access the UI by navigating to `http://localhost:3010/` (or configured port).
- Use the search bar to query items.
- Add new unique items via the form.
- The frontend communicates with the API at `/items` endpoints transparently.

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

## Deployment

### Deployment on Vercel

1. Sign up or log in to [Vercel](https://vercel.com/).
2. Create a new project and connect your GitHub/Git repository with Unique Search Explorer.
3. In Project Settings on Vercel, add Environment Variables:
   - `MONGODB_URI` with your MongoDB connection string.
   - `PORT` set to `3010`.
4. Deploy the project. Vercel will build and start the server automatically.
5. Your API and frontend will be accessible at the provided Vercel URL.

Note: The server uses `PORT` from environment variables, so port 3010 is used as configured.

## License

MIT
