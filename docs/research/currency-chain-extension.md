# 特殊货币解析与获取链增量验证

日期：2026-10-24。仅修改 `tmp/item-source-probe/` 临时脚本及分析文档；未修改正式接口、未运行 publish 下的 exe、未使用 `get_item_sources` 的聚合结果。游戏数据通过已配置 Lumina MCP 直接读表，版本 `2026.10.06.0000.0000`；补充关系仍固定 LuminaSupplemental 5.1.4。

## 本轮结果

沿用前轮 22 个目标，没有另挑更容易闭合的样本。原先 18 个目标存在来源证据路径，现为 **21 个**。此前四个未闭合目标中的三个已补通；木工秘籍第十二卷已经解析正确兑换货币，但货币的获得明细仍受 MCP 子行读取问题阻挡。没有用 Wiki 的答案反填本地图来提高闭合数量。

| 原未闭合目标 | 本轮结果 | 仍需区分的条件 |
|---|---|---|
| 13722 金属靛染剂 | 雇员的宝箱 32161 → Random 30053 → 外层 RetainerTask 395 自由探索委托 | 2 探险币、60 分钟；随机拿箱和开出染剂均非保证，探险币获取作为行动条件保留 |
| 34391 赛加羚羊革魔导典 | 完整制作材料树可达采集/雇员/怪物来源；另有弗里金武器箱 35686 → Quest 69935「过去的记录」 | 成功制作/HQ 条件未求解；任务不可重复，开箱依赖职业 |
| 41680 龙须拳·优雅 | 改良型龙须拳 40091 ×1 **AND** 全天强化药 41699 ×1；前者可经诗学 600，后者可经科尔沃黄铜币 40 追到场景箱 | 强化药报价保留成就 3898；副本准入、箱子及个人奖励条件未全部验证 |
| 46314 木工秘籍第十二卷 | 正确解析为巧手紫票 33913 ×1200；停在紫票获取明细 | 已知收藏品交纳/老主顾两类机制，尚不能由有效本地子行连接具体交纳品和分档奖励 |

这里的“有路径”严格指：某条 OR 路线的每个 AND 物品输入均到达支持的来源证据。**不是所有 OR 分支已查全，也不是玩家当前可执行、次数足够或品质满足。** 副本/采集/雇员/任务/怪物作为来源行动叶，行动前置与探险币等费用没有全部递归建图。任务的一次性与开箱随机性不参与数量保证。

完整输出：[22 个目标树形结果](../../tmp/item-source-probe/chains/results.md)、[JSON](../../tmp/item-source-probe/chains/results.json)、[增量字段对照及未支持物品清单](../../tmp/item-source-probe/chains/extension-verification.md)。当前已进入图的商店/物品/配方明细抓取待办均为 0；这不代表所有来源提供者已实现。

## 特殊货币应按每个成本槽解码

关键修正是读取 `Item[i]CostType[k]`，不能只按整张商店的 `UseCurrencyType` 决定成本编号的含义。一个报价可以同时有普通武器和神典石，必须逐槽处理。

| CostType | 原码的意义 | 本轮处理 |
|---:|---|---|
| 0 | 普通物品 Item ID | 保留 Item ID；作为普通品质成本，不要求输入必须 HQ |
| 1 | HQ 物品 Item ID | 保留相同基础 Item ID，同时传播 `hq=true` |
| 2 | 神典石索引 | 关联 `TomestonesItem.Tomestones` 字段，取 `Item`，不能按该表 RowId 或 CurrencyInventorySlot 连接 |
| 3 | 特殊票据桶 | 本轮版本核验：2→33913 巧手紫票，4→33914 大地紫票，6→41784 巧手橙票，7→41785 大地橙票 |

旧神典石轮换不能靠商店名字推断。当前快照中 Tomestones 字段值 1/2/3/4 分别映射 Item 28/48/49/47；这个映射属于当前游戏版本，不能永久硬编码币名。本轮只接受观察到的商店模式 2/3/4/5/8/16；未观察模式、未知 CostType、废弃票据桶、缺失或冲突的关联显式停止。

例子：

- mode16、CostType 0、原码 35826：仍然是第4页边境的断章，不应因 mode16 停止。
- mode16、CostType 3、原码 2：巧手紫票，不是 Item:2 火之碎晶。
- CostType 2、原码 1：当前为 Item:28 诗学，不能误认成 Item:1 金币。
- 改良型龙须拳的旧升级报价：龙须拳 40016 ×1 **加** 诗学 28 ×100。普通材料和货币混合仍按 AND 展开。

