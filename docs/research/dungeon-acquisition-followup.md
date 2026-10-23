# 副本来源四条路径核查

日期：2026-10-24。基于当前项目代码、已固定的 LuminaSupplemental 5.1.4 数据、上轮 Wiki Data 快照，并再次通过已配置 Lumina MCP 读取 SpecialShop 与 Item 原始行。未调用现有 get_item_sources，未执行 exe，未修改产品代码。

## 当前状态

**四条路径都有基础关系可以利用；当前接口仍输出单层来源，既没有保留完整首领/箱子身份，也没有展开兑换和开箱的上游路径。**

| 路径 | 底层可获得的事实 | 当前实现缺口 |
|---|---|---|
| Boss 箱 | DungeonBossChest 的副本、FightNo、CofferNo、物品、数量；可用副本+FightNo 关联 DungeonBoss，再查 BNpcName | 接口只返回副本和数量文本；没有加载 DungeonBoss，也未返回场次/箱号 |
| 道中/场景箱 | DungeonChestItem→DungeonChest：ChestId、ChestNo、地图、区域、原始位置、TreasureId、关联 Boss、产量范围和社区概率 | 服务关联时压成 CFC，响应丢失具体箱子与地点；没有可靠的道中/首领分类 |
| 副本道具兑换 | SpecialShop 报价可连接成本物品和产出；成本物品再反查副本掉落 | 成本输出为 Detail 文本，无结构化 AND 成本或递归上游；NPC 位置/条件仍不足 |
| 副本武器箱开武器 | ItemSupplement.SourceItemId→ItemId，箱子可继续反查副本表 | 武器查询只输出来源容器，不会串到箱子所属副本/首领；开箱职业条件未进入模型 |

另有 `DungeonBossDrop` 表示首领直接奖励/掉落；不能全改称 Boss 箱。`DungeonDrop` 本身只提供物品与副本关系，证据不足时必须保留“具体环节未知”。

## 为什么 dungeon_chest 不能直接标成道中箱

`DungeonChestItem` 是场景宝箱内容表，包含首领战后的箱子。日影兰武器箱 Item:35734 同时有：

- `DungeonBossChest:9014`：CFC 801、FightNo 0、CofferNo 2、Quantity 1；关联到赫斯珀洛斯（BNpcName:10742）。
- `DungeonChestItem:17320 → DungeonChest:1131`：同一副本，ChestNo 2、Map 731、Treasure 1442、位置 `101.97595;-0.015319824;89.98242`，而 DungeonBossId 是 **0**。

因此 `DungeonBossId=0` 也不能证明道中箱。两套记录可能描述同一个首领箱，不能简单计为两条独立掉落；当前也没有已验证的统一箱子身份映射。只有副本+物品相同不足以合并，因为同一物品可能来自多个不同箱子。箱号编号规则、地图坐标转换需另行验证。

## 日影兰战锤的三条路线已经能从数据串出

目标 Item:35247，所属副本为 CFC:801→InstanceContent:30108（零式万魔殿 边境之狱4）。

1. **直接装备**：DungeonBossChest:8994，FightNo 0、CofferNo 1、Quantity 1，关联赫斯珀洛斯→日影兰战锤。
2. **武器箱**：同一首领→日影兰武器箱 Item:35734→ItemSupplement（Source=3/Loot）→日影兰战锤。Item.Description 明确开出对应职业/特职武器，且有使用场景说明；不能将所有箱内武器视为同时获得或均匀随机。当前只验证了物品边及描述，尚未实现职业条件的结构化解析。
3. **断章兑换**：DungeonBossDrop:273 指向同一首领→第4页边境的断章 Item:35826（Quantity 1）→SpecialShop:1770443 的 Item[2]：8 个断章换 1 把战锤。该报价 UseCurrencyType=2、CostType=0；原始表与 Wiki 的兑换材料/数量一致。

Wiki 的目标物品 Data 同时列出了“副本”“物品箱”“特殊商店”，支持这三条并列路线。相同兑换还在 SpecialShop:1770797 的 Item[1]，该表 UseCurrencyType=16；初轮暂未解码，后续已确认必须按成本槽 CostType 解析（此处为 0/普通物品），详见本文末尾的增量记录。

兑换 NPC 与位置在 Wiki 快照中可见，例如拉札罕的尤尔；本地 NPC 菜单和坐标链本轮没有补完，不能混作本地已经恢复的事实。每周限制、箱子出现条件、个人获得规则和概率也尚未据此证明；不能把“8 个断章”直接转换成“刷 8 次必得”。

