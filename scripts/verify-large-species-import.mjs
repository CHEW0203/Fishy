import { readFile } from 'node:fs/promises';
import path from 'node:path';

const INPUT_JSON = 'database/seed/large_species_dataset/import_ready_species.json';
const IN_FILTER_CHUNK_SIZE = 200;

function parseEnv(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function loadLocalEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const content = await readFile(envPath, 'utf8');
    parseEnv(content);
  } catch {
    // Environment variables may already be provided by the shell or CI.
  }
}

async function readDataset() {
  const content = await readFile(path.resolve(process.cwd(), INPUT_JSON), 'utf8');
  const records = JSON.parse(content);

  if (!Array.isArray(records)) {
    throw new Error('Import JSON must be an array.');
  }

  return records;
}

async function fetchRest(url, anonKey, tableAndQuery, extraHeaders = {}) {
  const response = await fetch(`${url}/rest/v1/${tableAndQuery}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      ...extraHeaders,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${tableAndQuery} failed (${response.status}): ${text}`);
  }

  return response;
}

async function getTableCount(url, anonKey, tableAndFilter) {
  const response = await fetchRest(url, anonKey, `${tableAndFilter}&limit=0`, {
    Prefer: 'count=exact',
  });
  const contentRange = response.headers.get('content-range');
  const countText = contentRange?.split('/')?.[1];

  return countText && countText !== '*' ? Number(countText) : 0;
}

function inFilter(values) {
  const encoded = values.map((value) => `"${String(value).replace(/"/g, '\\"')}"`).join(',');
  return `in.(${encodeURIComponent(encoded)})`;
}

async function getImportedSpeciesCount(url, anonKey, scientificNames) {
  let total = 0;

  for (let index = 0; index < scientificNames.length; index += IN_FILTER_CHUNK_SIZE) {
    const chunk = scientificNames.slice(index, index + IN_FILTER_CHUNK_SIZE);
    total += await getTableCount(
      url,
      anonKey,
      `fish_species?select=id&scientific_name=${inFilter(chunk)}`,
    );
  }

  return total;
}

async function getRowsByScientificName(url, anonKey, scientificNames) {
  const response = await fetchRest(
    url,
    anonKey,
    `fish_species?select=id,scientific_name,common_name,family,water_type,verification_status&scientific_name=${inFilter(scientificNames)}`,
  );

  return response.json();
}

async function getDuplicateScientificNames(url, anonKey) {
  const rows = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const response = await fetchRest(
      url,
      anonKey,
      'fish_species?select=scientific_name',
      {
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    );
    const pageRows = await response.json();
    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      break;
    }
  }

  const counts = new Map();

  for (const row of rows) {
    const key = row.scientific_name?.trim().toLowerCase();

    if (key) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()].filter(([, count]) => count > 1);
}

async function getSourceRowsForImportedSpecies(url, anonKey, scientificNames) {
  const speciesRows = [];

  for (let index = 0; index < scientificNames.length; index += IN_FILTER_CHUNK_SIZE) {
    const chunk = scientificNames.slice(index, index + IN_FILTER_CHUNK_SIZE);
    const response = await fetchRest(
      url,
      anonKey,
      `fish_species?select=id&scientific_name=${inFilter(chunk)}`,
    );
    speciesRows.push(...await response.json());
  }

  let total = 0;
  const ids = speciesRows.map((row) => row.id);

  for (let index = 0; index < ids.length; index += IN_FILTER_CHUNK_SIZE) {
    const chunk = ids.slice(index, index + IN_FILTER_CHUNK_SIZE);
    total += await getTableCount(url, anonKey, `fish_species_sources?select=id&species_id=${inFilter(chunk)}`);
  }

  return total;
}

function getSampleNames(scientificNames) {
  const samples = [];

  for (let index = 0; index < scientificNames.length && samples.length < 20; index += 500) {
    samples.push(scientificNames[index]);
  }

  return samples;
}

async function main() {
  await loadLocalEnv();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const records = await readDataset();
  const scientificNames = records.map((record) => record.scientific_name);
  const expectedScientificNameCount = new Set(scientificNames.map((name) => name.toLowerCase())).size;
  const actualSpeciesCount = await getTableCount(supabaseUrl, anonKey, 'fish_species?select=id');
  const importedSpeciesCount = await getImportedSpeciesCount(supabaseUrl, anonKey, scientificNames);
  const duplicateScientificNames = await getDuplicateScientificNames(supabaseUrl, anonKey);
  const sampleNames = getSampleNames(scientificNames);
  const sampleRows = await getRowsByScientificName(supabaseUrl, anonKey, sampleNames);
  const foundSamples = new Set(sampleRows.map((row) => row.scientific_name.toLowerCase()));
  const missingSamples = sampleNames.filter((name) => !foundSamples.has(name.toLowerCase()));
  const sourceRows = await getSourceRowsForImportedSpecies(supabaseUrl, anonKey, scientificNames);
  const missingCount = expectedScientificNameCount - importedSpeciesCount;

  console.log(`Expected imported scientific_names: ${expectedScientificNameCount}`);
  console.log(`Actual fish_species table row count: ${actualSpeciesCount}`);
  console.log(`Imported scientific_names found: ${importedSpeciesCount}`);
  console.log(`Missing imported scientific_names: ${missingCount}`);
  console.log(`Duplicate scientific_name count: ${duplicateScientificNames.length}`);
  console.log(`Source rows for imported species: ${sourceRows}`);
  console.log(`Sample records checked: ${sampleNames.length}`);
  console.log(`Sample records found: ${sampleNames.length - missingSamples.length}`);

  if (missingSamples.length > 0) {
    console.log(`Sample records missing: ${missingSamples.join(', ')}`);
  }

  if (duplicateScientificNames.length > 0) {
    console.log('First duplicate scientific_names:');
    for (const [scientificName, count] of duplicateScientificNames.slice(0, 20)) {
      console.log(`  ${scientificName}: ${count}`);
    }
  }

  if (missingCount === 0 && duplicateScientificNames.length === 0 && missingSamples.length === 0) {
    console.log('VERIFICATION PASSED');
  } else {
    console.log('VERIFICATION ISSUES FOUND');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exitCode = 1;
});
