#!/usr/bin/env node
/**
 * Audit script: verify all displayed species text strings have Chinese translations.
 * Run: node scripts/i18n/auditSpeciesLocalization.js
 */

const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname, '../../database/seed/malaysia_v1');
const ZH_MAP_PATH = path.join(__dirname, '../../src/i18n/speciesText.zh.ts');

// Fields displayed in Species Detail that need Chinese translation.
const TARGET_FIELDS = new Set([
  'origin', 'description', 'care_notes', 'feeding_notes',
  'compatibility_notes', 'avoid_with_notes',
]);

/** Load the existing Chinese map keys from speciesText.zh.ts */
function loadZhMapKeys() {
  if (!fs.existsSync(ZH_MAP_PATH)) {
    console.error('ERROR: speciesText.zh.ts not found at', ZH_MAP_PATH);
    process.exit(1);
  }
  const content = fs.readFileSync(ZH_MAP_PATH, 'utf8');
  const keys = new Set();
  // Match single-quoted keys: 'some text':
  const reSingle = /'((?:[^'\\]|\\.)*)'\s*:/g;
  let m;
  while ((m = reSingle.exec(content)) !== null) {
    keys.add(m[1]);
  }
  // Match double-quoted keys (used when key contains apostrophes): "some text":
  const reDouble = /"((?:[^"\\]|\\.)*)"\s*:/g;
  while ((m = reDouble.exec(content)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

/** Parse all SQL single-quoted strings from text, returning {value, start, end}[]. */
function extractAllSqlStrings(text) {
  const results = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "'") {
      let j = i + 1;
      let val = '';
      let closed = false;
      while (j < text.length) {
        if (text[j] === "'" && text[j + 1] === "'") {
          val += "'"; j += 2;
        } else if (text[j] === "'") {
          closed = true; j++;
          break;
        } else {
          val += text[j]; j++;
        }
      }
      if (closed) {
        results.push({ value: val, start: i, end: j });
        i = j;
        continue;
      }
    }
    i++;
  }
  return results;
}

/**
 * For each seed SQL file, find the column definitions and extract string values
 * for the target fields. Uses a column-position approach based on AS v (...) definitions.
 */
function extractDisplayedStrings() {
  const allStrings = new Set();
  const sqlFiles = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const content = fs.readFileSync(path.join(SEED_DIR, file), 'utf8');

    // Find "AS v ( ... ) WHERE" to get column order
    const colMatch = content.match(/\) AS v \(\s*([\s\S]*?)\s*\)\s*WHERE/);
    if (!colMatch) continue;

    const cols = colMatch[1]
      .replace(/\s+/g, ' ')
      .split(',')
      .map(c => c.trim());

    const targetIndices = [];
    cols.forEach((col, idx) => {
      if (TARGET_FIELDS.has(col)) targetIndices.push(idx);
    });
    if (targetIndices.length === 0) continue;

    // Find "FROM (VALUES ... ) AS v" block
    const valuesMatch = content.match(/FROM \(VALUES\s*([\s\S]*?)\n\) AS v/);
    if (!valuesMatch) continue;

    const valuesBlock = valuesMatch[1];

    // Split rows by balanced parentheses
    const rows = splitBalancedRows(valuesBlock);

    for (const row of rows) {
      const tokens = tokenizeRow(row, cols.length);
      for (const idx of targetIndices) {
        const val = tokens[idx];
        if (typeof val === 'string' && val.length > 0) {
          allStrings.add(val);
        }
      }
    }
  }

  return allStrings;
}

