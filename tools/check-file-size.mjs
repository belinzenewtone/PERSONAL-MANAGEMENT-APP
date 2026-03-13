import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const allowlistPath = path.join(__dirname, 'file-size-allowlist.json');

const extensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const ignoredDirs = new Set([
  '.git',
  '.expo',
  '.turbo',
  'node_modules',
  'dist',
  'build',
]);

const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
const maxLines = allowlist.maxLines ?? 300;
const legacyMap = new Map(
  (allowlist.legacy ?? []).map((entry) => [entry.file, entry.maxAllowedLines]),
);

const violations = [];
const warnings = [];
const seenLegacy = new Set();

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split(/\r?\n/).length;
}

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }
      walk(path.join(dirPath, entry.name));
      continue;
    }

    const ext = path.extname(entry.name);
    if (!extensions.has(ext)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
    const lines = countLines(fullPath);

    if (lines <= maxLines) {
      if (legacyMap.has(relativePath)) {
        warnings.push(
          `Allowlist entry can be removed: ${relativePath} is now ${lines} lines.`,
        );
        seenLegacy.add(relativePath);
      }
      continue;
    }

    if (!legacyMap.has(relativePath)) {
      violations.push(
        `New violation: ${relativePath} has ${lines} lines (limit ${maxLines}).`,
      );
      continue;
    }

    seenLegacy.add(relativePath);
    const allowedMax = legacyMap.get(relativePath);
    if (lines > allowedMax) {
      violations.push(
        `Legacy file grew: ${relativePath} has ${lines} lines (baseline ${allowedMax}, limit ${maxLines}).`,
      );
    }
  }
}

walk(root);

for (const legacyFile of legacyMap.keys()) {
  if (!seenLegacy.has(legacyFile)) {
    warnings.push(`Allowlist entry not matched: ${legacyFile}.`);
  }
}

if (warnings.length > 0) {
  console.log('File-size warnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
  console.log('');
}

if (violations.length > 0) {
  console.error('File-size check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `File-size check passed. New/edited source files must stay at or under ${maxLines} lines.`,
);
