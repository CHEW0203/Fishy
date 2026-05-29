import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = resolve(process.cwd(), '.env.local');
const REQUIRED_ENV = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
];

function parseEnvFile(filePath) {
  const values = {};

  if (!existsSync(filePath)) {
    return values;
  }

  const envText = readFileSync(filePath, 'utf8');

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeJwtPayload(key) {
  const parts = key.split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

function maskPrefix(value, length = 12) {
  return value ? value.slice(0, length) : '<missing>';
}

function getUrlProjectRef(url) {
  try {
    const host = new URL(url).host;
    return host.endsWith('.supabase.co') ? host.replace(/\.supabase\.co$/, '') : null;
  } catch {
    return null;
  }
}

function formatExpiry(exp) {
  if (typeof exp !== 'number') {
    return '<not present>';
  }

  return `${exp} (${new Date(exp * 1000).toISOString()})`;
}

function normalizeConfig(envValues) {
  const rawUrl = envValues.EXPO_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const rawKey =
    envValues.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const url = rawUrl.trim().replace(/\/+$/, '');
  const key = rawKey.trim();
  const errors = [];

  for (const envName of REQUIRED_ENV) {
    if (!(envName in envValues)) {
      errors.push(`${envName} was not found in .env.local.`);
    }
  }

  if (!url) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL is empty.');
  }

  if (!key) {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is empty.');
  }

  if (url && !url.startsWith('https://')) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL must start with https://.');
  }

  if (url && !url.endsWith('.supabase.co')) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL must end with .supabase.co.');
  }

  if (rawUrl.trim() !== url) {
    console.log('[INFO] Supabase URL was normalized by trimming whitespace/trailing slash.');
  }

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'")) ||
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    errors.push('Supabase env values still appear quoted after parsing.');
  }

  if (key.startsWith('Bearer ')) {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY must not include a Bearer prefix.');
  }

  return {
    url,
    key,
    errors,
    keyType: key.startsWith('eyJ')
      ? 'legacy JWT anon'
      : key.startsWith('sb_publishable')
        ? 'publishable'
        : 'unknown',
  };
}

function printConfigDiagnostics(config, jwtPayload) {
  const url = config.url;
  let urlHost = '<missing>';

  if (url) {
    try {
      urlHost = new URL(url).host;
    } catch {
      urlHost = '<invalid>';
    }
  }

  const urlRef = getUrlProjectRef(url) ?? '<unknown>';
  const keyRef = jwtPayload?.ref ?? '<not available>';

  console.log('Supabase diagnostics:');
  console.log(`  .env.local loaded: ${existsSync(ENV_PATH) ? 'yes' : 'no'}`);
  console.log(`  URL host: ${urlHost}`);
  console.log(`  URL project ref: ${urlRef}`);
  console.log(`  key exists: ${config.key ? 'yes' : 'no'}`);
  console.log(`  key prefix: ${maskPrefix(config.key)}`);
  console.log(`  key length: ${config.key.length}`);
  console.log(`  key type: ${config.keyType}`);

  if (jwtPayload) {
    console.log(`  JWT role: ${jwtPayload.role ?? '<not present>'}`);
    console.log(`  JWT project ref: ${keyRef}`);
    console.log(`  JWT exp: ${formatExpiry(jwtPayload.exp)}`);
    console.log(`  URL/key match: ${urlRef === keyRef ? 'yes' : 'no'}`);
  } else if (config.keyType === 'publishable') {
    console.log('  publishable key: using apikey header; will retry without Authorization if needed');
  }
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return '<empty response body>';
  }

  return text.length > 1200 ? `${text.slice(0, 1200)}...` : text;
}

