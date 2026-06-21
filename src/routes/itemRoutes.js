import express from 'express';
import {addOrUpdateItem, searchItems} from '../services/uniquenessService.js';
import {getItemsCollection} from '../models/item.js';
import {hashContent} from '../utils/hash.js';

const router = express.Router();

const uniquenessTags = new Set(['UNIQUE', 'RARE', 'COMMON']);

// POST /items - Add a new item
router.post('/', async (req, res) => {
  try {
    const { content, title, source } = req.body || {};

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Field "content" is required and must be a non-empty string.' });
    }

    if (title != null && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Field "title", if provided, must be a non-empty string.' });
    }

    if (source != null && (typeof source !== 'string' || !source.trim())) {
      return res.status(400).json({ error: 'Field "source", if provided, must be a non-empty string.' });
    }

    const itemData = {
      content: content.trim(),
      ...(title ? { title: title.trim() } : {}),
      ...(source ? { source: source.trim() } : {})
    };

    const collection = getItemsCollection();
    
    // Compute hash
    const hash = hashContent(itemData.content);

    // Find existing items with this hash
    const existingItems = await collection.find({ hash }).toArray();
    if (existingItems.length > 0) {
      // Duplicate content hash exists. Respond with 409.
      return res.status(409).json({ error: 'Duplicate item detected by hash' });
    }

    const savedItem = await addOrUpdateItem(itemData);
    res.status(201).json(savedItem);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      // Duplicate key error (hash unique index)
      return res.status(409).json({ error: 'Duplicate item detected by hash' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /items - Search items
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

    const collection = getItemsCollection();

    const from = (page - 1) * limit;

    let sortOption;
    if (sort === 'createdAt') {
      sortOption = { createdAt: -1 };
    } else {
      // sort === 'relevance'
      sortOption = { frequency: 1, createdAt: -1 };
    }

    const filters = {};

    if (query) {
      filters.content = { $regex: query, $options: 'i' };
    }

    if (uniquenessTag) {
      filters.uniquenessTag = uniquenessTag;
    }

    if (sort === 'relevance') {
      // aggregation pipeline
      const pipeline = [];
      if (Object.keys(filters).length > 0) {
        pipeline.push({ $match: filters });
      }

      pipeline.push({ $sort: sortOption });
      pipeline.push({ $skip: from });
      pipeline.push({ $limit: limit });

      const items = await collection.aggregate(pipeline).toArray();
      return res.json({ items, page, limit });
    } else {
      // sort === 'createdAt'
      const cursor = collection.find(filters).sort(sortOption).skip(from).limit(limit);
      const items = await cursor.toArray();
      return res.json({ items, page, limit });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /items/stats - Aggregated uniqueness statistics
router.get('/stats', async (req, res) => {
  try {
    const collection = getItemsCollection();

    // Aggregate counts by uniquenessTag
    const aggregationPipeline = [
      {
        $group: {
          _id: '$uniquenessTag',
          count: { $sum: 1 },
        }
      }
    ];

    const aggregationResult = await collection.aggregate(aggregationPipeline).toArray();

    let countMap = { UNIQUE: 0, RARE: 0, COMMON: 0 };
    let totalItems = 0;

    if (aggregationResult.length > 0) {
      for (const entry of aggregationResult) {
        if (entry._id && countMap.hasOwnProperty(entry._id)) {
          countMap[entry._id] = entry.count;
          totalItems += entry.count;
        } else {
          totalItems += entry.count;
        }
      }
    } else {
      totalItems = await collection.countDocuments();
    }

    // Build frequency distribution
    const freqAgg = await collection.aggregate([
      {
        $group: {
          _id: '$frequency',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const frequencyDistribution = {};
    for (const freqEntry of freqAgg) {
      // Treat null/undefined frequency as 0
      const key = freqEntry._id != null ? String(freqEntry._id) : '0';
      frequencyDistribution[key] = freqEntry.count;
    }

    res.json({
      totalItems,
      UNIQUE: countMap.UNIQUE,
      RARE: countMap.RARE,
      COMMON: countMap.COMMON,
      frequencyDistribution
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
