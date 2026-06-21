import {getItemsCollection} from '../models/item.js';
import {hashContent} from '../utils/hash.js';

/**
 * Adds an item to the database, computes hash to find uniqueness.
 * If an item with the same hash exists, increments its frequency.
 * Returns the saved or updated item.
 *
 * @param {Object} itemData - item fields (at least content/property to hash)
 * @returns {Object} saved item document
 */
export async function addOrUpdateItem(itemData) {
  if (!itemData || typeof itemData !== 'object') {
    throw new TypeError('itemData must be an object');
  }
  const collection = getItemsCollection();

  // Compute a hash from the item content (assuming 'content' field)
  const hash = hashContent(itemData.content || '');

  const now = new Date();

  // Try to find existing item with same hash
  const existing = await collection.findOne({hash});
  if (existing) {
    // Update frequency count and lastSeen
    const updateResult = await collection.findOneAndUpdate(
      {hash},
      { $inc: {frequency: 1}, $set: {lastSeen: now} },
      { returnDocument: 'after' }
    );
    return updateResult.value;
  }

  // Create new item with frequency 1
  const newItem = {
    ...itemData,
    hash,
    frequency: 1,
    createdAt: now,
    lastSeen: now
  };

  const insertResult = await collection.insertOne(newItem);
  if (!insertResult.acknowledged) {
    throw new Error('Failed to insert new item');
  }

  return newItem;
}

/**
 * Searches items by text content and optional uniqueness filters
 *
 * @param {Object} params - search parameters
 * @param {string} params.query - text to match in content (optional)
 * @param {boolean} params.onlyUnique - if true, return only items with frequency 1
 * @param {number} params.limit - number of items to return
 * @returns {Array} items matching criteria
 */
export async function searchItems({query = '', onlyUnique = false, limit = 20} = {}) {
  const collection = getItemsCollection();

  const filters = {};

  if (query) {
    filters.content = { $regex: query, $options: 'i' };
  }

  if (onlyUnique) {
    filters.frequency = 1;
  }

  const cursor = collection.find(filters).sort({createdAt: -1}).limit(limit);

  const results = await cursor.toArray();
  return results;
}
