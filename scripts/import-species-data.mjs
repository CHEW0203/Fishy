import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SPECIES_FIELDS = [
  'common_name',
  'scientific_name',
  'category_id',
  'family',
  'water_type',
  'origin',
  'adult_size_min_cm',
  'adult_size_max_cm',
  'lifespan_min_years',
  'lifespan_max_years',
  'temperament',
  'diet',
  'care_level',
  'temperature_min_c',
  'temperature_max_c',
  'ph_min',
  'ph_max',
  'hardness_min_dgh',
  'hardness_max_dgh',
  'minimum_tank_size_liters',
  'tank_level',
  'schooling_behavior',
  'description',
  'care_notes',
  'feeding_notes',
  'compatibility_notes',
  'avoid_with_notes',
  'image_url',
  'thumbnail_url',
  'image_license',
  'image_source_url',
  'verification_status',
  'confidence_level',
  'last_reviewed_at',
];

const REQUIRED_FIELDS = ['common_name', 'scientific_name', 'water_type'];
const DEFAULTED_FIELDS = new Set([
  'temperament',
  'diet',
  'care_level',
  'verification_status',
  'confidence_level',
]);
const SOURCE_FIELDS = [
  'source_name',
  'source_url',
  'source_type',
  'fields_supported',
  'notes',
  'retrieved_at',
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputPath = args.find((arg) => !arg.startsWith('--'));

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

function cleanValue(value) {
  if (value === undefined || value === '') {
    return null;
  }

  return value;
}

function buildSpeciesPayload(record) {
  const payload = {};

  for (const field of SPECIES_FIELDS) {
    if (field in record) {
      const value = cleanValue(record[field]);

      if (value === null && DEFAULTED_FIELDS.has(field)) {
        continue;
      }

      payload[field] = value;
    } else if (
      field !== 'common_name' &&
      field !== 'scientific_name' &&
      field !== 'water_type' &&
      field !== 'temperament' &&
      field !== 'diet' &&
      field !== 'care_level' &&
      field !== 'verification_status' &&
      field !== 'confidence_level'
    ) {
      payload[field] = null;
    }
  }

  return payload;
}

function buildSourcePayload(source, speciesId) {
  const payload = { species_id: speciesId };

  for (const field of SOURCE_FIELDS) {
    if (field === 'fields_supported' && typeof source[field] === 'string') {
      payload[field] = source[field]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (field in source) {
      payload[field] = cleanValue(source[field]);
    } else if (field !== 'source_type') {
      payload[field] = null;
    }
  }

  if (!payload.source_type) {
    payload.source_type = 'other';
  }

  return payload;
}

function validateRecord(record, index) {
  const missingFields = REQUIRED_FIELDS.filter((field) => !String(record?.[field] ?? '').trim());

  if (missingFields.length > 0) {
    return {
      ok: false,
      reason: `Row ${index + 1} missing required field(s): ${missingFields.join(', ')}`,
    };
  }

  return { ok: true };
}

async function readRecords(filePath) {
  const content = await readFile(path.resolve(process.cwd(), filePath), 'utf8');
  const records = JSON.parse(content);

  if (!Array.isArray(records)) {
    throw new Error('Import file must be a JSON array of species objects.');
  }

  return records;
}

async function supabaseRequest(url, anonKey, table, body, prefer = 'return=representation') {
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} request failed (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function upsertSpecies(url, anonKey, payload) {
  const data = await supabaseRequest(
    url,
    anonKey,
    'fish_species?on_conflict=scientific_name',
    payload,
    'resolution=merge-duplicates,return=representation',
  );

  return Array.isArray(data) ? data[0] : data;
}

async function insertSources(url, anonKey, sourceRows) {
  if (sourceRows.length === 0) {
    return 0;
  }

  await supabaseRequest(
    url,
    anonKey,
    'fish_species_sources',
    sourceRows,
    'return=minimal',
  );

  return sourceRows.length;
}

function printSummary(summary) {
  console.log(`Rows read: ${summary.rowsRead}`);
  console.log(`Rows valid: ${summary.rowsValid}`);
  console.log(`Rows skipped: ${summary.rowsSkipped}`);
  console.log(`Rows inserted/updated: ${summary.rowsInsertedOrUpdated}`);
  console.log(`Source rows inserted: ${summary.sourceRowsInserted}`);
}

async function main() {
  await loadLocalEnv();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const summary = {
    rowsRead: 0,
    rowsValid: 0,
    rowsSkipped: 0,
    rowsInsertedOrUpdated: 0,
    sourceRowsInserted: 0,
  };

  if (!inputPath) {
    if (dryRun) {
      console.log('Dry run: no input file provided. Pass a JSON file path to validate records.');
      printSummary(summary);
      return;
    }

    throw new Error('Usage: node scripts/import-species-data.mjs path/to/species.json [--dry-run]');
  }

  if (!dryRun && (!supabaseUrl || !anonKey)) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const records = await readRecords(inputPath);
  summary.rowsRead = records.length;

  for (const [index, record] of records.entries()) {
    const validation = validateRecord(record, index);

    if (!validation.ok) {
      summary.rowsSkipped += 1;
      console.warn(`Skipped: ${validation.reason}`);
      continue;
    }

    summary.rowsValid += 1;
    const speciesPayload = buildSpeciesPayload(record);
    const sources = Array.isArray(record.sources) ? record.sources : [];

    if (dryRun) {
      const validSourceCount = sources.filter((source) => source.source_name).length;
      console.log(
        `Dry run: would upsert ${speciesPayload.scientific_name} with ${validSourceCount} source row(s).`,
      );
      continue;
    }

    const species = await upsertSpecies(supabaseUrl, anonKey, speciesPayload);
    summary.rowsInsertedOrUpdated += 1;

    const sourceRows = sources
      .filter((source) => source.source_name)
      .map((source) => buildSourcePayload(source, species.id));

    try {
      summary.sourceRowsInserted += await insertSources(supabaseUrl, anonKey, sourceRows);
    } catch (error) {
      console.warn(
        `Source rows for ${speciesPayload.scientific_name} were not inserted. Review fish_species_sources constraints or RLS. ${error.message}`,
      );
    }
  }

  printSummary(summary);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
