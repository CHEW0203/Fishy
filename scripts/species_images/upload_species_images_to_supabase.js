const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const IMAGE_DIR = path.join(ROOT, 'database', 'seed', 'species_images');
const INPUT_PATH = path.join(IMAGE_DIR, 'final_species_image_assets.json');
const OUTPUT_PATH = path.join(IMAGE_DIR, 'final_species_image_assets_uploaded.json');
const REPORT_PATH = path.join(IMAGE_DIR, 'upload_species_images_report.json');
const PROGRESS_PATH = path.join(IMAGE_DIR, 'upload_progress.json');
const FAILED_ROWS_PATH = path.join(IMAGE_DIR, 'upload_failed_rows.json');
const BUCKET = process.env.SPECIES_IMAGES_BUCKET || 'species-images';
const DEFAULT_CONCURRENCY = 1;
const DEFAULT_DELAY_MS = 200;
const WINDOWS_MAX_CONCURRENCY = 2;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCliOption(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function getUploadOptions() {
  const requestedConcurrency = parsePositiveInteger(
    parseCliOption('concurrency') || process.env.SPECIES_UPLOAD_CONCURRENCY,
    DEFAULT_CONCURRENCY,
  );
  const concurrency =
    process.platform === 'win32'
      ? Math.min(requestedConcurrency, WINDOWS_MAX_CONCURRENCY)
      : requestedConcurrency;
  const delayMs = parsePositiveInteger(
    parseCliOption('delay-ms') || process.env.SPECIES_UPLOAD_DELAY_MS,
    DEFAULT_DELAY_MS,
  );

  return {
    concurrency,
    delayMs,
    requestedConcurrency,
    concurrencyCapped: concurrency !== requestedConcurrency,
  };
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read ${path.relative(ROOT, filePath)}: ${error.message}`);
  }
}

function writeJsonFile(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(tempPath, filePath);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function contentTypeForFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL, plus SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), serviceRoleKey };
}

async function readResponseBody(response) {
  const body = await response.text();
  return body.length > 500 ? `${body.slice(0, 500)}...` : body;
}

async function ensureBucket(config) {
  const bucketUrl = `${config.supabaseUrl}/storage/v1/bucket/${BUCKET}`;
  const getResponse = await fetch(bucketUrl, {
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
    },
  });

  if (getResponse.ok) {
    return { bucket_status: 'exists' };
  }

  if (getResponse.status !== 404) {
    return {
      bucket_status: 'check_failed',
      bucket_error: `HTTP ${getResponse.status}: ${await readResponseBody(getResponse)}`,
    };
  }

  const createResponse = await fetch(`${config.supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: null,
    }),
  });

  if (createResponse.ok) {
    return { bucket_status: 'created' };
  }

  return {
    bucket_status: 'create_failed',
    bucket_error: `HTTP ${createResponse.status}: ${await readResponseBody(createResponse)}`,
  };
}

function publicUrlFor(config, storagePath) {
  return `${config.supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function uploadAsset(config, asset) {
  const absolutePath = path.join(ROOT, asset.local_file_path || '');
  if (!asset.local_file_path || !fs.existsSync(absolutePath)) {
    return {
      ...asset,
      upload_status: 'failed',
      upload_error: 'Missing local image file.',
    };
  }

  const storagePath = asset.storage_path;
  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`;
  let fileBuffer = fs.readFileSync(absolutePath);

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
        'Content-Type': contentTypeForFile(absolutePath),
        'x-upsert': 'true',
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const body = await readResponseBody(response);
      return { ...asset, upload_status: 'failed', upload_error: `HTTP ${response.status}: ${body}` };
    }

    return {
      ...asset,
      upload_status: 'uploaded',
      storage_bucket: BUCKET,
      public_url: publicUrlFor(config, storagePath),
      uploaded_at: new Date().toISOString(),
    };
  } finally {
    fileBuffer = null;
  }
}

function getProgressKey(asset) {
  return asset.species_key || asset.storage_path;
}

function mergeUploadedRows(assets, progressMap) {
  return assets.map((asset) => {
    const progress = progressMap.get(getProgressKey(asset));
    return progress ? { ...asset, ...progress } : asset;
  });
}

function loadProgress(assets) {
  const progressRows = readJsonFile(PROGRESS_PATH, []);
  const uploadedRows = readJsonFile(OUTPUT_PATH, []);
  const progressMap = new Map();

  for (const row of [...uploadedRows, ...progressRows]) {
    if (row && row.public_url) {
      progressMap.set(getProgressKey(row), row);
    }
  }

  return {
    progressMap,
    uploadedAssets: mergeUploadedRows(assets, progressMap),
  };
}

function saveProgress(assets, progressMap) {
  const progressRows = [...progressMap.values()].sort((a, b) =>
    String(getProgressKey(a)).localeCompare(String(getProgressKey(b))),
  );
  writeJsonFile(PROGRESS_PATH, progressRows);
  writeJsonFile(OUTPUT_PATH, mergeUploadedRows(assets, progressMap));
}

