const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const IMAGE_DIR = path.join(ROOT, 'database', 'seed', 'species_images');
const MANIFEST_PATH = path.join(IMAGE_DIR, 'species_image_manifest.json');
const OUTPUT_DIR = path.join(IMAGE_DIR, 'generated', 'real');
const REPORT_PATH = path.join(IMAGE_DIR, 'real_image_download_report.json');

function extensionFromUrl(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.png')) return '.png';
  if (pathname.endsWith('.webp')) return '.webp';
  if (pathname.endsWith('.jpeg')) return '.jpg';
  if (pathname.endsWith('.jpg')) return '.jpg';
  if (pathname.endsWith('.jpe')) return '.jpg';
  return '.jpg';
}

async function downloadImage(row) {
  const extension = extensionFromUrl(row.candidate_image_url);
  const fileName = `${row.species_key}${extension}`;
  const outputPath = path.join(OUTPUT_DIR, fileName);
  const relativePath = path.relative(ROOT, outputPath).replace(/\\/g, '/');

  if (fs.existsSync(outputPath)) {
    return { species_key: row.species_key, status: 'already_exists', local_file_path: relativePath };
  }

  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(row.candidate_image_url, {
      headers: {
        'User-Agent': 'Fishy species image asset preparation (local development; contact: local)',
      },
    });

    if (response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
  }

  if (!response.ok) {
    return {
      species_key: row.species_key,
      status: 'failed',
      error: `HTTP ${response.status}`,
      source_url: row.candidate_image_url,
    };
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

  return { species_key: row.species_key, status: 'downloaded', local_file_path: relativePath };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const rows = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const licensedRows = rows.filter((row) => row.image_status === 'licensed_photo');
  const results = [];

  for (const row of licensedRows) {
    try {
      results.push(await downloadImage(row));
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        species_key: row.species_key,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        source_url: row.candidate_image_url,
      });
    }
  }

  const summary = results.reduce(
    (acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    },
    { total: results.length },
  );

  fs.writeFileSync(REPORT_PATH, JSON.stringify({ summary, results }, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
