import {getItemsCollection} from '../models/item.js';
import {hashContent} from '../utils/hash.js';

/**
 * Tags based on frequency counts
 */
const Tags = {
  UNIQUE: 'UNIQUE',
  RARE: 'RARE',
  COMMON: 'COMMON',
};

/**
 * Determine uniqueness tag by frequency count
 * @param {number} frequency
 * @returns {string} tag
 */
function getUniquenessTag(frequency) {
  if (frequency === 1) return Tags.UNIQUE;
  if (frequency >= 2 && frequency <= 5) return Tags.RARE;
  return Tags.COMMON;
}

/**
 * Adds an item to the database, computes hash to find uniqueness.
 * If an item with the same hash exists, increments frequency of all such items.
 * If no existing, inserts new item with frequency = 1.
 * Updates uniquenessTag for all items with the hash accordingly.
 * Returns the saved or updated item.
 *
 * @param {Object} itemData - item fields (at least content/property to hash)
 * @returns {Object} saved item document
 */
export async function addOrUpdateItem(itemData) {
  if (!itemData || typeof itemData !== 'object') {
    throw new TypeError('itemData must be an object');
  }

  if (typeof itemData.content !== 'string' || !itemData.content.trim()) {
    throw new Error('Field "content" is required and must be a non-empty string.');
  }

  const collection = getItemsCollection();

  // Compute a hash from the item content (assuming 'content' field)
  const contentTrimmed = itemData.content.trim();
  const hash = hashContent(contentTrimmed);

  const now = new Date();

  // Find all items with this hash
  const itemsWithHash = await collection.find({hash}).toArray();

  if (itemsWithHash.length > 0) {
    // There are existing items with the same hash
    // Increment frequency for all such items
    const currentFrequency = itemsWithHash[0].frequency || 1;
    const newFrequency = currentFrequency + 1;

    // Update frequency and lastSeen for all items with this hash
    await collection.updateMany(
      {hash},
      { $set: { frequency: newFrequency, lastSeen: now } }
    );

    // Determine new uniquenessTag
    const tag = getUniquenessTag(newFrequency);

    // Update uniquenessTag for all items with this hash
    await collection.updateMany(
      {hash},
      { $set: { uniquenessTag: tag } }
    );

    // Return updated item info (based on first existing item data)
    return {
      ...itemData,
      hash,
      frequency: newFrequency,
      uniquenessTag: tag,
      createdAt: itemsWithHash[0].createdAt,
      lastSeen: now,
    };
  }

  // No existing item with same hash: create new one with frequency 1 and tag UNIQUE
  const tag = getUniquenessTag(1);
  const newItem = {
    ...itemData,
    content: contentTrimmed,
    hash,
    frequency: 1,
    uniquenessTag: tag,
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
    // only frequency 1 needed
    filters.frequency = 1;
  }

  const cursor = collection.find(filters).sort({createdAt: -1}).limit(limit);

  const results = await cursor.toArray();
  return results;
}
