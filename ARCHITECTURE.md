# Architecture

Components:
- API server using Express handling REST endpoints
- MongoDB backend for storing search items, with hashing/indexing to detect uniqueness
- Services layer implementing uniqueness detection, search ranking, and aggregation
- Models defining item schema and uniqueness metadata
- CLI tool for performing uniqueness queries and imports

Folder tree:
- src/
  - config/ (env loading and config validation)
  - models/ (MongoDB schemas for searchable items)
  - services/ (uniqueness checking, search indexing, aggregation)
  - routes/ (HTTP endpoints and CLI commands)
  - utils/ (helpers like hashing, validation)
- tests/ (unit and integration tests)

Data flow:
- New items ingested via API or CLI
- Items validated and stored in DB
- Services analyze and tag items for uniqueness (hashes, frequency counts)
- Search queries processed to filter and rank unique items
- API and CLI return filtered unique search results

Key decisions:
- Use MongoDB for flexible schema and uniqueness querying
- Include both API and CLI search interfaces
- Input validation and error handling at all boundaries
- Automated testing of each feature
- No external uniqueness dataset, uniqueness derived from stored data

