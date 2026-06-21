import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeDb, getItemsCollection, closeDb} from '../src/models/item.js';
import config from '../src/config/index.js';
import {describe, before, after} from 'node:test';

let collection;

describe('Item model tests', () => {
  before(async () => {
    await initializeDb(config.mongodbUri);
    collection = getItemsCollection();
    // Clear any previous test data that might cause duplicates
    await collection.deleteMany({hash: 'dummyhash'});
  });

  after(async () => {
    await collection.deleteMany({hash: 'dummyhash'});
    await closeDb();
  });

  test('Item model should insert and retrieve item', async () => {
    const testItem = {content: 'Test content for item model', frequency: 1, hash: 'dummyhash', createdAt: new Date(), lastSeen: new Date()};

    // Insert
    const insertResult = await collection.insertOne(testItem);
    assert.equal(insertResult.acknowledged, true);
    assert.ok(insertResult.insertedId);

    // Retrieve
    const found = await collection.findOne({_id: insertResult.insertedId});
    assert.deepEqual(found.content, testItem.content);

    // Cleanup
    await collection.deleteOne({_id: insertResult.insertedId});
  });
});
