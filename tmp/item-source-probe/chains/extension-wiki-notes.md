# 货币与未闭合分支：独立 Wiki 证据

2026-10-24（Asia/Shanghai）。本文件只记录 Wiki 对照，不能作为本地获取链的来源提供者。所有请求通过 Playwright 页面在 `https://ff14.huijiwiki.com` 同源匿名 `fetch` 完成，`credentials: omit`；原始 API URL、HTTP 状态、抓取时间与 revision 均保存。未用 Wiki 数据反填本地关系。

## 快照与 API

- [extension-wiki-items.json](extension-wiki-items.json)：10 个目标/成本/货币 Item Data，HTTP 200，10 个 `ok`。
- [extension-wiki-upstream.json](extension-wiki-upstream.json)：5 个进一步上游 Item Data，HTTP 200，5 个 `ok`。
- [extension-wiki-currency-cases.json](extension-wiki-currency-cases.json)：另 5 个独立货币解码样本，HTTP 200，5 个 `ok`。
- [extension-wiki-instances.json](extension-wiki-instances.json)：3 个副本的 `Data:Instance/<id>.json`，包含最终 Boss、道中 Boss 和新手奖励的货币数量。路径由实际副本页面提供的数据文件链接发现；`Data:InstanceContent/` 的失败尝试保留于 [extension-wiki-instance-probe.json](extension-wiki-instance-probe.json)。
- [extension-wiki-currency-articles.json](extension-wiki-currency-articles.json)：主命名空间的两篇货币说明，包含原始 wikitext、展开 HTML、纯文本和 revision。
- [extension-wiki-currency-pages.json](extension-wiki-currency-pages.json)：`物品:` 命名空间的解析尝试，保留失败证据。巧手紫票页面返回 Lua 内存错误；诗学物品页的展开内容没有给出来源清单。
- [extension-wiki-currency-search.json](extension-wiki-currency-search.json)：定位主命名空间货币文章的搜索响应。

物品结构化读取：`action=query&prop=revisions&rvprop=ids|timestamp|content|contentmodel&rvslots=main&titles=Data:Item/<id>.json&format=json&formatversion=2`。货币说明读取：`action=parse&page=<主命名空间标题>&prop=text|wikitext|revid&format=json&formatversion=2`。

## 可直接对照的兑换与上游身份

Wiki 的 `兑换信息.index` 是一基序号，原型 `SpecialShop.offerIndex` 是零基序号，比较时必须转换。下表数量均为取得一件目标物品的报价；材料之间为 AND，不是任选其一。

| 目标 | Wiki 商店 / 一基 index | 成本 | Item Data revision |
|---|---|---|---|
| 46314 木工秘籍第十二卷 | 1770627 / 17；1770874 / 17 | 33913 巧手紫票 × 1200 | 2222224 |
| 41680 龙须拳·优雅 | 1770733 / 2 | 40091 改良型龙须拳 × 1 + 41699 全天强化药 × 1 | 2217735 |
| 40091 改良型龙须拳 | 1770699 / 2；1770823 / 1 | 28 亚拉戈诗学神典石 × 600 | 2216205 |
| 40091 改良型龙须拳 | 1770700 / 2 | 40016 龙须拳 × 1 + 28 亚拉戈诗学神典石 × 100 | 2216205 |
| 40091 改良型龙须拳 | 1770756 / 2 | 12995 白银陆行鸟的羽毛 × 5 | 2216205 |
| 41699 全天强化药 | 1770727 / 2 | 41080 阿罗阿罗岛书籍 × 1 | 2217754 |
| 41699 全天强化药 | 1771004 / 4 | 50847 科尔沃黄铜币 × 40；报价另列成就 3898 | 2217754 |
| 41699 全天强化药 | 1771005 / 18 | 49125 科尔沃书籍 × 20 | 2217754 |

| 上游物品 | Wiki 来源 | revision | 对原型的意义 |
|---|---|---|---|
| 32161 雇员的宝箱 | RetainerTask 395 自由探索委托；2 探险币，60 分钟 | 2240725 | 13722 金属靛染剂的容器分支可追到雇员任务；不说明目标染剂保证掉落 |
| 33441 庆典礼物箱 | FATE 1712、1713、1714、1715、1716；每项银牌 1 箱、金牌 2 箱 | 2254109 | 13722 的另一来源容器；不得合并银/金奖励或推出当前活动时段 |
| 35686 弗里金武器箱（品级533） | Quest 69935 过去的记录 | 2211934 | 34391 赛加羚羊革魔导典可经任务奖励箱闭合；未比较职业开箱条件 |
| 41080 阿罗阿罗岛书籍 | Content 37006 零式异闻阿罗阿罗岛；BNpcName 12506 斯塔缇丝 | 2217161 | 41699 的书籍报价可继续追到指定副本/Boss |
| 49125 科尔沃书籍 | Content 37007 异闻商客奇谭；BNpcName 14274 火仙女佩莉 | 2224985 | 41699 的另一书籍报价可继续追到指定副本/Boss |
| 40016 龙须拳 | `Unobtainable: 不再使用的点数装备` | 2216131 | 旧强化报价仍存在不代表材料仍可获得；应保留边界说明 |
| 12995 白银陆行鸟的羽毛 | 官方运营活动；多个道具商城礼包，包含在售/停售标志 | 2425829 | 游戏表之外的获取机制和运营状态，不能声称仅靠本地表已闭合 |

