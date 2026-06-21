# Build plan

1. Scaffold project: package.json, folder layout, config, README, .gitignore, .env.example.
2. Data model and persistence: define Item schema including uniqueness metadata, MongoDB connection.
3. Ingestion API: add REST endpoints to ingest/search items, validate input, store in DB with initial uniqueness tagging.
4. Uniqueness detection service: implement hashing, frequency counting to identify unique/rare items, run on ingestion.
5. Search API with uniqueness filters: allow filtering by uniqueness levels (unique, rare, common), sorting, pagination.
6. CLI interface: commands to add items, perform searches with uniqueness filters, output results.
7. Aggregation and reporting: generate statistics about dataset uniqueness distribution, accessible via API.
8. Testing and documentation: comprehensive tests for all modules, update README with setup and usage instructions.