function headersForMode(key, mode) {
  const headers = {
    apikey: key,
  };

  if (mode === 'apikey-and-authorization') {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function fetchWithMode(url, key, mode, extraHeaders = {}) {
  return fetch(url, {
    headers: {
      ...headersForMode(key, mode),
      ...extraHeaders,
    },
  });
}

async function testRestRoot(config) {
  const endpoint = `${config.url}/rest/v1/`;
  const primaryMode = 'apikey-and-authorization';

  console.log(`Testing REST endpoint: ${endpoint}`);

  let response = await fetchWithMode(endpoint, config.key, primaryMode);
  let mode = primaryMode;

  if (response.status === 401 && config.keyType === 'publishable') {
    console.log('[INFO] Publishable key returned 401 with Authorization header; retrying with apikey only.');
    response = await fetchWithMode(endpoint, config.key, 'apikey-only');
    mode = 'apikey-only';
  }

  if (!response.ok) {
    const body = await readResponseBody(response);
    const rootRequiresServiceRole =
      response.status === 401 &&
      body.toLowerCase().includes('only the `service_role` api key can be used for this endpoint');

    if (rootRequiresServiceRole) {
      console.log('[INFO] REST root endpoint rejected anon access, which is expected on this project.');
      console.log('       Continuing with table endpoint checks using the anon key.');
      return { ok: true, mode };
    }

    console.log('[FAIL] Supabase REST authentication failed.');
    console.log(`       Mode: ${mode}`);
    console.log(`       Status: HTTP ${response.status}`);
    console.log(`       Response body: ${body}`);

    if (response.status === 401) {
      console.log('       Meaning: the URL/key pair was rejected by Supabase.');
      console.log('       Fix: copy the Project URL and anon public key from the same Supabase project.');
    }

    return { ok: false, mode };
  }

  console.log(`[PASS] Supabase REST API responded successfully (${mode}).`);
  return { ok: true, mode };
}

function classifyTableFailure(tableName, status, body) {
  const lowerBody = body.toLowerCase();

  if (status === 401) {
    return `${tableName}: invalid or mismatched API key.`;
  }

  if (
    status === 404 ||
    lowerBody.includes('could not find the table') ||
    lowerBody.includes('relation') ||
    lowerBody.includes('does not exist')
  ) {
    return `${tableName}: table missing - run database/supabase_full_setup.sql in Supabase SQL Editor.`;
  }

  if (status === 403 || lowerBody.includes('permission denied')) {
    return `${tableName}: permission denied - disable RLS for MVP or add anon policies.`;
  }

  return `${tableName}: HTTP ${status}.`;
}

function getStorageErrorInfo(error) {
  const message =
    typeof error?.message === 'string'
      ? error.message
      : typeof error?.error === 'string'
        ? error.error
        : JSON.stringify(error);
  const statusCode =
    typeof error?.statusCode === 'number'
      ? error.statusCode
      : typeof error?.statusCode === 'string'
        ? Number(error.statusCode)
        : typeof error?.status === 'number'
          ? error.status
          : null;
  const lowerMessage = message.toLowerCase();

  if (
    statusCode === 404 ||
    lowerMessage.includes('bucket not found') ||
    lowerMessage.includes('not found')
  ) {
    return { kind: 'bucket-missing', message, statusCode };
  }

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('not authorized') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('violates row-level security')
  ) {
    return { kind: 'policy-denied', message, statusCode };
  }

  return { kind: 'unknown', message, statusCode };
}

function printStoragePolicySql() {
  console.log('       MVP storage policy SQL:');
  console.log('       DROP POLICY IF EXISTS "fish_photos_public_read" ON storage.objects;');
  console.log('       CREATE POLICY "fish_photos_public_read"');
  console.log('       ON storage.objects');
  console.log('       FOR SELECT');
  console.log('       TO anon');
  console.log("       USING (bucket_id = 'fish-photos');");
  console.log('');
  console.log('       DROP POLICY IF EXISTS "fish_photos_anon_upload" ON storage.objects;');
  console.log('       CREATE POLICY "fish_photos_anon_upload"');
  console.log('       ON storage.objects');
  console.log('       FOR INSERT');
  console.log('       TO anon');
  console.log("       WITH CHECK (bucket_id = 'fish-photos');");
  console.log('');
  console.log('       DROP POLICY IF EXISTS "fish_photos_anon_update" ON storage.objects;');
  console.log('       CREATE POLICY "fish_photos_anon_update"');
  console.log('       ON storage.objects');
  console.log('       FOR UPDATE');
  console.log('       TO anon');
  console.log("       USING (bucket_id = 'fish-photos')");
  console.log("       WITH CHECK (bucket_id = 'fish-photos');");
  console.log('');
  console.log('       DROP POLICY IF EXISTS "fish_photos_anon_delete" ON storage.objects;');
  console.log('       CREATE POLICY "fish_photos_anon_delete"');
  console.log('       ON storage.objects');
  console.log('       FOR DELETE');
  console.log('       TO anon');
  console.log("       USING (bucket_id = 'fish-photos');");
}

async function checkTable(config, mode, tableName, options = {}) {
  const { requireRows = false, seedFile = null } = options;
  const endpoint = `${config.url}/rest/v1/${tableName}?select=*&limit=1`;
  const response = await fetchWithMode(endpoint, config.key, mode, {
    Prefer: 'count=exact',
  });

  if (!response.ok) {
    const body = await readResponseBody(response);
    console.log(`[FAIL] ${classifyTableFailure(tableName, response.status, body)}`);
    console.log(`       Endpoint: ${endpoint}`);
    console.log(`       Response body: ${body}`);
    return false;
  }

  const contentRange = response.headers.get('content-range');
  const countText = contentRange?.split('/')?.[1];
  const rowCount = countText && countText !== '*' ? Number(countText) : null;
  const rows = await response.json();
  const hasRows = Array.isArray(rows) && rows.length > 0;
  const totalRows = Number.isFinite(rowCount) ? rowCount : hasRows ? rows.length : 0;

  if (requireRows && totalRows === 0) {
    const seedInstruction = seedFile
      ? `run ${seedFile} or database/supabase_full_setup.sql`
      : 'run seed SQL';
    console.log(`[FAIL] ${tableName} table exists but is empty - ${seedInstruction}.`);
    return false;
  }

  if (requireRows) {
    console.log(`[PASS] ${tableName} table exists with ${totalRows} rows.`);
  } else {
    console.log(`[PASS] ${tableName} table exists and is readable.`);
  }

  return true;
}

async function checkStorageBucket(config) {
  const client = createClient(config.url, config.key);
  const bucket = client.storage.from('fish-photos');
  const testPath = `.fishy-connection-test/connection-test-${Date.now()}.txt`;
  let listPolicyOk = false;

  console.log('Testing storage bucket: fish-photos');

  const { error: listError } = await bucket.list('', { limit: 1 });

  if (!listError) {
    listPolicyOk = true;
    console.log('[PASS] fish-photos bucket object list check succeeded.');
  } else {
    const info = getStorageErrorInfo(listError);

    if (info.kind === 'bucket-missing') {
      console.log('[FAIL] fish-photos bucket does not exist.');
      console.log('       Fix: Supabase Dashboard > Storage > New bucket > fish-photos > Public bucket ON for MVP.');
      console.log(`       Storage response: ${info.message}`);
      return false;
    }

    if (info.kind === 'policy-denied') {
      console.log('[WARN] fish-photos bucket exists or may exist, but anon storage list/read policy is missing/blocked.');
      console.log(`       Storage response: ${info.message}`);
    } else {
      console.log('[WARN] Anon cannot list fish-photos bucket objects; bucket metadata was not treated as missing.');
      console.log(`       Storage response: ${info.message}`);
    }
  }

  const uploadBody = new Blob(['Fishy Supabase connection test file.\n'], {
    type: 'text/plain',
  });
  const { data: uploadData, error: uploadError } = await bucket.upload(testPath, uploadBody, {
    contentType: 'text/plain',
    upsert: false,
  });

  if (uploadError) {
    const info = getStorageErrorInfo(uploadError);

    if (info.kind === 'bucket-missing') {
      console.log('[FAIL] fish-photos bucket does not exist.');
      console.log('       Fix: Supabase Dashboard > Storage > New bucket > fish-photos > Public bucket ON for MVP.');
      console.log(`       Storage response: ${info.message}`);
      return false;
    }

    if (info.kind === 'policy-denied') {
      console.log('[FAIL] fish-photos bucket exists or may exist, but anon upload policy is missing/blocked.');
      console.log(`       Storage response: ${info.message}`);
      printStoragePolicySql();
      return false;
    }

    console.log('[FAIL] Unknown storage upload error for fish-photos.');
    console.log(`       Storage response: ${info.message}`);
    return false;
  }

  console.log(`[PASS] fish-photos anon upload check succeeded at ${uploadData.path}.`);

  const { error: removeError } = await bucket.remove([testPath]);

  if (removeError) {
    const info = getStorageErrorInfo(removeError);
    console.log('[WARN] fish-photos test upload succeeded, but cleanup/delete policy is missing or blocked.');
    console.log(`       Test file left in bucket: ${testPath}`);
    console.log(`       Storage response: ${info.message}`);
    printStoragePolicySql();
  } else {
    console.log('[PASS] fish-photos cleanup/delete check succeeded.');
  }

  const { data: publicUrlData } = bucket.getPublicUrl(testPath);
  console.log('[INFO] Public URL generation is available, but public read cannot be fully verified after cleanup without an existing object.');
  console.log(`       Generated URL host: ${new URL(publicUrlData.publicUrl).host}`);

  if (!listPolicyOk) {
    console.log('[WARN] Upload works, but anon object listing/read policy may still be blocked.');
    printStoragePolicySql();
  }

  return true;
}

async function main() {
  const envValues = parseEnvFile(ENV_PATH);

  for (const [key, value] of Object.entries(envValues)) {
    process.env[key] = value;
  }

  const config = normalizeConfig(envValues);
  const jwtPayload = config.keyType === 'legacy JWT anon' ? decodeJwtPayload(config.key) : null;

  printConfigDiagnostics(config, jwtPayload);

  if (config.errors.length > 0) {
    console.log('[FAIL] Supabase environment configuration is invalid.');

    for (const error of config.errors) {
      console.log(`       ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  if (config.keyType === 'legacy JWT anon' && !jwtPayload) {
    console.log('[FAIL] The anon key starts like a JWT but its payload could not be decoded.');
    process.exitCode = 1;
    return;
  }

  const urlRef = getUrlProjectRef(config.url);
  const keyRef = jwtPayload?.ref;

  if (keyRef && urlRef && keyRef !== urlRef) {
    console.log('[FAIL] Supabase URL/key mismatch');
    console.log(`       URL ref: ${urlRef}`);
    console.log(`       Key ref: ${keyRef}`);
    console.log('       Fix: Copy Project URL and anon public key from the same Supabase project.');
    process.exitCode = 1;
    return;
  }

  const restResult = await testRestRoot(config);

  if (!restResult.ok) {
    process.exitCode = 1;
    return;
  }

  let failed = false;

  failed =
    !(await checkTable(config, restResult.mode, 'fish_categories', {
      requireRows: true,
      seedFile: 'database/seed/categories.sql',
    })) || failed;

  failed =
    !(await checkTable(config, restResult.mode, 'fish_species', {
      requireRows: true,
      seedFile: 'database/seed/species_seed.sql',
    })) || failed;

  failed = !(await checkTable(config, restResult.mode, 'user_fish')) || failed;
  failed = !(await checkTable(config, restResult.mode, 'fish_photos')) || failed;
  failed = !(await checkStorageBucket(config)) || failed;

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log('[PASS] Supabase setup checks completed successfully.');
}

try {
  await main();
} catch (err) {
  console.log('[FAIL] Supabase connection test crashed unexpectedly.');

  if (err instanceof Error) {
    console.log(`       ${err.message}`);
  } else {
    console.log(`       ${String(err)}`);
  }

  process.exitCode = 1;
}
