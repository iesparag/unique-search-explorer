import {MongoClient} from 'mongodb';
import process from 'process';

/**
 * This file exports functions to initialize MongoDB client and access the items collection.
 * The item schema fields include title, content, source, createdAt, hash, uniquenessTag.
 * Indexes ensure uniqueness on hash and efficient queries.
 */

let client;
let db;
let itemsCollection;

/**
 * Connect to MongoDB and get item collection.
 * @param {string} uri MongoDB connection string
 */
export async function initializeDb(uri) {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  itemsCollection = db.collection('items');

  // Create indexes (unique hash for uniqueness detection)
  await itemsCollection.createIndex({hash: 1}, {unique: true, sparse: true});
  await itemsCollection.createIndex({createdAt: -1});
  await itemsCollection.createIndex({uniquenessTag: 1});
}

/**
 * Get the items collection instance.
 * @returns {import('mongodb').Collection}
 */
export function getItemsCollection() {
  if (!itemsCollection) {
    throw new Error('DB not initialized. Call initializeDb(uri) first.');
  }
  return itemsCollection;
}

/**
 * Close MongoDB client connection.
 */
export async function closeDb() {
  if (client) {
    await client.close();
  }
}
