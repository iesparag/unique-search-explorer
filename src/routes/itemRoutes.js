import express from 'express';
import {addOrUpdateItem, searchItems} from '../services/uniquenessService.js';
import {getItemsCollection} from '../models/item.js';

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

    const savedItem = await addOrUpdateItem(itemData);
    res.status(201).json(savedItem);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate item detected by hash' });
    }
    console.error(err);
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
      // Sort first by frequency ascending, then createdAt descending
      sortOption = { frequency: 1, createdAt: -1 };
    }

    const collection = getItemsCollection();

    // For relevance sorting and filtering by uniquenessTag, use aggregation to support paging correctly
    if (sort === 'relevance') {
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
      // Normal find for createdAt sorting
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

    // Aggregate by hash to get item counts per frequency
    // Correct the aggregation to return counts of items per frequency correctly
    const aggregationPipeline = [
      {
        $group: {
          _id: '$hash',
          frequency: { $max: '$frequency' },
          count: { $sum: 1 },
          createdAt: { $min: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$count' },
          uniqueItems: { $sum: { $cond: [{ $eq: ['$frequency', 1] }, '$count', 0] } },
          rareItems: { $sum: { $cond: [{ $and: [{ $gt: ['$frequency', 1] }, { $lte: ['$frequency', 5] }] }, '$count', 0] } },
          commonItems: { $sum: { $cond: [{ $gt: ['$frequency', 5] }, '$count', 0] } },
          frequencies: { $push: '$frequency' },
          frequencyGroups: { $push: { frequency: '$frequency', count: '$count' } }
        }
      }
    ];

    const aggregationResult = await collection.aggregate(aggregationPipeline).toArray();

    if (aggregationResult.length === 0) {
      return res.json({
        totalItems: 0,
        UNIQUE: 0,
        RARE: 0,
        COMMON: 0,
        frequencyDistribution: {}
      });
    }

    const data = aggregationResult[0];

    // Build frequency distribution: count of groups per frequency
    // Use frequencyGroups to build accurate distribution
    const frequencyCountMap = {};
    for (const fg of data.frequencyGroups) {
      const key = String(fg.frequency);
      frequencyCountMap[key] = (frequencyCountMap[key] || 0) + 1;
    }

    res.json({
      totalItems: data.totalItems,
      UNIQUE: data.uniqueItems,
      RARE: data.rareItems,
      COMMON: data.commonItems,
      frequencyDistribution: frequencyCountMap
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
