import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const featuresRoot = path.resolve(__dirname, '..', 'apps', 'mobile', 'src', 'features');
const violations = [];

for (const entry of fs.readdirSync(featuresRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const readmePath = path.join(featuresRoot, entry.name, 'README.md');
  if (!fs.existsSync(readmePath)) {
    violations.push(`Missing README.md for feature "${entry.name}".`);
  }
}

if (violations.length > 0) {
  console.error('Feature README check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Feature README check passed. Every feature directory includes README.md.');
