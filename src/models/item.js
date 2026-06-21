import {MongoClient} from 'mongodb';
import process from 'process';

/**
 * This file exports a function that returns the MongoDB collection for items.
 * We do not initiate connection here to keep flexibility.
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

  // Ensure indexes
  await itemsCollection.createIndex({hash: 1}, {unique: true, sparse: true});
  await itemsCollection.createIndex({createdAt: -1});
}

export function getItemsCollection() {
  if (!itemsCollection) {
    throw new Error('DB not initialized. Call initializeDb(uri) first.');
  }
  return itemsCollection;
}

export async function closeDb() {
  if (client) {
    await client.close();
  }
}
