import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', 'apps', 'mobile', 'app');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const maxRouteLines = 40;
const violations = [];

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!exts.has(path.extname(entry.name))) continue;
    if (entry.name.startsWith('_layout.')) continue;

    const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/).length;
    if (lines > maxRouteLines) {
      const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
      violations.push(`${relativePath} has ${lines} lines (limit ${maxRouteLines}).`);
    }
  }
}

walk(root);

if (violations.length > 0) {
  console.error('Thin route check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Thin route check passed. Non-layout route files stay at or under ${maxRouteLines} lines.`);
