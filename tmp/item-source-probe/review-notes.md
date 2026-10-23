# 抽样比较的独立审查规则

本文件是临时 JS 探针的审查辅助；不代表所列类别已经完成数据验证。

## 抽样与统计

- 每类候选按去重后的 Item ID 稳定排序，使用固定 seed 抽取 3 个；保存 seed、候选总数、样本 ID、原始记录引用。
- 必须先抽样再查询 Wiki；Wiki 缺页、错误或结构未知的样本仍保留，不用成功样本替换。
- 一物多类可在各类别分别检查，同时报告去重后的物品总数。结论的分母必须清楚区分“类别样本对”和“物品”。
- 随机 3 例只能展示可行性和发现缺口；不能据此宣称整类或全物品达到 Wiki 完整度。
- 若使用 Supplement CSV，固定提交并报告其是否等同本项目当前依赖版本，不混用新版本能力作为当前实现证据。

## 结论分层

逐例保留 `categoryPresent`、`entityMatch`、`termsMatch`、`conditionsMatch`、`presentationComplete` 等独立状态。未读到的字段写 `unverified`；不要把“没有发现冲突”当作一致。

1. **本类别核心字段一致**：经过声明的实体与主要数值逐字段核对，原始证据可追溯；不自动代表所有显示字段已完成。
2. **部分一致**：存在确定一致的关系，但其他实体、数量、条件或地点未恢复。
3. **冲突**：同语义、同实体、同版本适用范围的字段实测不一致。版本或命名空间未确认时先归为无法比较。
4. **无法比较**：Wiki 缺页、请求失败、来源结构/货币编码未知、只有计数摘要，或两端 ID 命名空间未映射。

比较集合应报告交集、仅本地、仅 Wiki；一个 `.some()` 命中不能证明完整集合一致。另行记录 Wiki 其余来源类别，本类别通过不意味着整个物品的来源齐全。

## 各类需要核对的字段

| 类别 | 核心核对项 | 防止误判 |
|---|---|---|
| 制作 | Recipe 产出 Item、CraftType、RecipeLevelTable.ClassJobLevel、产量、全部材料和碎晶、秘籍条件 | Wiki Data 若只有职业/等级/星级，仅能验证摘要；不能宣称材料已比对。RecipeLevelTable ID 不等于等级。 |
| 采集 | GatheringItem→GatheringPointBase→GatheringPoint、职业、物品等级、点等级、区域、时间/任务/隐藏条件 | Base.Item[] 是 GatheringItem ID；一个 Base 的多个物理点不应当作不同来源；坐标须先明确坐标制式。 |
| 捕鱼 | Item→FishParameter 和 FishingSpot.Item[] 反查的钓场完整集合、等级 | 主 FishingSpot 不是全部钓场；鱼饵/天气/时间未解码不能称为完整路线。 |
| 刺鱼 | Item→SpearfishingItem→Notebook/区域/等级、鱼群条件 | Notebook/GatheringPointBase/PlaceName/Map 必须带类型，不能用裸 ID 交集代替映射。 |
| 普通雇员 | Item→RetainerTaskNormal→RetainerTask、职业、等级、费用、时长、数量档位、属性门槛 | Normal row ID 不等于 Task row ID；数量数组不是同时得到的多份奖励。 |
| 随机雇员 | CSV RetainerTaskRandom→RetainerTask、探索类别/等级、产出随机性 | Random row ID 不等于 Task row ID；产出池关系不保证获得。 |
| 任务 | Quest ID、固定/择一/职业奖励、数量/HQ、等级与重复性 | RequiredItem 是消耗，不是来源；一个对象不应因非数组而丢掉。 |
| 理符 | Leve→RewardItem→Group、组概率、物品数量/HQ | Wiki 来源的数字可能仅为计数，不能当 Leve ID；组概率不是物品独立概率。 |
| 成就 | Achievement ID、Item、目标条件、领取步骤 | 有 Item 关系不代表自动发至背包。 |
| 金币商店 | GilShop/Subrow、Item、价格/HQ、NPC、任务/成就/状态条件 | Item.PriceMid 不是有商店的证据，也未必是所有报价最终价。 |
| 特殊兑换 | Shop+offerIndex+outputIndex、全部输出数量/HQ、完整 AND 成本、表级和行级条件、NPC 菜单与地点 | Wiki index 常为 1 基；先解 UseCurrencyType/CostType。未知货币编码不能按 Item ID 查名；多成本不能拆成多条 OR 路线。 |
| 军票商店 | GCScripShopItem、阵营/军衔、军票数量、NPC | GrandCompany、军衔和货币 Item 分别是不同命名空间。 |
| 怪物掉落 | Item↔BNpcName、BNpcLink/BNpcBase、区域/位置集合 | 同名怪可有多个实体；CSV 无数量/概率时保持未知。 |
| 副本/首领/宝箱 | ContentFinderCondition、InstanceContent 经明确映射、FightNo、CofferNo/Chest、数量/范围 | 两端副本 ID 可能命名空间不同；只对上副本不能证明首领/宝箱一致。 |
| FATE | Fate ID、区域、等级、前置链/任务、奖励条件/数量 | CSV 仅配对时不能补贡献等级或保证数量。 |
| 飞空艇/潜艇 | 对应 Exploration ID、航区、等级、解锁、LootTier、各品质数量范围 | 飞空艇和潜艇 ID 分域；范围缺失不等于 0；能力门槛未证实不能推断。 |
| 开箱/分解/精选 | 目标 Item、输入 SourceItem、动作枚举、数量范围、概率对象 | Item 与 SourceItem 的方向不能颠倒；动作枚举先查定义，不能按名字模糊匹配。 |
| 种植/杂交 | Result Item、双输入种子组合、动作 | 输入组合为 AND；CSV 未包含土壤/摆放/成功率即表示未验证。 |
| 商城/活动 | 商品或活动身份、地区服、时间、单件/套装关系 | 国际商城 USD 价格不能与国服价格直接对比；当前可售需单独证据。 |
| 其他说明 | Wiki 原始叙述、模板解析状态、可验证的 typed refs | 不把“持有或装备”变成“消耗”；不能为了统一结构编造缺失事实。 |

