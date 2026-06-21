import express from 'express';
import {addOrUpdateItem, searchItems} from '../services/uniquenessService.js';

const router = express.Router();

// Allowed uniqueness tags for filtering
const uniquenessTags = new Set(['UNIQUE', 'RARE', 'COMMON']);

// POST /items - Add a new item
router.post('/', async (req, res) => {
  try {
    const { content, title, source } = req.body || {};

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Field "content" is required and must be a non-empty string.' });
    }

    // Optional title validation if provided
    if (title != null && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Field "title", if provided, must be a non-empty string.' });
    }

    // Optional source validation if provided
    if (source != null && (typeof source !== 'string' || !source.trim())) {
      return res.status(400).json({ error: 'Field "source", if provided, must be a non-empty string.' });
    }

    const itemData = {
      content: content.trim(),
      ...(title ? { title: title.trim() } : {}),
      ...(source ? { source: source.trim() } : {})
    };

    const savedItem = await addOrUpdateItem(itemData);
    res.status(201).json(savedItem);
  } catch (err) {
    if (err.code === 11000) { // duplicate key error from Mongo
      return res.status(409).json({ error: 'Duplicate item detected by hash' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /items - Search items
// Query params: query (string), uniquenessTag (UNIQUE, RARE, COMMON), sort (createdAt|relevance), page (number), limit (number)
router.get('/', async (req, res) => {
  try {
    let { query, uniquenessTag, sort, page, limit } = req.query;

    if (typeof query !== 'string') query = '';
    else query = query.trim();

    if (typeof uniquenessTag === 'string') {
      uniquenessTag = uniquenessTag.trim().toUpperCase();
      if (!uniquenessTags.has(uniquenessTag)) {
        return res.status(400).json({ error: `Invalid uniquenessTag. Allowed values: UNIQUE, RARE, COMMON` });
      }
    } else {
      uniquenessTag = null;
    }

    if (typeof sort !== 'string') sort = 'createdAt';
    else sort = sort.trim();
    if (!['createdAt', 'relevance'].includes(sort)) {
      return res.status(400).json({ error: `Invalid sort. Allowed values: createdAt, relevance` });
    }

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;

    // Build filters
    const filters = {};
    if (query) {
      filters.content = { $regex: query, $options: 'i' };
    }

    if (uniquenessTag) {
      filters.uniquenessTag = uniquenessTag;
    }

    const from = (page - 1) * limit;

    let sortOption;
    if (sort === 'createdAt') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'relevance') {
      // For simplicity, approximate relevance by frequency ascending (unique/rare first), then createdAt descending
      // Lower frequency means more relevance to uniqueness
      sortOption = { frequency: 1, createdAt: -1 };
    }

    const collection = await import('../models/item.js').then(m => m.getItemsCollection());

    const cursor = collection.find(filters).sort(sortOption).skip(from).limit(limit);

    const items = await cursor.toArray();

    res.json({ items, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