/** Split a VALUES block into individual row strings using balanced parenthesis counting. */
function splitBalancedRows(block) {
  const rows = [];
  let i = 0;
  while (i < block.length) {
    // Skip whitespace/commas between rows
    while (i < block.length && (block[i] === ',' || block[i] === '\n' || block[i] === '\r' || block[i] === ' ' || block[i] === '\t')) i++;
    if (i >= block.length) break;
    if (block[i] !== '(') { i++; continue; }

    // Read one row
    let depth = 0;
    let start = i;
    let j = i;
    let inStr = false;

    while (j < block.length) {
      if (inStr) {
        if (block[j] === "'" && block[j + 1] === "'") { j += 2; continue; }
        if (block[j] === "'") { inStr = false; j++; continue; }
        j++;
        continue;
      }
      if (block[j] === "'") { inStr = true; j++; continue; }
      if (block[j] === '(') { depth++; j++; continue; }
      if (block[j] === ')') {
        depth--;
        if (depth === 0) {
          rows.push(block.slice(start, j + 1));
          i = j + 1;
          break;
        }
        j++;
        continue;
      }
      j++;
    }
    if (depth !== 0) break; // malformed
  }
  return rows;
}

/**
 * Tokenize a single VALUES row "(v1, v2, ...)" into an array of string|null|'__EXPR__'.
 * Each token corresponds to one column position.
 */
function tokenizeRow(row) {
  const tokens = [];
  // Strip outer parens
  let src = row.slice(1, row.lastIndexOf(')'));

  let i = 0;
  while (i <= src.length) {
    // Skip whitespace
    while (i < src.length && (src[i] === ' ' || src[i] === '\n' || src[i] === '\r' || src[i] === '\t')) i++;
    if (i >= src.length) break;

    if (src[i] === "'") {
      // String literal
      let j = i + 1;
      let val = '';
      while (j < src.length) {
        if (src[j] === "'" && src[j + 1] === "'") { val += "'"; j += 2; }
        else if (src[j] === "'") { j++; break; }
        else { val += src[j]; j++; }
      }
      tokens.push(val);
      i = j;
      // Skip comma
      while (i < src.length && (src[i] === ',' || src[i] === ' ')) i++;
      continue;
    }

    if (src[i] === '(') {
      // Nested expression (SELECT subquery etc.) — skip balanced parens
      let depth = 0;
      while (i < src.length) {
        if (src[i] === "'") {
          i++;
          while (i < src.length) {
            if (src[i] === "'" && src[i + 1] === "'") { i += 2; continue; }
            if (src[i] === "'") { i++; break; }
            i++;
          }
          continue;
        }
        if (src[i] === '(') depth++;
        if (src[i] === ')') { depth--; if (depth === 0) { i++; break; } }
        i++;
      }
      tokens.push(null);
      while (i < src.length && (src[i] === ',' || src[i] === ' ')) i++;
      continue;
    }

    // NULL, number, true/false, or other keyword — read to next comma
    let j = i;
    while (j < src.length && src[j] !== ',') j++;
    const raw = src.slice(i, j).trim().toUpperCase();
    tokens.push(raw === 'NULL' ? null : null);
    i = j;
    while (i < src.length && (src[i] === ',' || src[i] === ' ')) i++;
  }

  return tokens;
}

function main() {
  const displayed = extractDisplayedStrings();
  const zhKeys = loadZhMapKeys();

  const mapped = [];
  const unmapped = [];

  for (const str of displayed) {
    if (zhKeys.has(str)) {
      mapped.push(str);
    } else {
      unmapped.push(str);
    }
  }

  console.log('\n=== Species Localization Audit ===');
  console.log(`Total unique displayed strings : ${displayed.size}`);
  console.log(`Mapped (have Chinese)          : ${mapped.length}`);
  console.log(`Unmapped (missing Chinese)     : ${unmapped.length}`);

  if (unmapped.length > 0) {
    console.log('\n--- Unmapped strings ---');
    unmapped.forEach((s, i) => {
      console.log(`${i + 1}. ${JSON.stringify(s.slice(0, 120))}${s.length > 120 ? '...' : ''}`);
    });
    console.log('\nResult: INCOMPLETE — add the above to speciesText.zh.ts');
    process.exit(1);
  } else {
    console.log('\nResult: COMPLETE — all displayed strings have Chinese mappings.\n');
    process.exit(0);
  }
}

main();
