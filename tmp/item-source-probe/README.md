# 临时物品来源抽样实验

后续已补 [副本多跳获取链原型](chains/README.md)：22 个目标展开、兑换 AND 成本、容器上游、循环/截断，以及 12 项 Wiki 分段核验。原始随机抽样结果仍保留，不混入这批定向验证。

实测日期：2026-10-24（Asia/Shanghai）。这是底层表关联的可行性实验，不是现有 `get_item_sources` 的测试；没有执行 `publish/mcp-lumina.exe`。

## 本轮结果

**部分核心数据可以达到 Wiki 的数据粒度，但当前表关联加 Supplemental 不能直接替代 Wiki 的完整来源说明。**

固定 seed `2026-10-24-lumina-wiki-01`，从本地候选池按类别内去重 Item ID 抽样：40 个子类型，每类 3 例，共 120 个类别样本、118 个不同物品。按 `SHA-256(seed|type|itemId)` 排序取前 3，先固定样本再查询 Wiki，失败和不一致均不换样。118 个 Item Data 页全部成功读取，另读取了三个样本配方的 Recipe Data 和展开页面。

| 判定 | 类别样本数 | 含义 |
|---|---:|---|
| 部分对齐 | 83 | 已核验的关系或字段一致，仍有条件/位置/数量等未核验项；其中理符 3 例只比来源计数 |
| 存在差异 | 14 | 经命名空间映射和合并机制后，两端来源实体集合仍不同 |
| Wiki Data 未列该机制 | 15 | 此次读取的 Item Data 没有对应键或子类；不代表展开页面或游戏中没有 |
| 无法比较 | 8 | 商城跨区 2 例、特殊场景枚举 3 例、重建检验机制映射 3 例未建立 |

这些是抽样观察，不是全物品准确率。各分支保留未核验项，因而没有样本被标为“完整页面等价已验收”；这也不能推导为这些样本均无法达到 Wiki。

## 已经能对齐的内容

| 类别 | 随机样本 | 已核验范围 | 尚未完成 |
|---|---|---|---|
| 制作 | 民兵手链 4173、夏季靛蓝衬衫 27941、宇宙探索用的开心粉 49972 | 各 14 项检查一致：等级摘要、职业 ID、等级表、实际等级、星级、产物、产量、全部直接材料与水晶、作业/加工要求、专精/HQ/高难度、秘籍物品 | 完整获取链、任务/场景触发、Wiki 全配方集合的独立穷举 |
| 普通雇员 | 库尔札斯胡萝卜种子 7717、泽梅尔番茄 6148、冰神鱼 12765 | 外层任务 ID 集合一致，各 7 项：职业组、等级、探险币、时间、经验、产量档位、属性门槛 | 发现物品与解锁条件 |
| 采集/刺鱼 | 各 3 例，见逐例结果 | GatheringPointBase 集合、转换后的物品等级/星级一致 | 职业、物理点位、限时/隐藏/鱼群等条件 |
| 钓鱼/任务/成就 | 各 3 例 | 钓场/任务/成就实体集合；成就另比奖励、名称、描述、点数 | 鱼饵天气、任务奖励规则、成就领取步骤 |
| 特殊商店 | 木工秘籍第十二卷 46314、龙须拳·优雅 41680、戈耳狄原型强袭角盔 11450 | Shop+报价 index 集合、全部产出数量/HQ、已知任务条件；已确认的原始物品货币模式可比成本 | 特殊货币编码、NPC 菜单/坐标、其他条件 |
| 理符 | 冰之碎晶 3、盗龙革手环 4153、铋金锭 36170 | 本地反查的去重理符数与 Wiki 数字摘要 200/6/3 一致 | 数字不是任务 ID，尚未证明身份和奖励组一致 |

`Recipe` 附加页按本地配方 ID 请求，所以只证明候选配方及字段一致，不把它当作独立发现的 Wiki 全部配方。

## 实际差异与解释

| 物品 | 观察到的差异 | 说明 |
|---|---|---|
| 食果花鼠 8202、金属靛染剂 13722 | Wiki 物品箱集合均多出 Item:33441 | 本地已合并 loot/card_pack/coffer，仍有缺边 |
| 九宫幻卡：欧米茄 23916 | 本地多 InstanceContent:30071 | Wiki 仅列 30072、30076；共有副本名称一致，不是语言差异 |
| 战果记录：慈悲为怀布拉兹 30347 | Wiki 多 Fate:1607、1610、1612 | CSV 中缺少这些实体关联 |
| 战果记录：魔导技师长西西尼乌斯 30353 | 本地 Fate:1612；Wiki Fate:1620、1628 | 两端集合不同，不能靠增加中文名修复 |
| 伞叶无花果种子 7754、皇家可可豆种子 7750 | Wiki 分别多 2、29 组输入种子组合 | 无序双种子 AND 组合对照；方向、土壤、概率另未验证 |
| 多个鉴定样本 | 一部分本地多 Item:23224；另一部分 Wiki 多 Item:16171 等 | 已合并全部鉴定子类型，避免用单一箱子类型对整个 Wiki 类别造成假差异 |

“差异”只描述固定版本的两个证据集，尚不能单凭本轮认定哪端过期或错误。14 例包括同一物品在不同抽样子类型出现的情况，不能理解为 14 个不同物品。

