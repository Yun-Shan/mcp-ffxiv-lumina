# 获取链临时原型

更新于 2026-10-24。仅临时 JavaScript 和分析文档，正式 MCP 接口未修改。游戏表均从配置好的 Lumina MCP 直接读取，未运行 exe 或采用 get_item_sources。默认图读取本地快照和固定 LuminaSupplemental 5.1.4，不依赖网络。

## 当前结果

22 个固定目标中，**21 个**至少存在一条全部物品输入追到支持来源证据的路径；初版为 18 个。本轮补通金属靛染剂、赛加羚羊革魔导典、龙须拳·优雅。

木工秘籍第十二卷已正确解析为 **1200 巧手紫票**，但收藏品/老主顾子表由当前泛型 MCP 读取时出现无效物品和疑似字段错位，尚未闭合到具体交纳品。外部子行诊断另存，不混入本地数据来消除缺口。

“存在结构路径”不表示所有 OR 分支完整，也不保证品质、任务前置、个人产量或当前可获取性。来源行动叶保留条件，不继续展开所有行动前置及费用。这是原随机样本的定向扩展，不追加到原 120 例随机统计。

- [完整分析：货币规则、获取链、子行问题和边界](../../../docs/research/currency-chain-extension.md)
- [战斗装备来源缺口、优先级和验收标准](../../../docs/research/combat-gear-acquisition-gaps.md)
- [22 个目标的树形结果](results.md) / [完整 JSON](results.json)
- [28 项增量 Wiki 集成核验](extension-verification.md)：25 一致、3 差异
- [原 12 项副本分段核验](verification.md)：11 一致、1 差异
- [Wiki 原始证据说明](extension-wiki-notes.md)
- [制作材料账和新增提供者说明](additional-source-notes.md)

48 项临时脚本测试通过。全表 26,025 个非空 SpecialShop 成本槽中，25,459 个身份和显式正数成本已解析；566 个 mode8 隐式金币价格仍未验证。测试/编码解析/独立 Wiki 对照分别计数，不互相代替。

## 模型与语义

- 路线之间是 **OR**；一次兑换或制作的材料是 **AND**。根据输出数量向上取整计算批次，同物品同品质要求的重复成本槽合并。
- 每个成本槽按 CostType 解析普通物品、HQ、神典石索引或票据桶；神典石按 TomestonesItem.Tomestones 字段连接。未知编码和价格保持未验证。
- 配方读取全部八个材料槽，包括水晶；缺槽停止。CanHq 不代表保证 HQ。
- 容器只展开一次开箱尝试，保证开箱数未知；职业依赖保留描述。
- Boss 掉落、Boss 箱、场景箱与环节不明的副本来源分别保留。DungeonBossId=0 不证明道中箱；潜在重复箱子不合并或累加概率。
- 副本货币只接三个已核验副本的 CurrencyA。基础总额、最终 Boss、新手额外分别记录，不推算必需刷本次数。
- 制作材料可到采集、雇员、任务、怪物来源。雇员用外层 RetainerTask；任务保留固定/可选和是否可重复。
- 路径级循环、深度、节点/分支预算、缺字段、未知来源显式保留。expanded 只表示遍历完成，不表示可执行性通过。

## 代表路线

日影兰战锤 35247：零式万魔殿 边境之狱4 → 直接装备首领箱；或 → 日影兰武器箱 → 对应职业开箱；或 → 第4页边境的断章 ×8 → 兑换。mode16 的另一份普通断章报价已按 CostType 0 正确解析。

戈耳狄原型强袭角盔 11450：启动之章1/2/3 → 戈耳狄透镜 ×2 → 兑换。启动之章2本地 Boss 关联缺失仍保留。

龙须拳·优雅 41680：**改良型龙须拳 ×1 AND 全天强化药 ×1**。基础武器可经诗学 ×600 → 已核验副本奖励；强化药可经科尔沃黄铜币 ×40 → 场景箱。旧基础武器、运营羽毛和两种书籍等替代路线仍有缺口，详见增量核验清单。

## 重跑

在仓库根目录执行：

```powershell
node tmp/item-source-probe/acquisition-chains.mjs plan
node tmp/item-source-probe/acquisition-chains.mjs run
node tmp/item-source-probe/verify-chains.mjs
node tmp/item-source-probe/verify-chain-extension.mjs
node --test tmp/item-source-probe/chain-*.test.mjs
```

默认 maxDepth=4、maxNodes=1200、maxAlternatives=40，可用 --depth、--nodes、--alternatives 调整。plan 列出已探索商店/物品/配方的缺字段抓取计划；为零不表示所有来源类型齐备。

单物品示例：`node tmp/item-source-probe/acquisition-chains.mjs run --items 35247 --quantity 2`。断章成本为 16；开箱仍只展示一次尝试。该命令覆盖 results 文件，完成后运行默认 run 恢复 22 个目标，再做 Wiki 核验。

| 文件 | 职责 |
|---|---|
| [acquisition-chains.mjs](../acquisition-chains.mjs) | 合并 MCP 快照、默认样本、抓取计划、树形报告 |
| [chain-graph.mjs](../chain-graph.mjs) | 兑换/制作/开箱图、AND/OR、数量与循环/预算控制 |
| [chain-currency.mjs](../chain-currency.mjs) | 成本身份、HQ/收藏价值和数量解析 |
| [chain-currency-earning.mjs](../chain-currency-earning.mjs) | 三个已核验副本的诗学奖励 |
| [chain-dungeon.mjs](../chain-dungeon.mjs) | Boss/场景箱及副本原始证据 |
| [chain-additional.mjs](../chain-additional.mjs) | 制作、采集、雇员、任务、怪物来源 |
| [verify-chain-extension.mjs](../verify-chain-extension.mjs) | 字段比较、成本全表审计、未支持上游清单 |
| [probe-collectables-subrow.mjs](../probe-collectables-subrow.mjs) | 显式运行才请求外部 XIVAPI 的子行诊断；结果不进入图 |

全部结果为 partial_evidence_only。完整 NPC 菜单/坐标、全部货币获取机制、周限、箱子身份和品质/资格求解尚未验收。
