#!/usr/bin/env node
import process from 'process';
import { addOrUpdateItem, searchItems } from '../services/uniquenessService.js';

async function cli() {
  const [, , command, ...args] = process.argv;

  try {
    if (command === 'add-item' || command === 'add') {
      if (args.length === 0) {
        console.error('Error: Please provide item parameters as key=value pairs. Example: add-item content="your content" title="title" source="source"');
        process.exit(1);
      }

      // If invoked like `node src/index.js add "content here"`, treat all args as single content string if no '=' present
      if (args.length === 1 && !args[0].includes('=')) {
        const contentValue = args[0];
        if (typeof contentValue !== 'string' || !contentValue.trim()) {
          console.error('Error: Field "content" is required and must be a non-empty string.');
          process.exit(1);
        }

        // Only content provided, add reasonable defaults (title and source absent)
        const saved = await addOrUpdateItem({ content: contentValue.trim() });
        console.log('Item saved:');
        console.log(JSON.stringify(saved, null, 2));
        process.exit(0);
      }

      // Otherwise parse args like key=value, support simple quoting
      const itemData = {};
      for (const arg of args) {
        // Match key=value or key="value with spaces"
        const match = arg.match(/^([a-zA-Z]+)=(.*)$/);
        if (!match) {
          console.error(`Error: Invalid argument format: ${arg}. Expected key=value.`);
          process.exit(1);
        }
        let [, key, value] = match;

        // Remove surrounding quotes if any
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        itemData[key] = value;
      }

      // Validate required field content
      if (!itemData.content || typeof itemData.content !== 'string' || !itemData.content.trim()) {
        console.error('Error: Field "content" is required and must be a non-empty string.');
        process.exit(1);
      }

      // Trim strings (content, title, source) if they exist
      if (itemData.content) {
        itemData.content = itemData.content.trim();
      }
      if (itemData.title) {
        itemData.title = itemData.title.trim();
      }
      if (itemData.source) {
        itemData.source = itemData.source.trim();
      }

      const saved = await addOrUpdateItem(itemData);
      console.log('Item saved:');
      console.log(JSON.stringify(saved, null, 2));
      process.exit(0);
    }

    if (command === 'search-items' || command === 'search') {
      // Accept optional flags: --query <text>, --onlyUnique, --limit <number>, --page <number>
      let query = '';
      let onlyUnique = false;
      let limit = 20;
      let page = 1;

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--query') {
          if (i + 1 < args.length) {
            query = args[i + 1];
            i++;
          } else {
            console.error('Error: --query requires a value');
            process.exit(1);
          }
        } else if (arg === '--onlyUnique') {
          onlyUnique = true;
        } else if (arg === '--limit') {
          if (i + 1 < args.length) {
            const l = Number(args[i + 1]);
            if (Number.isNaN(l) || l <= 0) {
              console.error('Error: --limit requires a positive number');
              process.exit(1);
            }
            limit = l;
            i++;
          } else {
            console.error('Error: --limit requires a value');
            process.exit(1);
          }
        } else if (arg === '--page') {
          if (i + 1 < args.length) {
            const p = Number(args[i + 1]);
            if (Number.isNaN(p) || p <= 0) {
              console.error('Error: --page requires a positive number');
              process.exit(1);
            }
            page = p;
            i++;
          } else {
            console.error('Error: --page requires a value');
            process.exit(1);
          }
        } else {
          console.error(`Error: Unknown argument: ${arg}`);
          process.exit(1);
        }
      }

      // CLI handles pagination locally: fetch limit*page, slice page
      const resultsAll = await searchItems({ query, onlyUnique, limit: limit * page });
      const results = resultsAll.slice((page - 1) * limit, page * limit);

      if (results.length === 0) {
        console.log('No matching items found.');
      } else {
        console.log(`Search results (page ${page}, limit ${limit}):`);
        for (const item of results) {
          console.log(`- _id: ${item._id}`);
          console.log(`  Content: ${item.content}`);
          // frequency and uniquenessTag may be missing in some items, provide defaults
          console.log(`  Frequency: ${item.frequency ?? 'N/A'}`);
          console.log(`  UniquenessTag: ${item.uniquenessTag ?? 'N/A'}`);
          if (item.title) console.log(`  Title: ${item.title}`);
          if (item.source) console.log(`  Source: ${item.source}`);
          console.log('');
        }
      }

      process.exit(0);
    }

    // If no recognized command given, print usage
    console.log('Unique Search Explorer CLI');
    console.log('Usage:');
    console.log('  add-item content="your content" [title="optional title"] [source="optional source"]');
    console.log('  add "your content"');
    console.log('  search-items [--query <text>] [--onlyUnique] [--limit <number>] [--page <number>]');
    console.log('  search [--query <text>] [--onlyUnique] [--limit <number>] [--page <number>]');
    process.exit(0);
  } catch (err) {
    console.error('Error during CLI command:', err);
    process.exit(1);
  }
}

export default cli;
