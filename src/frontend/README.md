# Frontend for Unique Search Explorer

This folder contains the minimal React frontend app for the Unique Search Explorer project, built with React and Vite.

## Setup & Running Locally

1. Make sure you have run `npm install` in the project root to install dependencies including React and Vite.

2. Navigate to the frontend folder:

```bash
cd src/frontend
```

3. Run the development server:

```bash
npm run frontend:dev
```

This will start Vite dev server usually at http://localhost:5173 with hot reload.

## Building for Production

Run the build script from project root:

```bash
npm run frontend:build
```

This will build the React app into static files under `src/frontend/dist`.

## Serving in Production

The Express.js server in `src/index.js` is configured to serve the built frontend static files from `src/frontend/dist`.

Make sure to build the frontend before starting the server in production.

That is:

1. Run:

```bash
npm run frontend:build
```

2. Then run API server:

```bash
npm start
```

and visit `http://localhost:3010/` (or your configured port).

## Notes

- The frontend is intentionally minimal for demonstration and can be extended with better styling and features.
- The frontend communicates with the backend API on the same origin.
