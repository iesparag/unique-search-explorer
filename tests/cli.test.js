import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {initializeDb, getItemsCollection, closeDb} from '../src/models/item.js';
import config from '../src/config/index.js';
import {describe, before, after} from 'node:test';
import process from 'process';
import path from 'path';

let collection;

const nodePath = process.execPath;
const cliPath = path.resolve(new URL('../src/index.js', import.meta.url).pathname);

describe('CLI Tests', () => {
  before(async () => {
    await initializeDb(config.mongodbUri);
    collection = getItemsCollection();
  });

  after(async () => {
    await closeDb();
  });

  function runCli(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(nodePath, [cliPath, ...args]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
      proc.stderr.on('data', chunk => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        resolve({code, stdout, stderr});
      });
      proc.on('error', reject);
    });
  }

  test('CLI add command adds an item', async () => {
    const testContent = 'cli test content add';
    await collection.deleteMany({content: testContent});

    const res = await runCli(['add', testContent]);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /Item saved/);
    assert.match(res.stdout, new RegExp(testContent));

    // Check DB has the item
    const found = await collection.findOne({content: testContent});
    assert.ok(found);

    // Cleanup
    await collection.deleteMany({content: testContent});
  });

  test('CLI search command finds added item', async () => {
    const testContent = 'cli test content search';
    await collection.deleteMany({content: testContent});
    await collection.insertOne({content: testContent, hash: 'dummy', frequency:1, createdAt: new Date(), lastSeen: new Date()});

    const res = await runCli(['search', '--query', 'cli test content search']);
    assert.equal(res.code, 0);
    assert.match(res.stdout, /Content: cli test content search/);

    // Cleanup
    await collection.deleteMany({content: testContent});
  });
});
