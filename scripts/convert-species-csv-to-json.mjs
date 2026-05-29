import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATASET_DIR = 'database/seed/large_species_dataset';
const SPECIES_CSV = `${DATASET_DIR}/fishy_species_10k_master.csv`;
const SOURCES_CSV = `${DATASET_DIR}/fishy_species_sources_10k_master.csv`;
const OUTPUT_JSON = `${DATASET_DIR}/import_ready_species.json`;

const NUMERIC_FIELDS = new Set([
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
]);

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

const ENUMS = {
  water_type: new Set(['freshwater', 'brackish', 'marine', 'unknown']),
  temperament: new Set(['peaceful', 'semi_aggressive', 'aggressive', 'unknown']),
  diet: new Set(['carnivore', 'herbivore', 'omnivore', 'unknown']),
  care_level: new Set(['beginner', 'intermediate', 'advanced', 'unknown']),
  verification_status: new Set(['verified', 'partially_verified', 'draft', 'needs_review']),
  confidence_level: new Set(['high', 'medium', 'low', 'unknown']),
};

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
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

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];

  return rows.slice(1).filter((values) => values.some((value) => value !== '')).map((values) => {
    const record = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });

    return record;
  });
}

function normalizeEmpty(value) {
  if (value === undefined || value === '') {
    return null;
  }

  return value;
}

function normalizeEnum(field, value) {
  if (value === null) {
    return null;
  }

  return ENUMS[field].has(value) ? value : null;
}

function normalizeNumber(value) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSchoolingBehavior(value) {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return null;
}

function normalizeFieldsSupported(value) {
  if (value === null) {
    return null;
  }

  const fields = value.split(',').map((field) => field.trim()).filter(Boolean);
  return fields.length > 0 ? fields : null;
}

function sourceFromRow(row) {
  return {
    source_name: normalizeEmpty(row.source_name),
    source_url: normalizeEmpty(row.source_url),
    source_type: normalizeEmpty(row.source_type),
    fields_supported: normalizeFieldsSupported(normalizeEmpty(row.fields_supported)),
    notes: normalizeEmpty(row.notes),
    retrieved_at: normalizeEmpty(row.retrieved_at),
  };
}

function buildSpeciesRecord(row, sources) {
  const record = {};

  for (const field of SPECIES_FIELDS) {
    if (field === 'category_id') {
      record.category_id = null;
      continue;
    }

    let value = normalizeEmpty(row[field]);

    if (NUMERIC_FIELDS.has(field)) {
      value = normalizeNumber(value);
    } else if (field === 'schooling_behavior') {
      value = normalizeSchoolingBehavior(value);
    } else if (field in ENUMS) {
      value = normalizeEnum(field, value);
    }

    record[field] = value;
  }

  if (record.common_name === null) {
    record.common_name = record.scientific_name;
  }

  record.sources = sources.length > 0
    ? sources
    : [{ source_name: 'GBIF Backbone Taxonomy', source_url: null }];

  return record;
}

async function main() {
  const speciesCsv = await readFile(path.resolve(process.cwd(), SPECIES_CSV), 'utf8');
  const sourcesCsv = await readFile(path.resolve(process.cwd(), SOURCES_CSV), 'utf8');
  const speciesRows = parseCsv(speciesCsv);
  const sourceRows = parseCsv(sourcesCsv);
  const sourcesByScientificName = new Map();

  for (const row of sourceRows) {
    const scientificName = normalizeEmpty(row.scientific_name);

    if (!scientificName) {
      continue;
    }

    const key = scientificName.trim().toLowerCase();
    const sources = sourcesByScientificName.get(key) ?? [];
    sources.push(sourceFromRow(row));
    sourcesByScientificName.set(key, sources);
  }

  const seenScientificNames = new Set();
  const output = [];
  let commonNameFromCsv = 0;
  let commonNameFallback = 0;
  let duplicatesSkipped = 0;
  let sourceRowsGroupedIntoOutput = 0;
  let recordsWithNoMatchedSources = 0;

  for (const row of speciesRows) {
    const scientificName = normalizeEmpty(row.scientific_name);

    if (!scientificName) {
      continue;
    }

    const key = scientificName.trim().toLowerCase();

    if (seenScientificNames.has(key)) {
      duplicatesSkipped += 1;
      continue;
    }

    seenScientificNames.add(key);

    const sources = sourcesByScientificName.get(key) ?? [];

    if (sources.length === 0) {
      recordsWithNoMatchedSources += 1;
    }

    const record = buildSpeciesRecord(row, sources);

    if (normalizeEmpty(row.common_name) === null) {
      commonNameFallback += 1;
    } else {
      commonNameFromCsv += 1;
    }

    sourceRowsGroupedIntoOutput += sources.length;
    output.push(record);
  }

  await writeFile(path.resolve(process.cwd(), OUTPUT_JSON), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log('CSV to JSON conversion complete.');
  console.log(`Total species rows in CSV: ${speciesRows.length}`);
  console.log(`Total records in JSON output: ${output.length}`);
  console.log(`Records with common_name from CSV: ${commonNameFromCsv}`);
  console.log(`Records using scientific_name as common_name fallback: ${commonNameFallback}`);
  console.log(`Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`Total source rows grouped into output: ${sourceRowsGroupedIntoOutput}`);
  console.log(`Records with 0 source entries: ${output.filter((record) => record.sources.length === 0).length}`);
  console.log(`Records with no matching source rows before fallback: ${recordsWithNoMatchedSources}`);
  console.log(`Output written: ${OUTPUT_JSON}`);
}

main().catch((error) => {
  console.error(`Conversion failed: ${error.message}`);
  process.exitCode = 1;
});
