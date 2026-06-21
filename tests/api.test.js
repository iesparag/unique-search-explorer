import test from 'node:test';
import assert from 'node:assert/strict';
import fetch from 'node-fetch';
import express from 'express';
import itemRoutes from '../src/routes/itemRoutes.js';
import {initializeDb, getItemsCollection, closeDb} from '../src/models/item.js';
import config from '../src/config/index.js';
import {describe, before, after} from 'node:test';
import http from 'http';

// Setup express app instance for testing HTTP endpoints
const app = express();
app.use(express.json());
app.use('/items', itemRoutes);

let server;
let baseUrl;

const collectionName = 'items';

describe('API Tests', () => {
  before(async () => {
    await initializeDb(config.mongodbUri);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const addr = server.address();
    baseUrl = `http://localhost:${addr.port}`;
  });

  after(async () => {
    await getItemsCollection().deleteMany({content: /api test/i});
    await closeDb();
    server.close();
  });

  // Helper to POST JSON
  async function postJson(url, body) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    return resp;
  }

  test('POST /items adds new item and GET /items searches it', async () => {
    const content = 'api test content';

    // POST add item
    const postResp = await postJson(baseUrl + '/items', {content});
    assert.equal(postResp.status, 201);
    const postJsonResp = await postResp.json();
    assert.equal(postJsonResp.content, content);

    // GET search for the item
    const searchResp = await fetch(baseUrl + '/items?query=api%20test');
    assert.equal(searchResp.status, 200);
    const searchJson = await searchResp.json();
    assert.ok(Array.isArray(searchJson.items));
    assert.ok(searchJson.items.some(item => item.content === content));
  });
});
