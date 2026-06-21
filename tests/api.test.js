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

  test('GET /items supports uniquenessTag filtering', async () => {
    // Insert three items with different uniquenessTags
    const collection = getItemsCollection();
    await collection.deleteMany({content: /api test uniquenessTag/i});

    const itemsToInsert = [
      {content: 'api test uniquenessTag UNIQUE', frequency: 1, uniquenessTag: 'UNIQUE', createdAt: new Date(), lastSeen: new Date(), hash: 'hash1'},
      {content: 'api test uniquenessTag RARE', frequency: 3, uniquenessTag: 'RARE', createdAt: new Date(), lastSeen: new Date(), hash: 'hash2'},
      {content: 'api test uniquenessTag COMMON', frequency: 10, uniquenessTag: 'COMMON', createdAt: new Date(), lastSeen: new Date(), hash: 'hash3'},
    ];

    for (const item of itemsToInsert) {
      try {
        await collection.insertOne(item);
      } catch { /* ignore duplicates from concurrent runs */ }
    }

    const fetchFiltered = async (tag) => {
      const resp = await fetch(`${baseUrl}/items?uniquenessTag=${tag}`);
      assert.equal(resp.status, 200);
      const json = await resp.json();
      return json.items;
    };

    const uniqueItems = await fetchFiltered('UNIQUE');
    assert.ok(uniqueItems.length >= 1);
    assert.ok(uniqueItems.every(i => i.uniquenessTag === 'UNIQUE'));

    const rareItems = await fetchFiltered('RARE');
    assert.ok(rareItems.length >= 1);
    assert.ok(rareItems.every(i => i.uniquenessTag === 'RARE'));

    const commonItems = await fetchFiltered('COMMON');
    assert.ok(commonItems.length >= 1);
    assert.ok(commonItems.every(i => i.uniquenessTag === 'COMMON'));

    await collection.deleteMany({content: /api test uniquenessTag/i});
  });

  test('GET /items supports pagination and sorting', async () => {
    const collection = getItemsCollection();
    await collection.deleteMany({content: /api test pagination/i});

    // Insert 30 items with increasing createdAt
    const now = Date.now();
    const bulk = collection.initializeUnorderedBulkOp();
    for (let i = 1; i <= 30; i++) {
      bulk.insert({
        content: `api test pagination item ${i}`,
        frequency: 1,
        uniquenessTag: 'UNIQUE',
        createdAt: new Date(now - i * 1000),
        lastSeen: new Date(now - i * 1000),
        hash: `hash_pagination_${i}`
      });
    }
    await bulk.execute();

    // page=2, limit=10, sort=createdAt
    const resp1 = await fetch(`${baseUrl}/items?page=2&limit=10&sort=createdAt&uniquenessTag=UNIQUE`);
    assert.equal(resp1.status, 200);
    const json1 = await resp1.json();
    assert.equal(json1.page, 2);
    assert.equal(json1.limit, 10);
    assert.equal(json1.items.length, 10);

    // Check ordering descending by createdAt
    for (let i = 1; i < json1.items.length; i++) {
      const prev = new Date(json1.items[i - 1].createdAt);
      const curr = new Date(json1.items[i].createdAt);
      assert.ok(prev >= curr);
    }

    // sort by relevance (frequency asc, createdAt desc) - all freq=1 so sorted by createdAt desc
    const resp2 = await fetch(`${baseUrl}/items?page=1&limit=5&sort=relevance&uniquenessTag=UNIQUE`);
    assert.equal(resp2.status, 200);
    const json2 = await resp2.json();
    assert.equal(json2.page, 1);
    assert.equal(json2.limit, 5);
    assert.equal(json2.items.length, 5);

    // Check ordering by createdAt desc (since all freq=1)
    for (let i = 1; i < json2.items.length; i++) {
      const prev = new Date(json2.items[i - 1].createdAt);
      const curr = new Date(json2.items[i].createdAt);
      assert.ok(prev >= curr);
    }

    await collection.deleteMany({content: /api test pagination/i});
  });

  test('GET /items returns 400 for invalid uniquenessTag and sort', async () => {
    const resp1 = await fetch(`${baseUrl}/items?uniquenessTag=INVALIDTAG`);
    assert.equal(resp1.status, 400);
    const json1 = await resp1.json();
    assert.match(json1.error, /Invalid uniquenessTag/i);

    const resp2 = await fetch(`${baseUrl}/items?sort=unknown`);
    assert.equal(resp2.status, 400);
    const json2 = await resp2.json();
    assert.match(json2.error, /Invalid sort/i);
  });
});