13722 的 Item Data 同时列出 2 个来源容器与 7 个鉴定来源；本轮容器分支闭合不等于已支持全部鉴定路径。34391 除来源容器外，还列制作（炼金术士 84 级、配方等级 530）和金币商店，找到任务箱路径不等于制作与商店路径已经完成。

## 货币不能只看 Item Data

`Data:Item/33913.json`（revision 2210236）和 `Data:Item/28.json`（revision 2177311）的 `来源` 都是空对象。这不能解释为货币无法获取，亦不能据此宣布本地来源不匹配。

已通过 API 搜索定位并读取主命名空间文章：

- [巧手紫票](https://ff14.huijiwiki.com/wiki/%E5%B7%A7%E6%89%8B%E7%B4%AB%E7%A5%A8)，revision 2361181：列出收藏品交纳与老主顾交易两类获得机制，并说明解锁任务、秘籍兑换任务和各地交易开放条件。可用来核对本地工票提供者的机制类型；文章没有给出本轮具体收藏品每档奖励数字，不能把机制对齐说成每条配额都已核验。
- [亚拉戈诗学神典石](https://ff14.huijiwiki.com/wiki/%E4%BA%9A%E6%8B%89%E6%88%88%E8%AF%97%E5%AD%A6%E7%A5%9E%E5%85%B8%E7%9F%B3)，revision 2300392：列出副本、随机任务、对战、寻宝、狩猎、深层迷宫、特殊场景探索、特殊迷宫探索、友好部族任务、天书奇谈与假面狂欢。支持本地使用副本奖励作为一种货币来源；不证明已枚举所有来源，也不证明每次奖励数或是否个人必得。

这些 Wiki 页面只用于独立证据与差异说明；本地 currency decoder 仍需由原始表/已核查的依赖映射解析 `UseCurrencyType` 和货币编号。

## 额外货币解码样本

| 目标 | Wiki 商店 / 一基 index | Wiki 成本 | revision |
|---|---|---|---|
| 7778 木工秘籍第一卷 | 1769503 / 8 | 5379 硬化云杉木材 × 1，HQ=true | 2184972 |
| 2928 矿工头灯帽 | 1770114 / 1 | 33914 大地紫票 × 50 | 2180159 |
| 41778 名匠魔晶石拾贰型 | 1770507 / 1 | 41784 巧手橙票 × 500 | 2331638 |
| 41775 达识魔晶石拾贰型 | 1770510 / 1 | 41785 大地橙票 × 500 | 2331633 |
| 23310 天青图腾·破防 | 来源为空，未列兑换报价 | `购买价格=2` | 2200057 |

前四例能独立核对物品身份、数量与 HQ。23310 只支持对比 Item 基础购买价格，不能借此确认 SpecialShop mode 8 的实际报价或来源；该点应为未核验，而非 Wiki 完全一致。

已实际运行当前 `chain-currency.mjs` 并对照原始 Wiki 成本字段，结果为 **4 项一致、1 项未核验**，保存在 [extension-wiki-currency-verification.json](extension-wiki-currency-verification.json)。每项一致同时比较 Item ID、数量与 HQ。

## 诗学副本奖励的直接字段核验

读取 [间歇灵泉哈姆岛](https://ff14.huijiwiki.com/wiki/%E9%97%B4%E6%AD%87%E7%81%B5%E6%B3%89%E5%93%88%E5%A7%86%E5%B2%9B) 的展开页，发现它明确链接 `Data:Instance/90.json`。原始展开页在 [extension-wiki-duty-page.json](extension-wiki-duty-page.json)；它也将各 Boss 的奖励直接显示为亚拉戈诗学神典石，避免仅按字母 A 猜币种。

| Instance ID | 副本 | 最终 Boss `BOSS.货币A` | 道中 `道中BOSS[].货币A` | 整本 Boss 合计 | `新手奖励货币A` | Data revision |
|---|---|---:|---|---:|---:|---:|
| 24 | 惨剧灵殿塔姆·塔拉墓园 | 25 | 10、15 | 50 | 60 | 2095913 |
| 90 | 间歇灵泉哈姆岛 | 35 | 15、20 | 70 | 70 | 2096178 |
| 91 | 异界深渊月面地下溪谷 | 50 | 20、30 | 100 | 80 | 2096180 |

`FinalBossCurrencyA` 应只对照最终 Boss 一列。整本合计、首次奖励是另一个语义，不能互相代替；首次奖励不得计入每次重复获取的基础奖励。这里验证原始金额与身份，不据此承诺个人必得、解除限制后的奖励或所需刷本次数。

对原始 MCP `InstanceContent-earning.json` 执行了独立字段比较：3 个副本 × 最终 Boss / 道中 Boss 集合 / 新手奖励，**9 项全部一致**，保存在 [extension-wiki-instance-verification.json](extension-wiki-instance-verification.json)。本核验尚不是新获取链提供者的集成验收。

## 尚不能据本轮证据宣布的结论

- “存在一条支持的获取路径”不等于“所有 OR 分支完整”、所有兑换条件满足或旧物品当前可获取。
- API 响应正常不等于页面模板正常，货币 `物品:` 页本轮已出现 Lua 错误。
- 40016 与 12995 属于目前特别需要保留边界的两条材料路线；不能因为目标装备另有 600 诗学路线就把这些分支标记完成。
- 所有表格事实都保留了 Wiki 原值；副本 CFC/Content 与 NPC RowId 命名空间、兑换下标仍须在本地比较时转换验证。