另一个普通零件兑换样本：戈耳狄透镜 Item:12674 在启动之章 1/2/3 的首领箱有关系，2 个透镜兑换戈耳狄原型强袭角盔 Item:11450。目标装备自身没有副本直掉记录，若只查目标物品的 dungeon 类别，就会漏掉它的副本获取路径。

## 现有抽样支持到哪一层

上轮四个副本子类型共 12 例：11 例副本集合一致，1 例（九宫幻卡：欧米茄）本地额外列出 InstanceContent:30071。首领直掉/首领箱的 6 例，在已映射实体范围内首领集合均一致。场景箱的 3 例并未单独证明都是道中箱；具体箱子、地图坐标和概率尚未完成 Wiki 等价检查。

下一步应让响应保留类型化实体和有方向的关系：直接掉落/首领箱/具体场景箱、消费材料 AND 兑换、职业条件开箱，并支持向上展开；把副本关联不足的情况标为未知。还需基于证据合并重复箱子记录，而不是用一个副本名称去重。

## 代码与证据

- [副本来源构建](../../src/McpLumina/Tools/SupplementalTools.cs)：266–296 行；开箱 254–262 行；兑换 342–348 行。
- [补充数据服务](../../src/McpLumina/Services/SupplementalDataService.cs)：58–63 行加载表；120–125 行丢失 Chest 细节；188–200 行提取兑换成本。
- [响应模型](../../src/McpLumina/Models/Responses/ItemSourcesResponse.cs)：37 行起为平铺来源，没有 boss/chest、结构化 costs、location 或 path。
- [新读 SpecialShop 原始行](../../tmp/item-source-probe/dungeon-followup-SpecialShop.json)
- [新读 Item 原始行与箱子说明](../../tmp/item-source-probe/dungeon-followup-Item.json)
- [容器与兑换材料的副本关系](../../tmp/item-source-probe/dungeon-followup-relations.json)
- [上轮逐例比较](../../tmp/item-source-probe/results.md)及 [Wiki 原始快照](../../tmp/item-source-probe/inputs/wiki-items.json)

## 获取链原型补充（2026-10-24）

按用户确认，已在临时 JavaScript 中实现上述多跳获取链，正式 MCP 接口保持原状。入口是 [acquisition-chains.mjs](../../tmp/item-source-probe/acquisition-chains.mjs)，使用说明和结论见 [获取链实验说明](../../tmp/item-source-probe/chains/README.md)。

实际展开 22 个目标，覆盖原随机样本中的副本、兑换和开箱类型，另加日影兰武器箱。已保留 AND 成本、OR 路线、兑换数量传播、原始 Boss/箱子证据，以及路径级循环和深度/节点/分支截断。未知货币、未支持的上游和潜在重复箱子均显式保留，未用缺字段构造完整路线。

[树形结果](../../tmp/item-source-probe/chains/results.md)已经展示：日影兰战锤的直掉/武器箱/8断章兑换三路；戈耳狄原型头盔经2透镜追到启动之章1/2/3；龙须拳·优雅的两种材料 AND 需求及各自上游。开箱上游只按一次尝试展开，副本不推算必需次数，完整 NPC/条件尚未验收。

新抓三个上游 Wiki Data 后做了 [12 项分段核验](../../tmp/item-source-probe/chains/verification.md)：11 项一致，1 项差异。差异为戈耳狄透镜在启动之章2缺少本地 Boss 关联，Wiki 列出七个敌人；三个副本集合本身一致。此结果是定向链核验，不追加到原120例随机统计，不代表完整 Wiki 页面等价。

## 货币与未闭合分支的后续结果

已继续补充 [特殊货币解析与获取链增量验证](currency-chain-extension.md)：龙须拳·优雅的基础武器现在可经 **600 诗学 → 三个已核验副本的奖励** 追到来源，与强化药的黄铜币场景箱路线一起满足 AND 输入的结构闭合。最终 Boss、道中 Boss、新手奖励分开；不把最终 Boss 奖励当整本总额，也不把新手奖励计入每次重复奖励。

22 个目标中已有21个存在来源证据路径，48项临时脚本测试通过。唯一整目标未闭合的是木工秘籍第十二卷的紫票获取明细，原因已定位到当前 MCP 子行读取异常。另有部分替代路线缺失，特别是两种异闻书籍的副本关系；这些缺口与旧基础武器的停产标记均保留，没有用 Wiki 反填数据。正式接口未改。

后续战斗装备范围、P0/P1/P2 缺口和四条副本路线的验收标准，统一见 [战斗装备来源缺口与验收优先级](combat-gear-acquisition-gaps.md)。
