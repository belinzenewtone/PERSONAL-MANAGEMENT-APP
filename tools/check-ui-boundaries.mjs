import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const targetRoots = [
  path.join(repoRoot, 'apps', 'mobile', 'app'),
  path.join(repoRoot, 'apps', 'mobile', 'src', 'components'),
];

const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const forbiddenPatterns = [
  /@supabase\/supabase-js/,
  /from\s+['"].*lib\/supabase['"]/,
  /require\(['"].*lib\/supabase['"]\)/,
];

const violations = [];

function scanFile(fullPath) {
  const basename = path.basename(fullPath);
  if (basename.startsWith('_layout.')) {
    return;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      violations.push(path.relative(repoRoot, fullPath).replace(/\\/g, '/'));
      return;
    }
  }
}

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!exts.has(path.extname(entry.name))) continue;
    scanFile(fullPath);
  }
}

for (const root of targetRoots) {
  walk(root);
}

const featureRoot = path.join(repoRoot, 'apps', 'mobile', 'src', 'features');
for (const feature of fs.readdirSync(featureRoot, { withFileTypes: true })) {
  if (!feature.isDirectory()) continue;
  const componentsDir = path.join(featureRoot, feature.name, 'components');
  if (fs.existsSync(componentsDir)) walk(componentsDir);
}

if (violations.length > 0) {
  console.error('UI boundary check failed. Leaf UI files must not import Supabase directly:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('UI boundary check passed. Leaf UI files do not import Supabase directly.');