## 实现审查检查点

- `0`、`null`、缺字段和空数组分别处理；禁止 `value || default` 吃掉合法的零值。
- 读取 Wiki revisions 后验证返回标题和 JSON 内 Item ID；按 ID 对齐，不能依赖批量响应顺序。
- 记录 `revid`、修订时间、抓取时间和错误；缺页/错误不能变成“Wiki 无来源”。
- 比较 `来源`，不能把 `用途` 合入来源。
- 原始来源值可能是对象、数组、数字或文本；未知形状要保留，不可静默过滤。
- 证据截断、分页未完成、接口字段不全应成为 coverage 状态，不应以不完整读取推导另一端漏项。
- 语言字段只用于显示与辅助核对，关系首先依赖明确类型的数字 ID；不能根据现有语言查询结果判断底层关系质量。
- 本地表和 Wiki 的版本不同，差集先解释为“当前两个证据集的差异”；没有版本分析不能直接宣布任何一方错误。

## 脚本审查状态

2026-10-24 已完成实现与结果审查。120 例保留原始抽样，118 个 Wiki Item Data 均读取成功。

- 基础比较 27 例运行完成；制作各 14 项、普通雇员各 7 项核验一致；理符仍只比较计数。
- 故障注入 4 项通过：改变制作材料数量、Quest ID、雇员外层任务 ID 会产生差异；未知货币 mode16 保持未验证。
- Supplemental 93 例运行完成；鉴定、物品箱、副本合并同范围后比较双向差集，14 例差异未发现由字段形状或命名空间误读造成。
- 修正 3 个重建检验样本：尚无 Wiki 映射，判无法比较；不因空映射表断言 Wiki 类别缺失。
- 修正副本名称核验：只比较共有 ID 的名字，额外副本仍单独保留实体差异。
- 6 个 JS 模块语法检查通过；manifest 哈希、样本数量/唯一性、seed 随机键、Wiki 标题/ID/修订及最终统计的完整性检查通过。
- 最终分类：83 部分对齐、14 集合差异、15 Item Data 未列机制、8 无法比较。未做完整页面等价验收。
