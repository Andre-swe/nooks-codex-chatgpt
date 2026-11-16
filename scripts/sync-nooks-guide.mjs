// Refresh the shipped guide from the owning Nooks source, without a network dependency.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/sync-nooks-guide.mjs <path-to-Nooks/apps/create/lib/mcp-best-practices.mjs>');
const { BEST_PRACTICES_MARKDOWN } = await import(pathToFileURL(resolve(source)).href);
if (typeof BEST_PRACTICES_MARKDOWN !== 'string' || !BEST_PRACTICES_MARKDOWN.startsWith('# MCP design best practices')) throw new Error('The source did not export the Nooks best-practices guide.');
const target = fileURLToPath(new URL('../skills/nooks-design/references/best-practices.md', import.meta.url));
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, '<!-- Generated from Nooks apps/create/lib/mcp-best-practices.mjs; refresh with scripts/sync-nooks-guide.mjs. -->\n\n' + BEST_PRACTICES_MARKDOWN + '\n');
console.log('Updated bundled Nooks best-practices guide.');
