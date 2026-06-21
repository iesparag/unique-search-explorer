import express from 'express';
import {addOrUpdateItem, searchItems} from '../services/uniquenessService.js';

const router = express.Router();

// POST /items - Add a new item
router.post('/', async (req, res) => {
  try {
    const {content, ...otherFields} = req.body || {};
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({error: 'Field "content" is required and must be a non-empty string.'});
    }

    const itemData = {content: content.trim(), ...otherFields};
    const savedItem = await addOrUpdateItem(itemData);
    res.status(201).json(savedItem);
  } catch (err) {
    if (err.code === 11000) { // duplicate key error from Mongo
      return res.status(409).json({error: 'Duplicate item detected by hash'});
    }
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
  }
});

// GET /items - Search items
// Query params: query (string), onlyUnique (boolean), limit (number)
router.get('/', async (req, res) => {
  try {
    const query = req.query.query || '';
    const onlyUnique = req.query.onlyUnique === 'true';
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit <= 0) {
      limit = 20;
    }

    const results = await searchItems({query, onlyUnique, limit});
    res.json({items: results});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
  }
});

export default router;
