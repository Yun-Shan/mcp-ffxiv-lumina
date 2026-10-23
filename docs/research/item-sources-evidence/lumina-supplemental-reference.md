# LuminaSupplemental 辅助参考核查

- 核查日期：2026-10-24（Asia/Shanghai）。
- 方法：GitHub 插件读取仓库、文件、提交比较；读取本机已安装 5.1.4 的 nuspec。未克隆、安装、执行依赖，未修改实现。
- 定位：补充游戏表中缺失的关系与少量统计，不能承诺完整复制 Wiki 的攻略、条件、版本状态和所有物品来源。

## 版本与固定证据

本机项目引用 `LuminaSupplemental.Excel 5.1.4`；本机 NuGet `luminasupplemental.excel.nuspec` 的 repository commit 为 `e9bf1495bf8588d2cf21441ef03f0d9dfe0f790a`。本次查询到默认分支最新提交为 [`2a04329e5fb3ca6f22bc8d1915fe0d1382d59519`](https://github.com/Critical-Impact/LuminaSupplemental/commit/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519)，其 [csproj](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/LuminaSupplemental.Excel.csproj) 标注 5.1.5；[CHANGELOG](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/CHANGELOG.md) 标注 2026-09-09 的 7.56 / general data update。这证明仓库源码版本，未另行验证 NuGet 当前最新发布版。

[5.1.4 → 上述提交比较](https://github.com/Critical-Impact/LuminaSupplemental/compare/e9bf1495bf8588d2cf21441ef03f0d9dfe0f790a...2a04329e5fb3ca6f22bc8d1915fe0d1382d59519) 返回 1 个提交、15 个变更路径。实际涉及 BNpcLink、DungeonChestItem、FieldOpCoffer、ItemPatch、ItemSupplement、MobDrop、MobSpawn、StoreItem、SubmarineDrop 等 CSV，以及子模块和版本文件；没有模型源文件变更。不能将新版 CSV 的记录数或概率用于声称当前 5.1.4 已具备同样数据。

仓库 [LICENSE](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/LICENSE) 是 GNU General Public License version 3 文本，csproj 以 PackageLicenseFile 引用它。这里只记录仓库声明，不据此推断外部社区、商城、游戏原始数据的独立授权范围。

## 实际可利用的数据

下表字段来自固定提交的模型源码；生成 CSV 位于 `src/LuminaSupplemental.Excel/Generated/`。模型及资源存在表示有可接入的数据结构，不保证每种物品都有记录或每条记录都完整。

| 范围 | 模型及字段 | 对当前项目的价值与边界 |
|---|---|---|
| NPC 补充位置 | [ENpcPlace](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/ENpcPlace.cs): ENpcResidentId, TerritoryTypeId, MapId, PlaceNameId, Position(Vector2) | 可在本地 NPC/地图连接后补位置；是额外位置，不能当全部 NPC 点位。需明确坐标制式。 |
| 怪物位置和实体对应 | [MobSpawnPosition](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/MobSpawnPosition.cs): BNpcBaseId, BNpcNameId, TerritoryTypeId, Position(Vector3), Subtype；[BNpcLink](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/BNpcLink.cs): BNpcNameId, BNpcBaseId | 将掉落怪物名称连接到实体和刷怪区域；保留多个位置，不把同名怪合成唯一地点。CSV 名称是 MobSpawn.csv，模型名是 MobSpawnPosition。 |
| 怪物掉落 | [MobDrop](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/MobDrop.cs): ItemId, BNpcNameId | 只有物品—怪物配对，无概率、数量、掉落条件。 |
| 副本首领 | [DungeonBoss](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/DungeonBoss.cs): RowId, BNpcNameId, ContentFinderConditionId, FightNo | 现有项目可补“第几场战斗、哪名首领”。 |
| 首领掉落和宝箱 | [DungeonBossDrop](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/DungeonBossDrop.cs): RowId, ContentFinderConditionId, FightNo, ItemId, Quantity；[DungeonBossChest](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/DungeonBossChest.cs) 另有 CofferNo | 保留战斗和箱子序号，不只返回副本名；这里没有概率字段。 |
| 地图宝箱 | [DungeonChest](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/DungeonChest.cs): RowId, ChestNo, ContentFinderConditionId, MapId, TerritoryTypeId, TreasureId, DungeonBossId, Position(Vector3)；[DungeonChestItem](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/DungeonChestItem.cs): RowId, ItemId, ChestId, Min?, Max?, Probability? | 可实现物品 → 具体箱子 → 地图/副本/首领；保留可空统计，不把缺失当 0。 |
| 转化/开箱 | [ItemSupplement](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/ItemSupplement.cs): ItemId, SourceItemId, ItemSupplementSource, Min?, Max?, Probability? | 适合有向转化边和按需上游展开；不自动给出解锁、职业、地图与完整攻略。 |
| 特殊区域箱子 | [FieldOpCoffer](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/FieldOpCoffer.cs): ItemId, Type, CofferType, Min?, Max?, Probability? | 可以细化特殊区域与宝箱类型；仍需解释打开/获取条件。 |
| 种植杂交 | [GardeningCrossbreed](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/GardeningCrossbreed.cs): ItemResultId, ItemRequirement1Id, ItemRequirement2Id | 能保留两个输入的组合关系；无土壤、摆法或成功率字段。 |
| 潜艇 | [SubmarineDrop](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/SubmarineDrop.cs): ItemId, SubmarineExplorationId, LootTier, NormalMin/Max, PoorMin/Max, OptimalMin/Max；[SubmarineUnlock](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/SubmarineUnlock.cs): SubmarineExplorationId, SubmarineExplorationUnlockId, RankRequired | 当前实现只用物品/航区，实际上可以保留战利品档位和不同品质航行的数量范围。无直接概率或全部能力阈值；解锁方向要结合模型生成逻辑验证，不能仅按字段名猜箭头。 |
| 飞空艇 | [AirshipDrop](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/AirshipDrop.cs): ItemId, AirshipExplorationPointId；资源目录含 AirshipUnlock | 可补航线解锁关系；Drop 本身只有配对，无概率/数量。 |
| FATE | [FateItem](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/FateItem.cs): ItemId, FateId | 没有贡献等级、奖励数量、触发条件和概率。应与本地 Fate 表及外部说明合并。 |
| 雇员探索 | [RetainerVentureItem](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/RetainerVentureItem.cs): ItemId, RetainerTaskRandomId | 补随机/探索掉落列表；任务名称、等级和装备条件仍需本地 RetainerTask 体系。 |
| 任务需求 | [QuestRequiredItem](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/QuestRequiredItem.cs): ItemId, QuestId, Quantity, IsHq | 这是交付/消费关系，不是任务奖励来源。 |
| 商城 | [StoreItem](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/StoreItem.cs): ItemId, FittingShopItemSetId, PriceCentsUSD, StoreId | 提供商城入口线索；USD 字段不能代表国服售价或实时优惠，套装商品也不能直接当单件价格。 |
| 不可获取提示 | [UnobtainableItem](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Model/UnobtainableItem.cs): ItemId | 单独一列不足以表达服务器地区、失效日期、历史来源或重新开放条件，不宜覆盖为绝对“当前不可获取”。 |

此外 [CsvLoader](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.Excel/Services/CsvLoader.cs) 枚举 ENpcShop、ShopName、HouseVendor、ItemPatch、FestivalName、RelicWeapon、RelicTool 等资源。它们可用于补充商店映射、去重、版本/类别线索；本次没有逐条验证这些附属 CSV 的所有记录。

## 数据来源与概率边界

[README](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/README.md) 将来源区分为 Manual、游戏数据、Gubal/Teamcraft Allagan Reports、Tracky/FFXIVGachaSpreadsheet、Lodestone、Square Enix Store、xivapi datamining-patches。具体而言，怪物配对来自 Lodestone + Gubal，怪物点位来自 Tracky + Manual，NPC 额外位置来自 Manual，副本箱和潜艇主要来自 Tracky，任务需求是从游戏 LUA 提取后维护。

[ItemSupplementStep.Tracky.cs](https://github.com/Critical-Impact/LuminaSupplemental/blob/2a04329e5fb3ca6f22bc8d1915fe0d1382d59519/src/LuminaSupplemental.SpaghettiGenerator/Steps/ItemSupplementStep.Tracky.cs) 明确把上游 Pct × 100 并四舍五入为两位小数后存入 Probability。可据此确认该路径的百分比单位，但不能把社区统计变成官方保底概率；模型未保留样本量、观察时间和每条记录的来源字段。其他生成路径仍需各自验证。

建议导入时额外保存 provider、packageVersion、upstreamCommit、resource、记录键、导入时间和数据状态；不同版本及不同提供者发生冲突时保留证据，不静默覆盖。

## 无法靠此库达到 Wiki 全量的部分

- 本次检查的 README 和 CsvLoader 资源清单没有完整的钓鱼鱼饵、泳饵、天气链、时间窗口、鱼识条件数据集；不能因有 ItemSupplement 就承诺所有鱼类获取条件。
- 任务专用补充表是 QuestRequiredItem，不能代替 Quest 奖励和解锁建模；制作、采集、理符等奖励仍以游戏表关系为主。
- 模型通常不具备全套前置任务、地区服差异、活动开放时间、商城当前状态、限制解除规则和自然语言攻略。
- 来源缺失不等于不可获取；社区记录不是全量服务器事实。应明确“已知来源”“已验证字段”“待补详情”和 provider coverage。
- 推荐质量目标是可靠且可追溯的主要获取方式，并能继续展开 NPC/地点/代价/上游关系；Wiki 用于抽样校验与补充，不以逐页完全一致为验收要求。
