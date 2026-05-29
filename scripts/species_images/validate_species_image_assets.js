const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const IMAGE_DIR = path.join(ROOT, 'database', 'seed', 'species_images');
const CHECKLIST_PATH = path.join(IMAGE_DIR, 'species_image_checklist.csv');
const PROMPTS_PATH = path.join(IMAGE_DIR, 'ai_placeholder_prompts.json');
const ASSETS_PATH = path.join(IMAGE_DIR, 'final_species_image_assets.json');
const UPLOADED_ASSETS_PATH = path.join(IMAGE_DIR, 'final_species_image_assets_uploaded.json');
const SQL_PATH = path.join(IMAGE_DIR, 'update_species_images.sql');
const ALLOWED_APP_PREFIXES = ['app/', 'src/components/', 'src/i18n/', 'src/services/'];
const ALLOWED_ASSET_STATUSES = new Set(['ready_real_image', 'ready_ai_placeholder', 'pending_upload']);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift();
  return rows
    .filter((csvRow) => csvRow.length && csvRow.some(Boolean))
    .map((csvRow) => Object.fromEntries(header.map((column, index) => [column, csvRow[index] || ''])));
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function publicUrlLooksFake(url) {
  if (!url) return false;
  return /example\.com|localhost|placeholder|fake|todo|your-project|supabase\.co\/storage\/v1\/object\/public\/species-images\/(real|ai)\/$|\.invalid/i.test(url);
}

function getChangedFiles() {
  try {
    const { execFileSync } = require('child_process');
    return execFileSync('git', ['status', '--short'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^.. /, ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const failures = [];
  const checklist = parseCsv(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
  const prompts = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
  const inputPath = fs.existsSync(UPLOADED_ASSETS_PATH) ? UPLOADED_ASSETS_PATH : ASSETS_PATH;
  const assets = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const promptKeys = new Set(prompts.map((prompt) => prompt.species_key));
  const assetKeyCounts = new Map();

  for (const asset of assets) {
    assetKeyCounts.set(asset.species_key, (assetKeyCounts.get(asset.species_key) || 0) + 1);
  }

  assert(assets.length === 303, `Expected 303 final asset rows, found ${assets.length}.`, failures);
  assert([...assetKeyCounts.values()].every((count) => count === 1), 'Duplicate species_key found in final assets.', failures);

  for (const row of checklist) {
    if (row.image_status === 'licensed_photo') {
      assert(row.candidate_image_url && row.source_page_url && row.license && row.credit && row.confidence === 'high', `Licensed row missing required metadata: ${row.species_key}`, failures);
    }

    if (row.image_status === 'ai_placeholder_needed' && row.needs_ai_generated === 'true') {
      assert(promptKeys.has(row.species_key), `AI placeholder row missing prompt: ${row.species_key}`, failures);
    }
  }

  for (const asset of assets) {
    assert(ALLOWED_ASSET_STATUSES.has(asset.asset_status), `Unexpected asset_status for ${asset.species_key}: ${asset.asset_status}`, failures);
    assert(asset.local_file_path, `Asset missing local_file_path: ${asset.species_key}`, failures);

    if (asset.local_file_path) {
      const absolutePath = path.join(ROOT, asset.local_file_path);
      assert(fs.existsSync(absolutePath), `Asset local file does not exist: ${asset.species_key} -> ${asset.local_file_path}`, failures);
      if (fs.existsSync(absolutePath)) {
        assert(fs.statSync(absolutePath).size > 0, `Asset local file is empty: ${asset.species_key} -> ${asset.local_file_path}`, failures);
      }
    }

    if (asset.asset_status === 'ready_real_image') {
      assert(asset.local_file_path.includes('/generated/real/') || asset.local_file_path.includes('\\generated\\real\\'), `Ready real image is not under generated/real: ${asset.species_key}`, failures);
      assert(asset.image_license && asset.image_license !== 'Generated Placeholder', `Ready real image missing real license metadata: ${asset.species_key}`, failures);
      assert(asset.image_source_url && asset.image_source_url !== 'Generated Placeholder', `Ready real image missing real source metadata: ${asset.species_key}`, failures);
    }

    if (asset.asset_status === 'ready_ai_placeholder') {
      assert(asset.local_file_path.endsWith(`generated/ai/${asset.species_key}.png`), `Generated placeholder has unexpected local path: ${asset.species_key}`, failures);
      assert(asset.storage_path === `ai/${asset.species_key}.png`, `Generated placeholder has unexpected storage path: ${asset.species_key}`, failures);
      assert(asset.image_license === 'Generated Placeholder', `Generated placeholder has wrong license: ${asset.species_key}`, failures);
      assert(asset.image_source_url === 'Generated Placeholder', `Generated placeholder has wrong source URL: ${asset.species_key}`, failures);
      assert(asset.credit === 'Fishy generated placeholder', `Generated placeholder has wrong credit: ${asset.species_key}`, failures);
    }

    assert(!publicUrlLooksFake(asset.public_url), `Fake-looking public_url found: ${asset.species_key}`, failures);
    if (asset.public_url) {
      assert(/^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/species-images\/(real|ai)\//.test(asset.public_url), `Unexpected public_url format: ${asset.species_key}`, failures);
      assert(!asset.public_url.includes(asset.local_file_path), `public_url contains local file path: ${asset.species_key}`, failures);
    }
  }

  if (fs.existsSync(SQL_PATH)) {
    const sql = fs.readFileSync(SQL_PATH, 'utf8');
    const executableUpdates = (sql.match(/^UPDATE fish_species$/gm) || []).length;
    const rowsWithPublicUrl = assets.filter((asset) => asset.public_url).length;
    assert(executableUpdates === rowsWithPublicUrl, `SQL UPDATE count (${executableUpdates}) does not match rows with public_url (${rowsWithPublicUrl}).`, failures);
    if (rowsWithPublicUrl === 0) {
      assert(sql.includes('No executable UPDATE statements'), 'SQL file should explain why no UPDATE statements were generated.', failures);
    }
    assert(!/image_url\s*=\s*'database\/seed\/species_images\//.test(sql), 'SQL file contains a local file path as image_url.', failures);
  }

  const changedAppFiles = getChangedFiles().filter((file) => ALLOWED_APP_PREFIXES.some((prefix) => file.replace(/\\/g, '/').startsWith(prefix)));
  assert(changedAppFiles.length === 0, `App/source files changed unexpectedly: ${changedAppFiles.join(', ')}`, failures);

  const counts = assets.reduce((acc, asset) => {
    acc[asset.asset_status] = (acc[asset.asset_status] || 0) + 1;
    return acc;
  }, {});

  const result = {
    passed: failures.length === 0,
    inputFile: path.relative(ROOT, inputPath).replace(/\\/g, '/'),
    finalAssetRows: assets.length,
    publicUrlCount: assets.filter((asset) => asset.public_url).length,
    assetStatusCounts: counts,
    failures,
  };

  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exit(1);
}

main();
