import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SUPPLEMENTAL_COMMIT = 'e9bf1495bf8588d2cf21441ef03f0d9dfe0f790a';
export const SUPPLEMENTAL_VERSION = '5.1.4';
const root = path.dirname(fileURLToPath(import.meta.url));

// RFC 4180 reader: preserves blank cells as null, numeric cells as numbers, quoted strings.
export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const records = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell.length === 0) quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); records.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); records.push(row); }
  const fields = records.shift();
  if (!fields?.length) throw new Error('CSV has no header');
  const convert = value => value === '' ? null : /^-?(?:\d+\.?\d*|\.\d+)$/.test(value) ? Number(value) : value;
  const rows = records.filter(cells => cells.some(cell => cell !== '')).map((cells, i) => {
    if (cells.length !== fields.length) throw new Error(`CSV row ${i + 2} has ${cells.length} fields; expected ${fields.length}`);
    return Object.fromEntries(fields.map((key, j) => [key, convert(cells[j])]));
  });
  return { fields, rows };
}

export function gitBlobHash(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

export async function loadSupplemental({ refresh = false, offline = false } = {}) {
  const manifestPath = path.join(root, 'inputs', 'supplemental-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (manifest.commit !== SUPPLEMENTAL_COMMIT) throw new Error('Unexpected Supplemental commit');
  const cacheDir = path.join(root, 'cache', 'supplemental', SUPPLEMENTAL_COMMIT);
  await fs.mkdir(cacheDir, { recursive: true });
  const output = { commit: SUPPLEMENTAL_COMMIT, packageVersion: SUPPLEMENTAL_VERSION, fetchedAt: new Date().toISOString(), datasets: {}, errors: [] };
  // Small bounded queue: public, read-only raw downloads; never invokes an exe or .NET assembly.
  const queue = manifest.entries.filter(entry => entry.name.endsWith('.csv'));
  async function worker() {
    while (queue.length) {
      const entry = queue.shift();
      try {
        const cachePath = path.join(cacheDir, entry.name);
        let bytes;
        if (!refresh) { try { bytes = await fs.readFile(cachePath); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
        if (!bytes) {
          if (offline) throw new Error('Missing cached resource in offline mode');
          const response = await fetch(entry.download_url, { headers: { 'User-Agent': 'mcp-lumina-item-source-probe/1.0' }, signal: AbortSignal.timeout(45000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          bytes = Buffer.from(await response.arrayBuffer());
          if (gitBlobHash(bytes) !== entry.sha) throw new Error('Downloaded Git blob SHA does not match pinned manifest');
          await fs.writeFile(cachePath, bytes);
        }
        const actualBlobSha = gitBlobHash(bytes);
        if (actualBlobSha !== entry.sha) throw new Error('Cached Git blob SHA does not match pinned manifest');
        output.datasets[entry.name.slice(0, -4)] = { ...parseCsv(bytes.toString('utf8')), evidence: { commit: SUPPLEMENTAL_COMMIT, sourceUrl: entry.html_url, rawUrl: entry.download_url, gitBlobSha: actualBlobSha, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, cachePath: path.relative(root, cachePath).replaceAll('\\', '/') } };
      } catch (error) { output.errors.push({ dataset: entry.name, message: error.message, sourceUrl: entry.html_url }); }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  output.datasets = Object.fromEntries(Object.entries(output.datasets).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(path.join(root, 'inputs', 'supplemental.json'), JSON.stringify(output, null, 2) + '\n');
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await loadSupplemental({ refresh: process.argv.includes('--refresh'), offline: process.argv.includes('--offline') });
  console.log(JSON.stringify({ commit: result.commit, datasets: Object.fromEntries(Object.entries(result.datasets).map(([name, data]) => [name, { rows: data.rows.length, fields: data.fields }])), errors: result.errors }, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