另有几类必须保留不确定性：

- 随机雇员三例的 Wiki 只列普通筹集；普通与随机必须按 `随机任务` 分开，不能看到 `雇员探险` 键就算命中。
- `白泽的火之眼`、`未鉴定的攻势文理碎晶` 虽未列本次映射的 FATE/掉落键，仍有特殊场景或人工说明，不能说 Wiki 无来源。
- 三个潜水艇样本、部分分解/精选/栽培样本没有对应 Item Data 键，不能据此否定本地关系。
- 木工秘籍第十二卷出现 `UseCurrencyType=16 / ItemCost=2 / CostType=3`；Wiki 为巧手紫票 33913 × 1200。原码 2 不是 Item:2。另一个 mode16 报价又使用普通材料原码，不能仅凭表级 mode 写统一替换。
- 金币商店未成功建立样本池：泛型 MCP 的 `GilShopItem` 读取结果 Item 全为 0，且子行未可靠展开。必须修复或提供子行读取接口后重试。

## 数据与实现

- 游戏表：通过已经配置好的 Lumina MCP `describe_sheet`、`list_rows`、`get_rows` 读取，游戏版本 `2026.10.06.0000.0000`。按 RowId 与类型化引用关联；中文名只用于展示/辅助核验。
- 补充数据：项目当前依赖 **LuminaSupplemental 5.1.4**，固定提交 `e9bf1495bf8588d2cf21441ef03f0d9dfe0f790a` 的 33 个 CSV；核验 Git blob SHA。没有使用上游新版本冒充现有依赖能力。
- Wiki：匿名 MediaWiki API revisions，读取 `Data:Item/<id>.json`，保存修订 ID、修订时间、HTTP 状态与原始内容。直接 Node 请求曾遇到站点挑战，本轮通过已打开 Wiki 的浏览器上下文同源 `fetch` 成功读取，`credentials: omit`。
- 全部 120 例核心比较基于结构化 Data 页；仅制作样本额外检查展开页面。因此这里测试的是来源数据关系，不是全站页面显示等价性。
- Item Data 的来源可能为数组、对象、数字或说明，比较器按实际形状解析；只读取“来源”，不混入“用途”。
- 副本先用 CFC.Content 映射 InstanceContent；雇员先从产出表关联外层任务；刺鱼从 Notebook 关联 Base；飞空艇用真实区域名称解析编号，不统一猜 RowId+1。

| 文件 | 用途 |
|---|---|
| [probe.mjs](probe.mjs) | 建立候选池、固定随机样本、运行比较、生成报告 |
| [compare-base.mjs](compare-base.mjs) | 9 个基础表类型的关系及字段比较 |
| [compare-supplemental.mjs](compare-supplemental.mjs) | 31 个补充数据子类型的比较 |
| [supplemental.mjs](supplemental.mjs) / [supplemental-adapters.mjs](supplemental-adapters.mjs) | 固定版本 CSV 获取、完整性验证、关联适配 |
| [fetch-wiki.mjs](fetch-wiki.mjs) | 批量匿名 Wiki API 读取；也可导出浏览器执行函数 |
| [manifest.json](manifest.json) | seed、每类候选数、120 例及原始引用 |
| [results.md](results.md) / [results.json](results.json) | 逐类/逐例判定；JSON 含本地值、Wiki 值、双向差集 |
| `inputs/` / `details/` | MCP 表索引与完整明细、Wiki 原始数据、依赖清单 |

## 重跑

本轮已生成全部证据。无需联网即可重跑比较（Node.js，本次使用 v26.8.1；没有额外 npm 依赖）：

```powershell
node tmp/item-source-probe/probe.mjs compare
```

如要另抽一批：设置 `PROBE_SEED`（可选 `PROBE_PER_TYPE`），然后运行 `select`。**该命令会覆盖 manifest；必须再更新 Wiki 和样本完整行明细**，不要沿用旧样本的 details 并将缺字段当一致。

```powershell
$env:PROBE_SEED = 'another-fixed-seed'
node tmp/item-source-probe/probe.mjs select
node tmp/item-source-probe/fetch-wiki.mjs
```

若直接 HTTP 遇到挑战，可导出浏览器函数，交给现有 Playwright MCP 的 `browser_evaluate` 在 Wiki 页面执行，结果保存为 `inputs/wiki-items.json`：

```powershell
node tmp/item-source-probe/fetch-wiki.mjs --browser-function --output tmp/item-source-probe/wiki-browser-function.js
```

MCP 表快照不是脚本自行启动 exe 得到的：它们由当前会话的已配置工具导出。换游戏版本或换样本后仍需通过该 MCP 导出相应 `sheet/rows[{rowId,fields}]` 到 `inputs`/`details`；本实验没有另起进程或复制 MCP 启动参数。

40 个子类型来自 9 个基础表候选池和 31 个补充池，并非全部游戏机制。军票/其他专用交易、手工活动、寻宝等未建立独立候选池；`supplement_unknown` 无记录；金币商店读取失败。未抽样项不计入 120 例。

已做核验：所有模块语法检查、完整比较实际运行、Wiki 标题和 Item ID 对齐、固定样本完整性、配方材料数量/任务 ID/雇员命名空间/未知货币模式的故障注入。未修改产品代码，未运行产品 build/test 冒充数据正确性证明。
