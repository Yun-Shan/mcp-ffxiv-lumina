// Temporary read-only Wiki sampler. Does not select or replace sample items.
// Node: node fetch-wiki.mjs --manifest manifest.json --output inputs/wiki-items.json
// The exported function is self-contained so Playwright can use
// page.evaluate(fetchWikiItems, { itemIds }) when direct Node HTTP is challenged.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function extractItemIds(manifest) {
  if (Array.isArray(manifest)) {
    return [...new Set(manifest.flatMap(value => typeof value === 'number'
      ? [value]
      : value && typeof value === 'object'
        ? Number.isSafeInteger(Number(value.itemId ?? value.id)) && Number(value.itemId ?? value.id) > 0
          ? [Number(value.itemId ?? value.id)]
          : extractItemIds(value.samples ?? value.items ?? value.itemIds ?? [])
        : []))];
  }
  if (manifest && typeof manifest === 'object') {
    for (const key of ['samples', 'items', 'itemIds', 'categories', 'groups']) {
      if (manifest[key]) {
        const value = manifest[key];
        return extractItemIds(Array.isArray(value) ? value : Object.values(value));
      }
    }
  }
  return [];
}

export async function fetchWikiItems(options) {
  const itemIds = [...new Set(options.itemIds.map(Number))];
  if (!itemIds.length || itemIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('itemIds must contain positive integer Item IDs');
  }
  const batchSize = Math.max(1, Math.min(20, Number(options.batchSize) || 10));
  const endpoint = options.endpoint ?? 'https://ff14.huijiwiki.com/api.php';
  const output = {
    schemaVersion: 1,
    fetchedAtUtc: new Date().toISOString(),
    endpoint,
    transport: options.transport ?? 'node-fetch',
    credentials: 'omit',
    batchSize,
    requestedItemIds: itemIds,
    note: 'Fixed input IDs; failed or missing Wiki pages are retained and never replaced. Data revisions, not rendered-page revisions.',
    batches: [],
    items: [],
  };
  for (let offset = 0; offset < itemIds.length; offset += batchSize) {
    const ids = itemIds.slice(offset, offset + batchSize);
    const url = new URL(endpoint);
    url.search = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2',
      prop: 'revisions', rvprop: 'ids|timestamp|content|contentmodel',
      rvslots: 'main', titles: ids.map(id => `Data:Item/${id}.json`).join('|'),
    });
    const batch = { itemIds: ids, url: String(url), fetchedAtUtc: new Date().toISOString() };
    output.batches.push(batch);
    let payload;
    try {
      const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(45000) });
      batch.httpStatus = response.status;
      batch.contentType = response.headers.get('content-type');
      const responseText = await response.text();
      batch.responseLength = responseText.length;
      if (!response.ok) {
        batch.status = 'http_error';
        batch.bodyPrefix = responseText.slice(0, 500);
      } else {
        try { payload = JSON.parse(responseText); }
        catch { batch.status = 'non_json'; batch.bodyPrefix = responseText.slice(0, 500); }
        if (payload?.error) { batch.status = 'api_error'; batch.error = payload.error; }
        else if (payload && !Array.isArray(payload.query?.pages)) {
          batch.status = 'unexpected_response'; batch.responseKeys = Object.keys(payload);
        }
      }
    } catch (error) { batch.status = 'network_error'; batch.error = String(error); }
    if (batch.status) {
      for (const itemId of ids) output.items.push({ itemId, status: batch.status, batchIndex: output.batches.length - 1 });
      continue;
    }
    batch.status = 'ok';
    if (payload.warnings) batch.warnings = payload.warnings;
    for (const itemId of ids) {
      const expectedTitle = `Data:Item/${itemId}.json`;
      const page = payload.query.pages.find(value => value.title === expectedTitle);
      const item = { itemId, title: expectedTitle, batchIndex: output.batches.length - 1 };
      output.items.push(item);
      if (!page) { item.status = 'omitted_from_response'; continue; }
      if (page.missing || page.invalid) { item.status = page.missing ? 'missing' : 'invalid'; continue; }
      item.pageId = page.pageid;
      const revision = page.revisions?.[0];
      if (!revision?.slots?.main?.content) { item.status = 'no_revision_content'; continue; }
      item.revision = {
        revid: revision.revid, parentid: revision.parentid, timestamp: revision.timestamp,
        contentModel: revision.slots.main.contentmodel,
      };
      item.revisionId = revision.revid;
      item.revisionTimestamp = revision.timestamp;
      try { item.data = JSON.parse(revision.slots.main.content); }
      catch (error) { item.status = 'invalid_item_json'; item.error = String(error); continue; }
      if (Number(item.data.ID) !== itemId) { item.status = 'id_mismatch'; continue; }
      item.status = 'ok';
      item.name = item.data['中文名'];
      item.patch = item.data['版本'];
      item.sourceProfiles = Object.entries(item.data['来源'] ?? {}).map(([key, value]) => ({
        key, shape: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value,
        ...(Array.isArray(value) ? { entryCount: value.length } : {}),
      }));
    }
    if (offset + batchSize < itemIds.length) await new Promise(resolve => setTimeout(resolve, 250));
  }
  output.finishedAtUtc = new Date().toISOString();
  output.statusCounts = output.items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1; return counts;
  }, {});
  return output;
}

export async function runBrowserProbe(page, options = {}) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const manifestPath = options.manifestPath ?? path.join(dir, 'manifest.json');
  const itemIds = options.itemIds ?? extractItemIds(JSON.parse(await fs.readFile(manifestPath, 'utf8')));
  const result = await page.evaluate(fetchWikiItems, { itemIds, batchSize: options.batchSize ?? 10, transport: 'playwright-page-fetch' });
  const outputPath = options.outputPath ?? path.join(dir, 'inputs', 'wiki-items.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
  return { outputPath, requested: itemIds.length, statusCounts: result.statusCounts,
    sourceKeys: [...new Set(result.items.flatMap(item => item.sourceProfiles?.map(value => value.key) ?? []))] };
}

export function makeBrowserFunction(itemIds, options = {}) {
  return `async () => { const fetchWikiItems = ${fetchWikiItems.toString()}; return await fetchWikiItems(${JSON.stringify({ itemIds, batchSize: options.batchSize ?? 10, transport: 'playwright-page-fetch' })}); }`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const idsArg = arg('--ids');
  const manifestPath = path.resolve(arg('--manifest', path.join(dir, 'manifest.json')));
  const itemIds = idsArg ? idsArg.split(',').map(Number) : extractItemIds(JSON.parse(await fs.readFile(manifestPath, 'utf8')));
  const outputPath = path.resolve(arg('--output', path.join(dir, 'inputs', 'wiki-items.json')));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  if (args.includes('--browser-function')) {
    await fs.writeFile(outputPath, makeBrowserFunction(itemIds, { batchSize: Number(arg('--batch-size', '10')) }) + '\n');
    console.log(JSON.stringify({ outputPath, requested: itemIds.length, mode: 'browser-function' }));
  } else {
    const result = await fetchWikiItems({ itemIds, batchSize: Number(arg('--batch-size', '10')) });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ outputPath, requested: itemIds.length, statusCounts: result.statusCounts }));
    if (result.items.some(item => item.status !== 'ok')) process.exitCode = 1;
  }
}
