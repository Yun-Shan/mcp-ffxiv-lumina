async () => { const fetchWikiItems = async function fetchWikiItems(options) {
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
}; return await fetchWikiItems({"itemIds":[9846,2505,16967,13751,14934,5666,22514,5668,18021,31324,20539,20528,23098,12082,24331,16765,9848,16775,12056,8202,13722,27994,36262,31266,23916,24874,12684,40786,35247,27626,40369,14664,26226,31672,31687,33844,35979,23373,27987,30347,30353,23214,48156,47987,41768,28069,45755,43687,12882,39900,33311,20792,7754,7750,29669,17559,41069,17968,20547,17616,5723,18028,18019,3,4153,36170,30914,33784,24038,34391,29064,6053,4774,24010,44054,30110,46254,41762,18020,5683,23378,10393,8374,10387,23099,38542,39311,5827,24001,2404,43499,22445,4173,27941,49972,9,44035,41418,7717,6148,12765,36086,36178,27685,32919,31990,31264,20167,36522,36524,46314,41680,11450,33753,20491,36338,19956,19933],"batchSize":10,"transport":"playwright-page-fetch"}); }
