# Unique Search Explorer

Unique Search Explorer is a Node.js application designed to find unique, rare, or one-of-a-kind items efficiently. It aggregates diverse data sources, indexes uniqueness, and offers powerful search filtering for uniqueness criteria through an intuitive REST API, CLI interface, and minimal React frontend.

---

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
- React (frontend with Vite)
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
  frontend/    # React frontend app source and build output

tests/        # Automated tests
```

---

## Setup and Run

### 1. Clone repository

```bash
git clone <repository-url>
cd unique-search-explorer
```


### 2. Create `.env` file in project root

Create a `.env` file with the following example content (update with your MongoDB URI):

```dotenv
MONGODB_URI=mongodb+srv://yourUser:yourPassword@cluster0.boltvzz.mongodb.net/yourDbName
PORT=3010
```

Alternatively, you can copy and edit `.env.example`:

```bash
cp .env.example .env
```


### 3. Install dependencies

Run from project root:

```bash
npm install
```


### 4. Running Frontend Development server standalone

You can develop the frontend independently with Vite dev server.

```bash
cd src/frontend
npm run frontend:dev
```

This starts a hot-reloading React development server at http://localhost:5173 (default). Use this for frontend development only.


### 5. Build frontend for production

From project root, run:

```bash
npm run frontend:build
```

This compiles React frontend into static files under `src/frontend/dist`.


### 6. Start backend server that serves frontend production build

Make sure you have built frontend as above. Then start the API server:

```bash
npm start
```


The server will listen on the configured `PORT` (default 3010) and serve the frontend SPA at `/`. The backend API will be available at `/items`.


### 7. Running tests

You can run automated tests once by:

```bash
npm test
```

This runs all tests under `tests/` and exits.

---

## Working with the Frontend

The frontend is a minimal React SPA that lets you:

- Search items using keywords
- Add new items with content, optional title, and source
- View results with frequency and uniqueness tags

### Access
- When running the backend with production frontend build: http://localhost:3010
- When running development frontend standalone: http://localhost:5173

### Sample usage

- Enter a search term in the search box and click search.
- Add new items using the add item form by providing content (required) and optionally title and source.
- Results update on successful addition.

### Screenshot example

_This example assumes running backend with production frontend at http://localhost:3010_

![Frontend Search and Add Example](https://user-images.githubusercontent.com/yourusername/unique-search-explorer/frontend-example.png)

(Replace with actual screenshot if possible)

---

## REST API Notes

- The backend API remains fully accessible at the `/items` endpoint for integration, e.g., via `curl` or other HTTP clients.

- Examples:

Add a new item:
```bash
curl -X POST http://localhost:3010/items \
 -H 'Content-Type: application/json' \
 -d '{"content":"Unique item content","title":"Sample Title","source":"API Example"}'
```

Search items (with optional filters and sorting):
```bash
curl http://localhost:3010/items?query=unique&uniquenessTag=UNIQUE&sort=createdAt&page=1&limit=10
```

Get aggregated stats:
```bash
curl http://localhost:3010/items/stats
```


## CLI Notes

The CLI commands remain unchanged and can be run via:

```bash
node src/index.js add-item content="Example content" title="Title" source="CLI"
```
Or shorthand:
```bash
node src/index.js add "Example content"
```

Search:
```bash
node src/index.js search-items --query "unique" --onlyUnique --limit 10 --page 1
```

Run CLI without arguments to see full usage:
```
node src/index.js
```

---

## Environment Variables

| Variable    | Description                | Example                                        |
|-------------|----------------------------|------------------------------------------------|
| MONGODB_URI | MongoDB connection URI      | mongodb://localhost:27017/unique_search_explorer |
| PORT        | Port for Express.js server  | 3010 (default port)                             |


## Troubleshooting

- Ensure Docker or your local MongoDB is running or accessible via provided `MONGODB_URI`.
- Change `PORT` env if default 3010 is taken.
- Build frontend before running backend in production mode.
- For frontend dev errors, restart Vite dev server.


## Deployment

The project is ready for deployment (e.g. Vercel) as documented.

---

## License

MIT
