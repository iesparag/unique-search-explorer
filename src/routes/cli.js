#!/usr/bin/env node
import process from 'process';
import readline from 'readline';
import {addOrUpdateItem, searchItems} from '../services/uniquenessService.js';

async function cli() {
  const [, , command, ...args] = process.argv;

  try {
    if (command === 'add') {
      const content = args.join(' ').trim();
      if (!content) {
        console.error('Error: Please provide content text to add.');
        process.exit(1);
      }
      const saved = await addOrUpdateItem({content});
      console.log('Item saved:');
      console.log(saved);
      process.exit(0);
    }

    if (command === 'search') {
      const queryIndex = args.indexOf('--query');
      const onlyUniqueIndex = args.indexOf('--onlyUnique');
      const limitIndex = args.indexOf('--limit');

      let query = '';
      let onlyUnique = false;
      let limit = 20;

      if (queryIndex > -1 && args.length > queryIndex + 1) {
        query = args[queryIndex + 1];
      }
      if (onlyUniqueIndex > -1) {
        onlyUnique = true;
      }
      if (limitIndex > -1 && args.length > limitIndex + 1) {
        const l = Number(args[limitIndex + 1]);
        if (!Number.isNaN(l) && l > 0) {
          limit = l;
        }
      }

      const results = await searchItems({query, onlyUnique, limit});
      if (results.length === 0) {
        console.log('No matching items found.');
      } else {
        for (const item of results) {
          console.log(`- _id: ${item._id}`);
          console.log(`  Content: ${item.content}`);
          console.log(`  Frequency: ${item.frequency}`);
          console.log('');
        }
      }
      process.exit(0);
    }

    console.log('Unique Search Explorer CLI');
    console.log('Usage:');
    console.log('  add <content>           Add a new item');
    console.log('  search [--query <text>] [--onlyUnique] [--limit <number>]  Search items');
    process.exit(0);
  } catch (err) {
    console.error('Error during CLI command:', err);
    process.exit(1);
  }
}

export default cli;
