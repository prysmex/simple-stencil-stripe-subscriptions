#!/usr/bin/env node
// Usage: pricing-table-prerender [config file, default: pricing.prerender.mjs]
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prerenderPages } from '../prerender/index.mjs';

const configPath = resolve(process.argv[2] ?? 'pricing.prerender.mjs');

try {
  const { default: config } = await import(pathToFileURL(configPath).href);
  // template and output paths are relative to the config file
  await prerenderPages(typeof config === 'function' ? await config() : config, { cwd: dirname(configPath) });
} catch (error) {
  console.error(`pricing-table-prerender: ${error.message}`);
  process.exit(1);
}