解码器在 [chain-currency.mjs](../../tmp/item-source-probe/chain-currency.mjs)。映射交叉参考固定提交的 [ffxiv-collect](https://github.com/fae-industries/ffxiv-collect/blob/7c0249d3357d77b043290e92aaecf5eb4ef03fbd/lib/tasks/sources/shops.rake)、[Ultros 神典石关联](https://github.com/akarras/ultros/blob/11cc9ac1e2c0f161a024788011875613abcf93c0/xiv-gen/src/csv_to_rkyv.rs)、[票据桶映射](https://github.com/akarras/ultros/blob/11cc9ac1e2c0f161a024788011875613abcf93c0/xiv-gen/src/lib.rs) 和 [AllaganLib HQ 标记](https://github.com/Critical-Impact/AllaganLib/blob/c34734f75e369777e7ac36dc57c09a8fc3e78fd4/AllaganLib.GameSheets/Sheets/SpecialShopListing.cs)。原始行和代码出处保存在 [currency-evidence](../../tmp/item-source-probe/chains/currency-evidence/primary-sources.json)，独立 Wiki 样本进一步核对币种、数量、HQ。

### 全表成本槽审计与保留例外

读取 1489 个 SpecialShop 行，共 26,025 个非空成本槽：

| 解码结果 | 槽数 |
|---|---:|
| 普通物品正数成本 | 19,477 |
| HQ 物品正数成本 | 88 |
| 神典石正数成本 | 3,472 |
| 四类紫票/橙票正数成本 | 2,422 |
| mode8 隐式金币价格，仍未验证 | 566 |

因此 **25,459 个槽的身份和显式正数成本可解析**。这是编码审计，不是 25,459 条报价的 NPC 可达性或 Wiki 等价验收；缺失输出、每行解锁等仍由图另外检查。

mode8 中 `ItemCost=1, CurrencyCost=0` 不代表免费。外部提取器存在 Item.PriceMid 回退方案，但 Wiki 的样本 23310 仅列基础购买价 2、没有对应商店报价。当前仅输出 `candidateQuantity`，实际 `quantity=null, status=unverified`，不会生成免费来源或强行闭合。即使传入 PriceMid，也仍保留未验证状态。

## 诗学已接到具体副本奖励

新增 [chain-currency-earning.mjs](../../tmp/item-source-probe/chain-currency-earning.mjs)，暂只接三项实际核验的 InstanceContent。没有把 A/B/C 字母与当前三种神典石机械对应，也没有泛化到其他副本。

| InstanceContent | 副本 | 道中 Boss | 最终 Boss | 基础合计 | 新手额外 |
|---:|---|---|---:|---:|---:|
| 24 | 惨剧灵殿塔姆·塔拉墓园 | 10 + 15 | 25 | 50 | 60 |
| 90 | 间歇灵泉哈姆岛 | 15 + 20 | 35 | 70 | 70 |
| 91 | 异界深渊月面地下溪谷 | 20 + 30 | 50 | 100 | 80 |

`FinalBossCurrencyA` 只对应最终 Boss，整本基础数必须再加道中 Boss；新手奖励单列。副本 CFC 仍通过 Content/ContentType 校验命名空间。币种由 Wiki 渲染页面核对，数字来自原始 MCP 表，再与 `Data:Instance/<id>.json` 独立比较。保留 `requiredRuns=null`，没有把 600 诗学除以这些数字就声称必需刷几次。

## 制作与其他来源的接入

新增 [chain-additional.mjs](../../tmp/item-source-probe/chain-additional.mjs)，提供制作、采集、普通/随机雇员、任务和怪物掉落。完整证据与材料账见 [additional-source-notes.md](../../tmp/item-source-probe/chains/additional-source-notes.md)。

制作必须读取全部八个材料槽，包含水晶。旧 Recipe 索引只含槽 0、1、6、7，真实配方的 2、3 槽会丢失；本轮补读六份完整配方，缺任何材料/数量字段时 `missing_recipe_fields` 停止并进入抓取计划。请求数量按 `ceil(数量/配方产量)` 放大所有材料，同种材料合并数量。可制作 HQ 只是能力，不是结果品质保证。

采集需要实际完成 Item → GatheringItem → GatheringPointBase → GatheringPoint 连接。随机雇员需要 RetainerVentureItem → RetainerTaskRandom → 外层 RetainerTask；内层 Random:30053 不能当作任务 395。任务固定/可选奖励分开，一次性标记保留。所有来源都保留原始引用和条件。

## 巧手紫票的具体阻塞与已验证的下一步

Wiki [巧手紫票](https://ff14.huijiwiki.com/wiki/%E5%B7%A7%E6%89%8B%E7%B4%AB%E7%A5%A8) 主文章列出收藏品交纳与老主顾。`Data:Item/33913.json` 的来源却为空，因此不能仅以 Item Data 空对象判断无获取途径。Wiki 主文章可用于机制核验，但不提供本轮某个交纳品的完整分档数量。

应实现的表链为：

```text
CollectablesShop.ShopItems → CollectablesShopItem(rowId, subrowId)
  ├─ Item → 具体交纳品 → 完整 Recipe/采集来源
  ├─ CollectablesShopRefine → 低/中/高收藏价值门槛
  └─ CollectablesShopRewardScrip → Currency + 低/中/高奖励
```

老主顾另需 `SatisfactionNpc → SatisfactionSupply(rowId, subrowId) → SatisfactionSupplyReward`，保留 NPC 解锁、信赖阶段、每周次数和奖励等级要求。已读取奖励表与阈值表，但没有用孤立奖励行构造获取来源。

当前泛型 MCP 的 `get_rows` 只有 rowIds，没有 subrowId；[GenericSheetReader.cs](../../src/McpLumina/Services/GenericSheetReader.cs) 用 `ExcelSheet<RawRow>` 读取所有表，没有按 subrow 类型分流。这是根据代码和异常字段作出的实现缺陷判断，不是一次对正式代码的修复。实际 `CollectablesShopItem` 行 1 返回：

```text
Item = 0
RequiredQuest = 2038235136
LevelMin = 0, LevelMax = 80
CollectablesShopRefine = 80
CollectablesShopRewardScrip = 102
```

这不能生成有效物品成本。SatisfactionSupply 的读取同样观察到疑似错位，故未接入。原始 MCP 证据：[subrow-diagnostic-mcp.json](../../tmp/item-source-probe/chains/subrow-diagnostic-mcp.json)。

为确认正确数据形态，另写 [probe-collectables-subrow.mjs](../../tmp/item-source-probe/probe-collectables-subrow.mjs)，通过 [XIVAPI V2 的表读取机制](https://v2.xivapi.com/docs/guides/sheets/) 调取 `CollectablesShopItem/1:0`。它返回 Item 31101、Refine 102、RewardScrip 1、等级 80/80、RequiredQuest 0；本地奖励行 1、阈值行 102 可以据此形成候选连接。完整响应带外部 schema/version，存于 [subrow-diagnostic.json](../../tmp/item-source-probe/chains/subrow-diagnostic.json)。

**该外部版本没有证明与当前本地版本一致，且未取得此交纳品的独立 Wiki 数量核验，因此不注入 `chains/inputs`，不计为第 22 条闭合。** 没有对 MCP 字段做猜测移位修复。要完成本地闭合，需要能返回正确 `(rowId, subrowId)` 的数据通道，再核验一条具体收藏品的门槛、奖励与材料来源；正式接口本轮按要求保持不变。

## 独立核验与仍存在的差异

- **48 项临时脚本测试通过**，包括四类 CostType、HQ/收藏价值、冲突关联拒绝、mode8 不当免费、完整配方、AND/OR、数量传播、循环和截断，以及三个新闭合目标的真实数据集成测试。
- 之前的 12 项获取链分段核验重新运行：**11 一致、1 差异**，仍是戈耳狄透镜在启动之章2缺本地 Boss 关联。
- 本轮新增 **28 项集成字段/集合核验：25 一致、3 差异**。覆盖 10 个报价、来源箱/任务连接和三个副本各四项奖励字段。
- 另外四个货币样本的 Item ID、数量、HQ 与 Wiki 一致；mode8 样本保留未验证。此前九项副本原始字段比较与本轮十二项 provider 比较存在重叠，不能相加宣传为独立样本数。

新增的三项差异：金属靛染剂本地缺庆典礼物箱 33441；阿罗阿罗岛书籍 41080 本地缺副本 37006；科尔沃书籍 49125 本地缺副本 37007。这些 Wiki 线索保留在对照结果，没有写回 Supplemental 或当成本地已经恢复。

除唯一整目标未闭合的紫票外，当前图还保留 18 种其他没有支持来源的上游物品，主要出现在替代路线中：陈旧地图、双色宝石、特殊配给货箱、两种书籍、白银陆行鸟羽毛和旧龙须拳。详见机器生成清单。其中旧龙须拳的 Wiki 已标“不再使用的点数装备”；羽毛含运营/商城来源，不能从游戏表推导当前活动可用性。路径存在不消除历史材料和运营状态问题。

## 重跑

```powershell
node tmp/item-source-probe/acquisition-chains.mjs plan
node tmp/item-source-probe/acquisition-chains.mjs run
node tmp/item-source-probe/verify-chains.mjs
node tmp/item-source-probe/verify-chain-extension.mjs
node --test tmp/item-source-probe/chain-*.test.mjs
```

以上均读本地快照，不启动 MCP 进程或连接 Wiki。外部子行诊断只有显式运行 `node tmp/item-source-probe/probe-collectables-subrow.mjs` 时发起只读网络请求。默认图不依赖该外部结果。

## 战斗装备的后续优先级

后续按 [战斗装备来源缺口与验收优先级](combat-gear-acquisition-gaps.md) 收敛范围。21/22 是混合物品样本的结构指标；其中10件战斗装备均有路径，但完整 NPC 操作路线、所有材料替代来源、箱子分类、神典石赚取及限制条件仍需补齐。工票子行与隐式金币价格优先处理其中实际影响战斗装备的部分。
