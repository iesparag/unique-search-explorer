import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeDb, getItemsCollection, closeDb} from '../src/models/item.js';
import {addOrUpdateItem, searchItems} from '../src/services/uniquenessService.js';
import config from '../src/config/index.js';
import {describe, before, after} from 'node:test';

let collection;

describe('UniquenessService tests', () => {
  before(async () => {
    await initializeDb(config.mongodbUri);
    collection = getItemsCollection();
  });

  after(async () => {
    await closeDb();
  });

  test('addOrUpdateItem inserts new and updates existing frequency', async () => {
    // Clear collection
    await collection.deleteMany({content: /uniquenessService test/i});

    const content = 'uniquenessService test content';
    // Insert new item
    const first = await addOrUpdateItem({content});
    assert.equal(first.frequency, 1);
    assert.equal(first.content, content);

    // Insert same content again, frequency should increase
    const second = await addOrUpdateItem({content});
    assert.equal(second.frequency, 2);
    assert.equal(second.content, content);

    // Search only unique (should be zero because freq=2)
    const uniqueItems = await searchItems({query: content, onlyUnique: true});
    assert.equal(uniqueItems.length, 0);

    // Search all (should find the item)
    const allItems = await searchItems({query: content, onlyUnique: false});
    assert.ok(allItems.some(item => item.content === content));

    // Cleanup
    await collection.deleteMany({content});
  });
});