async function runWorker({ workerId, assets, config, options, progressMap, failures, counters }) {
  while (counters.nextIndex < assets.length) {
    const index = counters.nextIndex;
    counters.nextIndex += 1;
    const asset = assets[index];
    const progressKey = getProgressKey(asset);
    const progress = progressMap.get(progressKey);

    if (progress && progress.public_url) {
      counters.skippedAlreadyUploaded += 1;
      console.log(`[${index + 1}/${assets.length}] skipped already uploaded ${asset.species_key}`);
      continue;
    }

    try {
      const result = await uploadAsset(config, asset);
      if (result.upload_status === 'uploaded' && result.public_url) {
        progressMap.set(progressKey, result);
        counters.uploadedThisRun += 1;
        saveProgress(assets, progressMap);
        console.log(`[${index + 1}/${assets.length}] uploaded ${asset.species_key}`);
      } else {
        failures.push(result);
        counters.failedThisRun += 1;
        console.log(`[${index + 1}/${assets.length}] failed ${asset.species_key}`);
      }
    } catch (error) {
      const failedRow = {
        ...asset,
        upload_status: 'failed',
        upload_error: error instanceof Error ? error.message : String(error),
      };
      failures.push(failedRow);
      counters.failedThisRun += 1;
      console.log(`[${index + 1}/${assets.length}] failed ${asset.species_key}`);
    }

    if (options.delayMs > 0 && counters.nextIndex < assets.length) {
      await delay(options.delayMs + workerId * 25);
    }
  }
}

function buildReport({ startedAt, bucketResult, assets, progressMap, failures, options }) {
  const uploadedAssets = mergeUploadedRows(assets, progressMap);
  const publicUrlCount = uploadedAssets.filter((asset) => asset.public_url).length;
  const failedKeys = new Set(failures.map((asset) => getProgressKey(asset)));
  const pendingRows = uploadedAssets.filter((asset) => !asset.public_url && !failedKeys.has(getProgressKey(asset)));

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    bucket: BUCKET,
    ...bucketResult,
    concurrency: options.concurrency,
    requestedConcurrency: options.requestedConcurrency,
    concurrencyCapped: options.concurrencyCapped,
    delayMs: options.delayMs,
    totalAssets: assets.length,
    successfulUploads: publicUrlCount,
    uploadedThisRun: options.counters.uploadedThisRun,
    skippedAlreadyUploaded: options.counters.skippedAlreadyUploaded,
    failedUploads: failures.length,
    pendingUploads: pendingRows.length,
    publicUrlCount,
    failures: failures.map((asset) => ({
      species_key: asset.species_key,
      storage_path: asset.storage_path,
      upload_status: asset.upload_status,
      upload_error: asset.upload_error,
    })),
    pending: pendingRows.map((asset) => ({
      species_key: asset.species_key,
      storage_path: asset.storage_path,
    })),
  };
}

async function main() {
  const config = getSupabaseConfig();
  const options = getUploadOptions();
  const assets = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const startedAt = new Date().toISOString();
  const { progressMap } = loadProgress(assets);
  const failures = [];
  const counters = {
    nextIndex: 0,
    uploadedThisRun: 0,
    skippedAlreadyUploaded: 0,
    failedThisRun: 0,
  };
  options.counters = counters;

  const bucketResult = await ensureBucket(config);
  if (bucketResult.bucket_status.endsWith('failed')) {
    const report = {
      startedAt,
      finishedAt: new Date().toISOString(),
      bucket: BUCKET,
      ...bucketResult,
      concurrency: options.concurrency,
      delayMs: options.delayMs,
      totalAssets: assets.length,
      successfulUploads: progressMap.size,
      uploadedThisRun: 0,
      skippedAlreadyUploaded: 0,
      failedUploads: assets.length - progressMap.size,
      pendingUploads: assets.length - progressMap.size,
      publicUrlCount: progressMap.size,
      failures: assets
        .filter((asset) => !progressMap.get(getProgressKey(asset))?.public_url)
        .map((asset) => ({
          species_key: asset.species_key,
          storage_path: asset.storage_path,
          upload_status: 'not_attempted_bucket_unavailable',
        })),
    };
    writeJsonFile(REPORT_PATH, report);
    writeJsonFile(FAILED_ROWS_PATH, report.failures);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  if (options.concurrencyCapped) {
    console.log(
      `Requested concurrency ${options.requestedConcurrency} capped to ${options.concurrency} on Windows.`,
    );
  }
  console.log(
    `Uploading ${assets.length} species image assets with concurrency ${options.concurrency} and ${options.delayMs}ms delay.`,
  );

  const workers = Array.from({ length: options.concurrency }, (_, workerIndex) =>
    runWorker({
      workerId: workerIndex,
      assets,
      config,
      options,
      progressMap,
      failures,
      counters,
    }),
  );
  await Promise.all(workers);

  saveProgress(assets, progressMap);
  if (failures.length) {
    writeJsonFile(FAILED_ROWS_PATH, failures);
  } else {
    writeJsonFile(FAILED_ROWS_PATH, []);
  }

  const report = buildReport({
    startedAt,
    bucketResult,
    assets,
    progressMap,
    failures,
    options,
  });
  writeJsonFile(REPORT_PATH, report);
  console.log(JSON.stringify(report, null, 2));

  if (report.failedUploads || report.pendingUploads || report.publicUrlCount !== assets.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
