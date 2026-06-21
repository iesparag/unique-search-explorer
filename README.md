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
2. Create a `.env` file or set environment variables as per `.env.example`.
3. Install dependencies:
```
npm install
```
4. Run the application:
```
npm start
```
5. Run tests:
```
npm test
```

## Environment Variables
- `MONGODB_URI`: MongoDB connection URI.
- `PORT`: Port number for the Express server.

## License
MIT
