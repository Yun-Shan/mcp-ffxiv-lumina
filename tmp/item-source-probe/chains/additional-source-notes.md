# 新增来源提供者：制作、采集、雇员、任务与怪物掉落

2026-10-24。本文件记录本轮临时原型的本地证据；没有用 Wiki 的答案补写关系，也没有修改正式接口。实现为 [`chain-additional.mjs`](../chain-additional.mjs)，验证为 [`chain-additional.test.mjs`](../chain-additional.test.mjs)。

## 两个未闭合目标的补链结果

**金属靛染剂 Item:13722**：已有 ItemSupplement 开箱关系指向雇员的宝箱 Item:32161；新增 RetainerVentureItem → RetainerTaskRandom:30053 → 外层 RetainerTask:395，得到自由探索委托。外层任务表明确保留 `VentureCost=2`、`MaxTimemin=60`。这是随机产物集合中的成员，不意味着每次委托必得宝箱或能保证开出染剂。任务表里的等级 0 等零值未解释为无门槛。

**赛加羚羊革魔导典 Item:34391** 同时补出两条关系：

- Quest:69935「过去的记录」固定奖励弗里金武器箱 Item:35686 ×1；现有开箱关系指向魔导典。任务 `IsRepeatable=false`，不能按请求数量重复刷取；开箱职业等条件仍单独保留。
- Recipe:4889 制作魔导典 ×1，消耗辉翠银附魔墨水 Item:36237 ×2、赛加羚羊革 Item:36249 ×2、紫黄晶 Item:36182 ×1、雪亚麻布 Item:36210 ×1、水之水晶 Item:13 ×8、雷之水晶 Item:12 ×7。四种中间产物再经 Recipe:5333、5320、5311、5325 展开；绿片岩磨刀石 Item:36188 再经 Recipe:5316 展开。全部正数材料槽都有已支持的采集、雇员或怪物来源。

新读完整配方是必要的：旧的 Recipe 索引仅保存槽 0、1、6、7；Recipe:4889 的槽 2、3 和 Recipe:5333 的槽 2 都是真实材料。忽略这些槽会漏掉紫黄晶、雪亚麻布和地下天然水。本原型发现任何一个材料槽或数量字段未读取时，状态为 `missing_recipe_fields`，不会继续把不完整配方当成可闭合路径。

若上述中间产物全部自行制作，一本魔导典所需原始材料为：

| 物品 | 数量 |
|---|---:|
| 辉翠银沙 36162 | 8 |
| 卡部斯的肉 27799 | 2 |
| 地下天然水 27782 | 2 |
| 赛加羚羊的粗皮 36244 | 8 |
| 艾布拉纳明矾 36241 | 2 |
| 紫黄晶原石 36174 | 3 |
| 绿片岩 36180 | 4 |
| 雪亚麻 36204 | 5 |
| 水之水晶 13 | 24 |
| 土之水晶 11 | 16 |
| 风之水晶 10 | 16 |
| 雷之水晶 12 | 15 |

这是给定配方、每次成功制作的数量账，不代表制作成功率、HQ 概率、最优采购路线或保证采集/狩猎次数。每条配方仍保留职业、等级表、作业/加工要求、秘籍与其他条件引用。

## 提供者接口及叶子含义

`buildAdditionalIndex({tables,supplemental})` 返回 `Map<ItemId, Edge[]>`。制作边 `kind=recipe`、`terminalEvidence=false`，要求所有材料 AND，使用 `quantityPerBatch` 和 `output.quantity` 供主图传播批次数。`CanHq` 仅为支持 HQ，实际 `output.hq=null`；不能把“可制作 HQ”改写为“保证 HQ”。

采集叶必须具有 `GatheringItem → GatheringPointBase.Item[n] → GatheringPoint` 的真实连接。产物编号和 GatheringItem 行号是不同命名空间，例如水之水晶 Item:13 对应 GatheringItem:12，不能直接按物品编号寻找采集点。保留点位、地域和原始 transient 条件，但不证明天气、时间、收藏价值或产量已满足。

普通雇员保留五个数量档、日志要求及外层任务条件；随机雇员只表示产物池成员。任务保留固定/自选奖励区分，选择奖励是 OR。怪物掉落使用 Supplemental 的 `BNpcNameId` 身份，不能误当 BNpcBase 编号，位置由独立 MobSpawn 记录关联。

这些机制可以作为**来源证据叶**，不是玩家已满足所有行动条件的证明。雇员探险币消耗是行动条件成本，本提供者不再穷举该币的获取方式；任务前置也不扩成物品成本图。副本、采集、制作的全部使用资格并未统一求解。

## 新证据与验证

通过已配置 Lumina MCP 直接读表新增 `chains/inputs/Recipe-additional.json`、`Recipe-additional2.json`、`RetainerTaskRandom-additional.json`、`Quest-additional.json`、`GatheringItem-additional.json`、`Item-additional.json`。其他 joins 复用之前的原始表快照与固定 Supplemental 5.1.4。

独立测试 8 项通过，覆盖真实六材料配方、全部材料来源路径、缺槽停止、重复材料累加、产量为零拒绝、雇员内外编号连接、一次性任务和可选奖励/HQ、采集点必须真实关联。运行：

```powershell
node --test tmp/item-source-probe/chain-additional.test.mjs
```
