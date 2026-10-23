# 灰机 Wiki 物品来源 API 实测

本附录记录匿名只读调用，不修改网站或产品实现。首轮验证时间为 2026-10-23 23:55–23:59（Asia/Shanghai），补充样本跨至 2026-10-24 凌晨；精简证据的时间戳使用 UTC。文件名保留首轮日期。

## 结论

应优先通过标准 MediaWiki `query+revisions` 读取 `Data:Item/<Item.RowId>.json`，再对其 `slots.main.content` 做第二次 JSON 解析，取得 `来源`。它明显比物品页短文本丰富，也比 HTML 抽取稳定。对照物品页时使用 `action=parse` 获取服务器已展开模板与 Lua 的 HTML。两者各有用途，不应把 `parse.wikitext` 当作展开后的来源。

本轮 `revisions`、`parse`、`paraminfo`、`lua` 调用均真实获得 HTTP 200；请求用 `credentials: 'omit'`，没有提供登录 Cookie 或 API key。这只证明本轮所用匿名读取接口可用，不代表写权限或未来访问策略。灰机官方说明支持标准 MediaWiki API，端点为 `/api.php` 或 `/w/api.php`。[灰机 API 文档](https://huijiwiki.com/wiki/帮助:API)

### 加特勒：能取到什么

`Data:Item/50777.json` 的 `来源.特殊商店[0]` 已包含：

- 获得加特勒 ×1，消耗兽主手斧+4（50770）×1、高纯度兽核晶（51735）×20。
- NPC 科纳格流派商人（1059408），黑衣森林中央林区 X:21.9、Y:22.6。
- 商店“高纯度兽核晶”（1771020），兑换信息 `index=38`。
- 商店条件：任务“贪食无厌加特勒”（71034）。
- 兑换行条件：任务“奇盘上的王者：高段第二盘”（71037）。

这两项任务条件属于不同层级，必须同时保留。Wiki 的 `index=38` 是其数据表达；与客户端数组比对时需明确 0/1 起点，不可直接当作数组下标。

对应页面修订为 2362351，时间 2026-09-08T07:47:59Z；Data 修订为 2375330，时间 2026-09-08T18:10:42Z。物品页源码仅有 `{{物品页|id=50777...}}`，`action=parse` 的 HTML 中才有完整兑换表。[物品页](https://ff14.huijiwiki.com/wiki/物品:加特勒) · [Data 页](https://ff14.huijiwiki.com/wiki/Data:Item/50777.json)

### 八个 API 样本的差异

下表全部来自真实 Data API 响应；每类数组在证据中只保留数量和首个代表项。

| Item ID / 名称 | 来源键 | Data 修订 / UTC 时间 | 说明 |
|---|---|---|---|
| 50777 加特勒 | 特殊商店 | 2375330 / 2026-09-08T18:10:42Z | 成本、NPC、坐标、商店条件、单行任务条件完整 |
| 5116 钴铁矿 | 采集、采集点、雇员探险、特殊商店、理符 | 2182337 / 2026-03-11T18:10:15Z | 采集点只是 [189]；理符是计数 12；不能直接当成完整路线 |
| 5059 钴铁锭 | 寻宝、制作 | 2182280 / 2026-03-11T18:10:08Z | 制作仅存职业/等级摘要；完整材料由配方关联补齐 |
| 4930 公主鳟 | 雇员探险、商店、钓鱼 | 2182151 / 2026-03-11T18:09:51Z | 钓鱼为钓场 ID 列表；不是完整鱼饵/天气/时间数据 |
| 6269 独角兽笛 | 任务 | 2183486 / 2026-03-11T18:12:42Z | 任务 65730“我唯一的希望”；需要任务数据补起始 NPC/位置等 |
| 46728 二型通用规格神典石 | 副本、特殊商店 | 2222638 / 2026-03-11T19:36:09Z | 副本首领“狂热糖潮”与兑换路线并列；另有用途“特殊商店” |
| 19124 吉祥天女羽衣 | 其他、副本 | 2195912 / 2026-03-11T18:39:28Z | 副本掉落和人工补充的饰品分解路线并列 |
| 39486 永恒角笛 | 其他 | 2215603 / 2026-03-11T19:21:14Z | 手工描述任务、四件配饰与 NPC 对话；`模板解析=true` |

钴铁矿的 `parse` 验证额外展开出北萨纳兰 X:23.3、Y:24.3、50 级矿脉与物品采集等级 47。钴铁锭展开出两种 42 级配方：钴铁矿 ×2 + 铁矿 ×1，并分别消耗火之碎晶 ×5 / 冰之碎晶 ×5。公主鳟的采集段仅给捕鱼人等级 5，将钓场与鱼饵细节链接到“鱼糕”。因此“达到 Wiki 的直观程度”不等于能从单个 Item JSON 获得所有数据，也不等于 Wiki 本身已包含所有钓鱼条件。

## 先分清来源、用途和摘要

`来源` 表示“怎样拿到当前物品”；`用途` 表示“拿当前物品去做什么”。例如钴铁矿有用途“制作”，不能把它参与的钴铁锭配方反向称为矿石来源。二型通用规格神典石的来源和用途都可有特殊商店，必须分别解析交易输出与成本。

实测的 [Item/Page 模块](https://ff14.huijiwiki.com/wiki/模块:Item/Page) 修订 2377653（2026-09-12T16:08:46Z）有独立的来源分发（169–225 行）和用途分发（226–260 行）。模块先用 `mw.huiji.db.find` 按 Item ID / 中文名取数据，再关联配方、任务、采集等内容。短摘要 [Item/ItemSource](https://ff14.huijiwiki.com/wiki/模块:Item/ItemSource) 还会将交易压缩成“兑换（若干种方式）”；它适合摘要，不适合作为底层模型。

`action=lua&module=Item/LinkAsync&id=50777` 已验证成功，但只返回 ID、名称、图标及品质，**不返回来源**。不能因为模块名包含 Item 就把它误当物品来源 API。`action=lua` 的 `paraminfo` 显示其来自 HuijiDragonstone 扩展，属于站点扩展，不是 MediaWiki 通用标准。

## 可复现 API 参数

所有请求都加 `format=json&formatversion=2`；参数值应由 URL 编码器编码。

| 用途 | 参数 |
|---|---|
| 站点信息 | `action=query&meta=siteinfo&siprop=general` |
| 原始物品 JSON | `action=query&prop=revisions&titles=Data:Item/50777.json&rvprop=ids\|timestamp\|content\|contentmodel&rvslots=main` |
| 物品页源码 | 同上，把 titles 换成 `物品:加特勒`，可加 `redirects=1` |
| 展开页面 | `action=parse&page=物品:加特勒&prop=text\|wikitext\|sections\|revid\|templates&redirects=1` |
| 发现 API 能力 | `action=paraminfo&modules=query+revisions\|parse\|lua&helpformat=raw` |
| 经验证的 Lua 模块 | `action=lua&module=Item/LinkAsync&id=50777` |

`titles` 可用 `|` 批量传多个已知 Item ID。此处只验证小批次，未验证全站批量采集限制。需要处理 `missing`、`error`、HTTP 429/5xx、非 JSON 响应，限制并发，尊重服务器要求并缓存修订信息。按 ID 构造 Data 页名可以避开物品中文名改动和同名歧义；返回后仍应校验 `data.ID === requestedItemId`。

JavaScript 示例（适合服务端 Node.js；本轮实际验证使用浏览器 fetch，网络环境不同仍需验证）：

```js
const itemIds = [50777, 5116, 5059, 4930];
const url = new URL('https://ff14.huijiwiki.com/api.php');
url.search = new URLSearchParams({
  action: 'query',
  prop: 'revisions',
  titles: itemIds.map(id => `Data:Item/${id}.json`).join('|'),
  rvprop: 'ids|timestamp|content|contentmodel',
  rvslots: 'main',
  format: 'json',
  formatversion: '2',
});
const response = await fetch(url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const payload = await response.json();
if (payload.error) throw new Error(JSON.stringify(payload.error));

for (const page of payload.query.pages) {
  if (page.missing) continue; // 记录 missing，不能解释为无来源。
  const rev = page.revisions?.[0];
  if (!rev?.slots?.main?.content) continue;
  const item = JSON.parse(rev.slots.main.content);
  console.log({
    itemId: item.ID,
    name: item['中文名'],
    sources: item['来源'],
    usages: item['用途'],
    wikiTitle: page.title,
    revid: rev.revid,
    revisionTimestamp: rev.timestamp,
  });
}
```

PowerShell 示例（参数同一 API；本机先前 Invoke-WebRequest 遇到 TLS 故障，因此此示例不标为在本机已成功运行）：

```powershell
$wikiParameters = [ordered]@{
    action = 'query'
    prop = 'revisions'
    titles = 'Data:Item/50777.json'
    rvprop = 'ids|timestamp|content|contentmodel'
    rvslots = 'main'
    format = 'json'
    formatversion = '2'
}
$wikiQuery = ($wikiParameters.GetEnumerator() | ForEach-Object {
    '{0}={1}' -f [Uri]::EscapeDataString($_.Key),
        [Uri]::EscapeDataString([string]$_.Value)
}) -join '&'
$wikiResponse = Invoke-RestMethod -Uri ('https://ff14.huijiwiki.com/api.php?' + $wikiQuery)
if ($wikiResponse.error) { throw ($wikiResponse.error | ConvertTo-Json -Compress) }
$wikiPage = $wikiResponse.query.pages[0]
if ($wikiPage.missing) { throw 'Wiki Data page missing' }
$wikiRevision = $wikiPage.revisions[0]
$wikiItem = $wikiRevision.slots.main.content | ConvertFrom-Json
$wikiItem.'来源' | ConvertTo-Json -Depth 30
```

## 实测限制与证据边界

1. 普通 web 抓取部分灰机页面返回 403，但 Playwright 正常浏览器环境的上述 API 可读。不能把 web 抓取失败写成 API 必须授权。
2. `siteinfo` 在页面导航时可读，返回 MediaWiki 1.38.4；从 `about:blank` 跨域 fetch 的同一请求被 CORS 拒绝，加 `origin=*` 也未成功。其他已列出的 API fetch 正常。后续应采用受控服务端同步，不能据此假设任意前端跨域调用稳定。
3. 页面修订与 Data 修订不同，Lua 还可能读取更多当前数据。仅存物品页 `revid`，甚至只请求页面 `oldid`，都不足以冻结整条来源链；应保存实际 Data 修订、关键关联数据版本和获取时间。
4. Wiki 是对照与补充证据，不是“全物品穷尽证明”。本轮验证 8 个 Item JSON，并额外解析 4 个物品页面；没有执行全站扫取，也未验证掉率、所有任务条件或所有时限条件。
5. Wiki 有[人工补充来源表](https://ff14.huijiwiki.com/wiki/Data:物品来源/其他.tabx)及[采集点补充表](https://ff14.huijiwiki.com/wiki/Data:补充数据/采集点.tabx)。后者说明隐藏采集物可能无法直接从客户端获得。实际 Data 中的“其他”描述还可能含 Wiki 模板，应保留原始描述、来源链接及解析状态，不能把未知文本强行推断成确定结构。
6. 成就路线本轮只从渲染模块确认类别存在，未取得独立成就 Item 的 API 对照，不应标记为已验证。

## 证据与参考

- [精简 API 证据](./2026-10-23-api-verification.json)：请求 URL、HTTP 结果、修订时间、50777 完整来源及其他代表来源；不含整页 HTML 或整份 Lua 模块。
- [灰机官方 API 文档](https://huijiwiki.com/wiki/帮助:API)
- [MediaWiki Revisions](https://www.mediawiki.org/wiki/API:Revisions)
- [MediaWiki Parse](https://www.mediawiki.org/wiki/API:Parsing_wikitext)
- [MediaWiki Paraminfo](https://www.mediawiki.org/wiki/API:Parameter_information)
