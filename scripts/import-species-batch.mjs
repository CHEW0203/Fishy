import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BATCH_SIZE = 100;

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

const SOURCE_FIELDS = [
  'source_name',
  'source_url',
  'source_type',
  'fields_supported',
  'notes',
  'retrieved_at',
];

const REQUIRED_STRING_FIELDS = [
  'common_name',
  'scientific_name',
  'water_type',
  'verification_status',
  'confidence_level',
];

const NUMERIC_FIELDS = [
  'temperature_min_c',
  'temperature_max_c',
  'ph_min',
  'ph_max',
  'hardness_min_dgh',
  'hardness_max_dgh',
  'adult_size_min_cm',
  'adult_size_max_cm',
  'lifespan_min_years',
  'lifespan_max_years',
  'minimum_tank_size_liters',
];

const ENUMS = {
  water_type: ['freshwater', 'brackish', 'marine', 'unknown'],
  temperament: ['peaceful', 'semi_aggressive', 'aggressive', 'unknown'],
  diet: ['carnivore', 'herbivore', 'omnivore', 'unknown'],
  care_level: ['beginner', 'intermediate', 'advanced', 'unknown'],
  verification_status: ['verified', 'partially_verified', 'draft', 'needs_review'],
  confidence_level: ['high', 'medium', 'low', 'unknown'],
};

const NOT_NULL_DEFAULT_FIELDS = new Set([
  'temperament',
  'diet',
  'care_level',
]);

function printUsage() {
  console.error('Usage:');
  console.error('  node scripts/import-species-batch.mjs path/to/species.json --dry-run');
  console.error('  node scripts/import-species-batch.mjs path/to/species.json --apply');
  console.error('Hint: pass --dry-run to validate without writing, or --apply to import for real.');
}

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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasBasicUrlFormat(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function getScientificName(record) {
  return isNonEmptyString(record?.scientific_name) ? record.scientific_name.trim() : 'unknown scientific_name';
}

function validateNoEmptyStrings(value, errors, rowNumber, scientificName, fieldPath) {
  if (typeof value === 'string' && value === '') {
    errors.push({ rowNumber, scientificName, message: `${fieldPath} must be null or a non-empty string.` });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      validateNoEmptyStrings(item, errors, rowNumber, scientificName, `${fieldPath}[${index}]`);
    });
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, childValue] of Object.entries(value)) {
      validateNoEmptyStrings(childValue, errors, rowNumber, scientificName, `${fieldPath}.${key}`);
    }
  }
}

function validateRecord(record, index, seenScientificNames) {
  const rowNumber = index + 1;
  const scientificName = getScientificName(record);
  const errors = [];

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return [{ rowNumber, scientificName, message: 'Record must be an object.' }];
  }

  validateNoEmptyStrings(record, errors, rowNumber, scientificName, 'record');

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(record[field])) {
      errors.push({ rowNumber, scientificName, message: `${field} is required and must be a non-empty string.` });
    }
  }

  if (isNonEmptyString(record.scientific_name)) {
    const key = record.scientific_name.trim().toLowerCase();

    if (seenScientificNames.has(key)) {
      errors.push({ rowNumber, scientificName, message: 'scientific_name must be unique within the dataset.' });
    } else {
      seenScientificNames.add(key);
    }
  }

  if (!Array.isArray(record.sources)) {
    errors.push({ rowNumber, scientificName, message: 'sources must exist and be an array.' });
  }

  for (const [field, allowedValues] of Object.entries(ENUMS)) {
    const value = record[field];

    if (value !== null && value !== undefined && !allowedValues.includes(value)) {
      errors.push({
        rowNumber,
        scientificName,
        message: `${field} must be one of: ${allowedValues.join(', ')}.`,
      });
    }
  }

  if (record.verification_status === 'verified') {
    const hasSourceUrl = Array.isArray(record.sources)
      && record.sources.some((source) => isNonEmptyString(source?.source_url));

    if (!hasSourceUrl) {
      errors.push({
        rowNumber,
        scientificName,
        message: 'verified records must have at least one source with a source_url.',
      });
    }
  }

  if (record.verification_status === 'partially_verified' && Array.isArray(record.sources) && record.sources.length === 0) {
    errors.push({
      rowNumber,
      scientificName,
      message: 'partially_verified records must have at least one source entry.',
    });
  }

  if (isNonEmptyString(record.common_name) && /n\/a|unknown fish|example|test fish/i.test(record.common_name)) {
    errors.push({ rowNumber, scientificName, message: 'common_name contains placeholder text.' });
  }

  if (isNonEmptyString(record.image_url)) {
    if (!hasBasicUrlFormat(record.image_url)) {
      errors.push({ rowNumber, scientificName, message: 'image_url must start with http:// or https://.' });
    }

    if (!isNonEmptyString(record.image_source_url)) {
      errors.push({ rowNumber, scientificName, message: 'image_source_url is required when image_url is set.' });
    }

    if (!isNonEmptyString(record.image_license)) {
      errors.push({ rowNumber, scientificName, message: 'image_license is required when image_url is set.' });
    }
  }

  if (isNonEmptyString(record.image_source_url) && !hasBasicUrlFormat(record.image_source_url)) {
    errors.push({ rowNumber, scientificName, message: 'image_source_url must start with http:// or https://.' });
  }

  if (Array.isArray(record.sources)) {
    record.sources.forEach((source, sourceIndex) => {
      if (!isNonEmptyString(source?.source_name)) {
        errors.push({
          rowNumber,
          scientificName,
          message: `sources[${sourceIndex}].source_name is required when a source entry exists.`,
        });
      }

      if (source?.source_url !== null && source?.source_url !== undefined) {
        if (!isNonEmptyString(source.source_url)) {
          errors.push({
            rowNumber,
            scientificName,
            message: `sources[${sourceIndex}].source_url must be null or a non-empty string.`,
          });
        } else if (/example\.com|placeholder/i.test(source.source_url)) {
          errors.push({
            rowNumber,
            scientificName,
            message: `sources[${sourceIndex}].source_url must not contain example.com or placeholder.`,
          });
        } else if (!hasBasicUrlFormat(source.source_url)) {
          errors.push({
            rowNumber,
            scientificName,
            message: `sources[${sourceIndex}].source_url must start with http:// or https://.`,
          });
        }
      }
    });
  }

  for (const field of NUMERIC_FIELDS) {
    const value = record[field];

    if (value !== null && value !== undefined && typeof value !== 'number') {
      errors.push({ rowNumber, scientificName, message: `${field} must be a number or null.` });
    }
  }

  return errors;
}

