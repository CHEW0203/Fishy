import { readFile } from 'node:fs/promises';
import path from 'node:path';

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
    errors.push({
      rowNumber,
      scientificName,
      message: 'common_name contains placeholder text.',
    });
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

function summarize(records, errors) {
  const verificationCounts = {};
  let recordsWithSources = 0;
  let recordsWithImageUrl = 0;

  for (const record of records) {
    if (Array.isArray(record?.sources) && record.sources.length > 0) {
      recordsWithSources += 1;
    }

    if (isNonEmptyString(record?.image_url)) {
      recordsWithImageUrl += 1;
    }

    const status = isNonEmptyString(record?.verification_status) ? record.verification_status : 'missing';
    verificationCounts[status] = (verificationCounts[status] ?? 0) + 1;
  }

  console.log(`Total records read: ${records.length}`);
  console.log(`Valid records: ${records.length - new Set(errors.map((error) => error.rowNumber)).size}`);
  console.log(`Invalid records: ${new Set(errors.map((error) => error.rowNumber)).size}`);
  console.log(`Records with sources: ${recordsWithSources}`);
  console.log(`Records with image_url: ${recordsWithImageUrl}`);
  console.log('Count by verification_status:');

  for (const [status, count] of Object.entries(verificationCounts)) {
    console.log(`  ${status}: ${count}`);
  }

  if (errors.length > 0) {
    console.log('First 20 errors:');
    for (const error of errors.slice(0, 20)) {
      console.log(`  Row ${error.rowNumber} (${error.scientificName}): ${error.message}`);
    }
  }
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

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('Usage: node scripts/validate-species-dataset.mjs path/to/species.json');
    process.exitCode = 1;
    return;
  }

  let records;

  try {
    records = await readDataset(inputPath);
  } catch (error) {
    console.error(error.message);
    console.log('VALIDATION FAILED');
    process.exitCode = 1;
    return;
  }

  const seenScientificNames = new Set();
  const errors = records.flatMap((record, index) => validateRecord(record, index, seenScientificNames));

  summarize(records, errors);

  if (errors.length > 0) {
    console.log('VALIDATION FAILED');
    process.exitCode = 1;
    return;
  }

  console.log('VALIDATION PASSED');
}

main().catch((error) => {
  console.error(error.message);
  console.log('VALIDATION FAILED');
  process.exitCode = 1;
});