function validateDataset(records) {
  const seenScientificNames = new Set();
  return records.flatMap((record, index) => validateRecord(record, index, seenScientificNames));
}

async function readDataset(inputPath) {
  let content;

  try {
    content = await readFile(path.resolve(process.cwd(), inputPath), 'utf8');
  } catch (error) {
    throw new Error(`Could not read dataset file: ${error.message}`);
  }

  let records;

  try {
    records = JSON.parse(content);
  } catch (error) {
    throw new Error(`Dataset file is not valid JSON: ${error.message}`);
  }

  if (!Array.isArray(records)) {
    throw new Error('Dataset file must be a JSON array of species objects.');
  }

  return records;
}

function cleanValue(value) {
  return value === undefined ? null : value;
}

function buildSpeciesPayload(record) {
  const payload = {};

  for (const field of SPECIES_FIELDS) {
    if (field in record) {
      if (NOT_NULL_DEFAULT_FIELDS.has(field) && (record[field] === null || record[field] === undefined)) {
        continue;
      }

      payload[field] = cleanValue(record[field]);
    }
  }

  return payload;
}

function buildSourcePayload(source, speciesId) {
  const payload = { species_id: speciesId };

  for (const field of SOURCE_FIELDS) {
    if (field in source) {
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

  const text = await response.text();

  if (!response.ok) {
    let parsedError = null;

    try {
      parsedError = text ? JSON.parse(text) : null;
    } catch {
      // Keep the raw response body below when Supabase returns non-JSON errors.
    }

    const detail = parsedError ? JSON.stringify(parsedError) : text;
    throw new Error(`${table} request failed (${response.status}): ${detail}`);
  }

  if (!text || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Supabase returned non-JSON response for ${table}: ${text.slice(0, 300)}`);
  }
}

async function supabaseGet(url, anonKey, tableAndQuery) {
  const response = await fetch(`${url}/rest/v1/${tableAndQuery}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${tableAndQuery} request failed (${response.status}): ${text}`);
  }

  if (!text || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Supabase returned non-JSON response for ${tableAndQuery}: ${text.slice(0, 300)}`);
  }
}

async function upsertSpecies(url, anonKey, payload) {
  // fish_species.scientific_name is UNIQUE in migration 002, so the REST upsert is safe.
  // If that unique constraint is ever removed, re-verify this behavior before a large import.
  const data = await supabaseRequest(
    url,
    anonKey,
    'fish_species?on_conflict=scientific_name',
    payload,
    'resolution=merge-duplicates,return=representation',
  );

  const species = Array.isArray(data) ? data[0] : data;

  if (!species?.id) {
    throw new Error(`fish_species upsert did not return a species id for ${payload.scientific_name}.`);
  }

  return species;
}

function sourceFilter(source) {
  const sourceType = source.source_type || 'other';
  const sourceUrlFilter = source.source_url === null || source.source_url === undefined
    ? 'source_url=is.null'
    : `source_url=eq.${encodeURIComponent(source.source_url)}`;

  return [
    `species_id=eq.${encodeURIComponent(source.species_id)}`,
    `source_name=eq.${encodeURIComponent(source.source_name)}`,
    sourceUrlFilter,
    `source_type=eq.${encodeURIComponent(sourceType)}`,
  ].join('&');
}

async function sourceExists(url, anonKey, source) {
  const rows = await supabaseGet(
    url,
    anonKey,
    `fish_species_sources?select=id&${sourceFilter(source)}&limit=1`,
  );

  return Array.isArray(rows) && rows.length > 0;
}

async function insertSources(url, anonKey, sourceRows) {
  const summary = {
    inserted: 0,
    skippedExisting: 0,
  };

  for (const sourceRow of sourceRows) {
    if (await sourceExists(url, anonKey, sourceRow)) {
      summary.skippedExisting += 1;
      continue;
    }

    await supabaseRequest(
      url,
      anonKey,
      'fish_species_sources',
      sourceRow,
      'return=minimal',
    );

    summary.inserted += 1;
  }

  return summary;
}

function printValidationErrors(errors) {
  console.error('First 20 validation errors:');
  for (const error of errors.slice(0, 20)) {
    console.error(`  Row ${error.rowNumber} (${error.scientificName}): ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const inputPath = args.find((arg) => !arg.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');

  if (!inputPath || dryRun === apply) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  await loadLocalEnv();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (apply && (!supabaseUrl || !anonKey)) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Apply mode cannot continue.');
    process.exitCode = 1;
    return;
  }

  let records;

  try {
    records = await readDataset(inputPath);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const validationErrors = validateDataset(records);

  if (validationErrors.length > 0) {
    printValidationErrors(validationErrors);
    console.error('Import aborted: fix validation errors before importing.');
    process.exitCode = 1;
    return;
  }

  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  const summary = {
    batchesProcessed: 0,
    recordsValid: records.length,
    recordsUpserted: 0,
    sourceRowsInserted: 0,
    sourceRowsSkippedExisting: 0,
  };

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, records.length);
    const batch = records.slice(start, end);
    let batchFailed = false;

    console.log(`[Batch ${batchIndex + 1}/${totalBatches}] Processing records ${start + 1} to ${end}...`);

    for (const [offset, record] of batch.entries()) {
      const rowNumber = start + offset + 1;
      const sourceRows = Array.isArray(record.sources) ? record.sources : [];

      if (dryRun) {
        console.log(
          `Dry run: would upsert ${record.scientific_name} with ${sourceRows.length} source row(s).`,
        );
        summary.recordsUpserted += 1;
        summary.sourceRowsInserted += sourceRows.length;
        continue;
      }

      try {
        const species = await upsertSpecies(supabaseUrl, anonKey, buildSpeciesPayload(record));
        summary.recordsUpserted += 1;

        const sourcePayloads = sourceRows.map((source) => buildSourcePayload(source, species.id));
        const sourceSummary = await insertSources(supabaseUrl, anonKey, sourcePayloads);
        summary.sourceRowsInserted += sourceSummary.inserted;
        summary.sourceRowsSkippedExisting += sourceSummary.skippedExisting;
      } catch (error) {
        batchFailed = true;
        console.error(`Upsert failed for row ${rowNumber} (${record.scientific_name}): ${error.message}`);
      }
    }

    summary.batchesProcessed += 1;

    if (batchFailed) {
      console.error(`Batch ${batchIndex + 1} failed. Stopping import. Review errors above.`);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`Batches processed: ${summary.batchesProcessed}`);
  console.log(`Records valid: ${summary.recordsValid}`);
  console.log(`Records ${dryRun ? 'would-be-upserted' : 'upserted'}: ${summary.recordsUpserted}`);
  console.log('Records skipped (invalid): 0');
  console.log(`Source rows ${dryRun ? 'would-be-inserted' : 'inserted'}: ${summary.sourceRowsInserted}`);
  console.log(`Source rows skipped as existing: ${summary.sourceRowsSkippedExisting}`);

  if (dryRun) {
    console.log('DRY RUN COMPLETE — no data was written to Supabase.');
  } else {
    console.log('IMPORT COMPLETE.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
