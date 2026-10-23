# 随机抽样来源对照结果

固定 seed：`2026-10-24-lumina-wiki-01`；每类 3 个有名物品；120 个类别样本，118 个去重物品。先抽样后查 Wiki，失败不换样。

这是临时 JS 原型基于本地表与固定补充数据拼接的结果，不代表现有 get_item_sources 的行为。已比字段一致也不等于完整复刻 Wiki。

判定总计：部分对齐 83 例；Wiki Data 未列该机制 15 例；存在差异 14 例；无法比较 8 例。没有给任何样本做完整页面等价验收，也没有把抽样比例当成全量准确率。

“Wiki Data 未列该机制”仅描述已读取的 Item Data 页；不等于 Wiki 展开页面一定没有、游戏中不能获取，或本地关系一定正确。尚无映射的类型单列“无法比较”。

本轮未抽样：`gil_vendor`（GilShopItem generic MCP returned Item=0 in every row; subrow decoding unsupported/unreliable, no valid independent sampling pool.）；`wiki_manual_only`（No independent local source pool; not sampled from expected Wiki answers.）；`supplement_unknown`（ItemSupplementSource=999; SourceItemId is consumed/opened/converted to output ItemId. Min/Max/Probability preserved as nullable; no complete route/unlock proof.）。军票/其他专用交易表及手工活动、寻宝等也未建立独立候选池，因此 40 个子类型不代表全部来源机制。

| 类型 | 样本数 | 已比字段一致 | 部分对齐 | 差异 | 类别缺失 | 无法比较/读取 |
|---|---:|---:|---:|---:|---:|---:|
| achievement | 3 | 0 | 3 | 0 | 0 | 0 |
| airship | 3 | 0 | 2 | 0 | 1 | 0 |
| anemos | 3 | 0 | 2 | 1 | 0 | 0 |
| auxesia | 3 | 0 | 3 | 0 | 0 | 0 |
| bozja | 3 | 0 | 3 | 0 | 0 | 0 |
| card_pack | 3 | 0 | 3 | 0 | 0 | 0 |
| coffer | 3 | 0 | 1 | 2 | 0 | 0 |
| desynth | 3 | 0 | 0 | 0 | 3 | 0 |
| dungeon_boss | 3 | 0 | 2 | 1 | 0 | 0 |
| dungeon_boss_chest | 3 | 0 | 3 | 0 | 0 | 0 |
| dungeon_chest | 3 | 0 | 3 | 0 | 0 | 0 |
| dungeon_drop | 3 | 0 | 3 | 0 | 0 | 0 |
| eureka_orthos | 3 | 0 | 3 | 0 | 0 | 0 |
| fate | 3 | 0 | 0 | 2 | 1 | 0 |
| fieldop_coffer | 3 | 0 | 0 | 0 | 0 | 3 |
| fishing | 3 | 0 | 3 | 0 | 0 | 0 |
| gardening | 3 | 0 | 2 | 0 | 1 | 0 |
| gardening_crossbreed | 3 | 0 | 1 | 2 | 0 | 0 |
| gathering | 3 | 0 | 3 | 0 | 0 | 0 |
| heaven_on_high | 3 | 0 | 3 | 0 | 0 | 0 |
| hydatos | 3 | 0 | 1 | 2 | 0 | 0 |
| leve | 3 | 0 | 3 | 0 | 0 | 0 |
| logogram | 3 | 0 | 3 | 0 | 0 | 0 |
| loot | 3 | 0 | 3 | 0 | 0 | 0 |
| mob_drop | 3 | 0 | 2 | 0 | 1 | 0 |
| oizys | 3 | 0 | 3 | 0 | 0 | 0 |
| pagos | 3 | 0 | 2 | 1 | 0 | 0 |
| palace_of_the_dead | 3 | 0 | 1 | 2 | 0 | 0 |
| pilgrims_traverse | 3 | 0 | 3 | 0 | 0 | 0 |
| pyros | 3 | 0 | 2 | 1 | 0 | 0 |
| quest | 3 | 0 | 3 | 0 | 0 | 0 |
| recipe | 3 | 0 | 3 | 0 | 0 | 0 |
| reduction | 3 | 0 | 2 | 0 | 1 | 0 |
| retainer_normal | 3 | 0 | 3 | 0 | 0 | 0 |
| retainer_random | 3 | 0 | 0 | 0 | 3 | 0 |
| skybuilder_handin | 3 | 0 | 0 | 0 | 0 | 3 |
| spearfishing | 3 | 0 | 3 | 0 | 0 | 0 |
| special_vendor | 3 | 0 | 3 | 0 | 0 | 0 |
| store | 3 | 0 | 0 | 0 | 1 | 2 |
| submarine | 3 | 0 | 0 | 0 | 3 | 0 |

## achievement — 九宫幻卡：斯考尔·莱昂哈特 (9846)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/9846.json)，revision 2186942。

实体集合：match；本地独有 []；Wiki独有 []。

- Achievement:1104/奖励物品ID：match
- Achievement:1104/名称：match；语言字段仅作独立展示核对，不用于构建关系。
- Achievement:1104/目标描述：match
- Achievement:1104/成就点数：match
- 成就目标及领取规则：unverified

尚缺/未核验：成就目标规则与领取步骤。

## achievement — 流光平底锅 (2505)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/2505.json)，revision 2293908。

实体集合：match；本地独有 []；Wiki独有 []。

- Achievement:184/奖励物品ID：match
- Achievement:184/名称：match；语言字段仅作独立展示核对，不用于构建关系。
- Achievement:184/目标描述：match
- Achievement:184/成就点数：match
- 成就目标及领取规则：unverified

尚缺/未核验：成就目标规则与领取步骤。

## achievement — 赐福园野手斧 (16967)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/16967.json)，revision 2294902。

实体集合：match；本地独有 []；Wiki独有 []。

- Achievement:1730/奖励物品ID：match
- Achievement:1730/名称：match；语言字段仅作独立展示核对，不用于构建关系。
- Achievement:1730/目标描述：match
- Achievement:1730/成就点数：match
- 成就目标及领取规则：unverified

尚缺/未核验：成就目标规则与领取步骤。

## airship — 浮岛陶石 (13751)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/13751.json)，revision 2190773。

实体集合：match；本地独有 []；Wiki独有 []。

- 航区名称及奖励明细：unverified

尚缺/未核验：飞空艇航区命名/解锁/等级与物品数量概率。

## airship — 古代野兽的化石片 (14934)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/14934.json)，revision 2191837。

实体集合：match；本地独有 []；Wiki独有 []。

- 航区名称及奖励明细：unverified

尚缺/未核验：飞空艇航区命名/解锁/等级与物品数量概率。

## airship — 神眼魔晶石叁型 (5666)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5666.json)，revision 2182887。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 航区名称及奖励明细：unverified

尚缺/未核验：飞空艇航区命名/解锁/等级与物品数量概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## anemos — 常风皮盔帽 (22514)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/22514.json)，revision 2369027。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## anemos — 神眼魔晶石伍型 (5668)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5668.json)，revision 2182890。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## anemos — 刚柔魔晶石陆型 (18021)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/18021.json)，revision 2194865。

实体集合：mismatch；本地独有 ["Item:23224"]；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## auxesia — 沉稳方格阳伞 (31324)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/31324.json)，revision 2331107。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## auxesia — 迷你奇美拉 (20539)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/20539.json)，revision 2330564。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## auxesia — 龙之孙 (20528)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/20528.json)，revision 2330562。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## bozja — 红色大丽花头花 (23098)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/23098.json)，revision 2369096。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## bozja — 俾斯麦装甲 (12082)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/12082.json)，revision 2343336。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## bozja — 邪龙怨影魔导典 (24331)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/24331.json)，revision 2201075。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## card_pack — 九宫幻卡：晴天霹雳托佐尔·法托特尔 (16765)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/16765.json)，revision 2193616。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## card_pack — 九宫幻卡：提达 (9848)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/9848.json)，revision 2186944。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## card_pack — 九宫幻卡：魔导炮艇 (16775)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/16775.json)，revision 2193627。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## coffer — 小熊猫 (12056)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/12056.json)，revision 2236898。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## coffer — 食果花鼠 (8202)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/8202.json)，revision 2253979。

实体集合：mismatch；本地独有 []；Wiki独有 ["Item:33441"]。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## coffer — 金属靛染剂 (13722)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/13722.json)，revision 2254004。

实体集合：mismatch；本地独有 []；Wiki独有 ["Item:33441"]。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## desynth — 古代银币 (27994)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/27994.json)，revision 2240081。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## desynth — 潜能量碎晶 (36262)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36262.json)，revision 2212483。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## desynth — 第三期重建用的特供藤条（检） (31266)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/31266.json)，revision 2207643。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## dungeon_boss — 九宫幻卡：欧米茄 (23916)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/23916.json)，revision 2200661。

实体集合：mismatch；本地独有 ["InstanceContent:30071"]；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：match；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_boss — 九宫幻卡：青龙 (24874)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/24874.json)，revision 2201614。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：match；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_boss — 第4页戈耳狄断章 (12684)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/12684.json)，revision 2189756。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：match；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_boss_chest — 虚月游击上装 (40786)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/40786.json)，revision 2242239。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：match；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_boss_chest — 日影兰战锤 (35247)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/35247.json)，revision 2211515。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：match；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_boss_chest — 无瑕精准手镯 (27626)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/27626.json)，revision 2204083。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：match；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_chest — 海鹦 (40369)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/40369.json)，revision 2216484。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：unverified；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_chest — 龙堡强袭护手 (14664)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/14664.json)，revision 2367777。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：unverified；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_chest — 拿巴示艾兰精准缠手带 (26226)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/26226.json)，revision 2239872。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：unverified；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_drop — 管弦乐琴乐谱：冬贝利之泪 (31672)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/31672.json)，revision 2208048。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：unverified；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_drop — 陈旧的乐谱：末路尽头 (31687)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/31687.json)，revision 2208063。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：unverified；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## dungeon_drop — 管弦乐琴乐谱：凯宁／最终幻想主题曲版 (33844)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/33844.json)，revision 2210171。

实体集合：match；本地独有 []；Wiki独有 []。

- 共有副本的名称：match；只对共有 InstanceContent ID 核对名称；缺失副本由实体差集报告，不重复判为名称差异。
- 明确首领掉落/首领宝箱的首领实体：unverified；只使用 DungeonBossDrop/DungeonBossChest 的明确战斗关联；DungeonChest 的附近首领关联不自动等同首领掉落。
- 抽中子类型的数量/宝箱/坐标/概率：unverified；Wiki 的宝箱序号与 Supplemental ChestNo/CofferNo 起点和范围未证实；世界坐标也不能直接与地图坐标相等。

尚缺/未核验：具体箱子身份、地图坐标转换、数量与概率逐项对照。

## eureka_orthos — 河马幼崽 (35979)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/35979.json)，revision 2212201。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## eureka_orthos — 风尚礼帽 (23373)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/23373.json)，revision 2369127。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## eureka_orthos — 无瑕灵君装甲 (27987)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/27987.json)，revision 2343370。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## fate — 战果记录：慈悲为怀布拉兹 (30347)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/30347.json)，revision 2318646。

实体集合：mismatch；本地独有 []；Wiki独有 ["Fate:1607","Fate:1610","Fate:1612"]。

- 贡献等级与奖励数量：unverified；FateItem CSV 没有贡献档位或奖励数量；Wiki 该类含这些字段。

尚缺/未核验：FATE 贡献等级、数量、稀有奖励和触发条件。

## fate — 战果记录：魔导技师长西西尼乌斯 (30353)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/30353.json)，revision 2337579。

实体集合：mismatch；本地独有 ["Fate:1612"]；Wiki独有 ["Fate:1620","Fate:1628"]。

- 贡献等级与奖励数量：unverified；FateItem CSV 没有贡献档位或奖励数量；Wiki 该类含这些字段。

尚缺/未核验：FATE 贡献等级、数量、稀有奖励和触发条件。

## fate — 白泽的火之眼 (23214)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/23214.json)，revision 2199961。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 贡献等级与奖励数量：unverified；FateItem CSV 没有贡献档位或奖励数量；Wiki 该类含这些字段。

尚缺/未核验：FATE 贡献等级、数量、稀有奖励和触发条件。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## fieldop_coffer — 面部配饰：渐变色镜框眼镜 (48156)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/48156.json)，revision 2361044。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 特殊场景箱子与数量概率：unverified

尚缺/未核验：特殊场景枚举和箱子等级映射；数量/概率及开箱条件。

## fieldop_coffer — 发型样式：蘑菇头 (47987)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/47987.json)，revision 2223867。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 特殊场景箱子与数量概率：unverified

尚缺/未核验：特殊场景枚举和箱子等级映射；数量/概率及开箱条件。

## fieldop_coffer — 战技魔晶石拾壹型 (41768)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/41768.json)，revision 2376646。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 特殊场景箱子与数量概率：unverified

尚缺/未核验：特殊场景枚举和箱子等级映射；数量/概率及开箱条件。

## fishing — 冠骨鱼 (28069)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/28069.json)，revision 2204523。

实体集合：match；本地独有 []；Wiki独有 []。

- 钓场细节：unverified；Item Data 只给钓场 ID，未比较关联钓场页面。

尚缺/未核验：钓场地点和等级、鱼饵/天气/时间条件。

## fishing — 月水晶刺鱼 (45755)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/45755.json)，revision 2221689。

实体集合：match；本地独有 []；Wiki独有 []。

- 钓场细节：unverified；Item Data 只给钓场 ID，未比较关联钓场页面。

尚缺/未核验：钓场地点和等级、鱼饵/天气/时间条件。

## fishing — 半饱鳟 (43687)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/43687.json)，revision 2219705。

实体集合：match；本地独有 []；Wiki独有 []。

- 钓场细节：unverified；Item Data 只给钓场 ID，未比较关联钓场页面。

尚缺/未核验：钓场地点和等级、鱼饵/天气/时间条件。

## gardening — 库尔札斯茶叶 (12882)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/12882.json)，revision 2189940。

实体集合：match；本地独有 []；Wiki独有 []。

- 本物品是否为栽培产物：match；花卉颜色分支使用作物ID列表，不把基础作物ID误当唯一输出。
- 栽培产量/生长时间/颜色条件：unverified

尚缺/未核验：土壤对应产量、成长时间及颜色培养条件。

## gardening — 海岛红菜 (39900)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/39900.json)，revision 2216015。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 本物品是否为栽培产物：unverified；花卉颜色分支使用作物ID列表，不把基础作物ID误当唯一输出。
- 栽培产量/生长时间/颜色条件：unverified

尚缺/未核验：土壤对应产量、成长时间及颜色培养条件。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## gardening — 橙色蝴蝶兰 (33311)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/33311.json)，revision 2209655。

实体集合：match；本地独有 []；Wiki独有 []。

- 本物品是否为栽培产物：match；花卉颜色分支使用作物ID列表，不把基础作物ID误当唯一输出。
- 栽培产量/生长时间/颜色条件：unverified

尚缺/未核验：土壤对应产量、成长时间及颜色培养条件。

## gardening_crossbreed — 白云花种子 (20792)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/20792.json)，revision 2197571。

实体集合：match；本地独有 []；Wiki独有 []。

- 杂交方向/效率与生长时间：unverified

尚缺/未核验：杂交方向、效率、土壤、成长时间和作物/种子产量。

## gardening_crossbreed — 伞叶无花果种子 (7754)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/7754.json)，revision 2184949。

实体集合：mismatch；本地独有 []；Wiki独有 [{"inputItems":["Item:7732","Item:7734"],"outputItem":"Item:7754"},{"inputItems":["Item:7734","Item:7754"],"outputItem":"Item:7754"}]。

- 杂交方向/效率与生长时间：unverified

尚缺/未核验：杂交方向、效率、土壤、成长时间和作物/种子产量。

## gardening_crossbreed — 皇家可可豆种子 (7750)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/7750.json)，revision 2184944。

实体集合：mismatch；本地独有 []；Wiki独有 [{"inputItems":["Item:7723","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7724","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7730","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7731","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7732","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7733","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7743","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7744","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7745","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7746","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7747","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7748","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7749","Item:7750"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:13755"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:13766"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:13767"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:13768"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:20792"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:20794"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:7752"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:7753"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:7755"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:7757"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:8167"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:8184"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:8185"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:8186"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:8187"],"outputItem":"Item:7750"},{"inputItems":["Item:7750","Item:8188"],"outputItem":"Item:7750"}]。

- 杂交方向/效率与生长时间：unverified

尚缺/未核验：杂交方向、效率、土壤、成长时间和作物/种子产量。

## gathering — 改良用的乳胶 (29669)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/29669.json)，revision 2206052。

实体集合：match；本地独有 []；Wiki独有 []。

- 采集物品等级/星级：match；按 GatheringItemLevelConvertTable 转换；只比等级集合，未以摘要数目推定职业集合。
- 采集等级/职业摘要及点位：unverified；原始等级引用与地图点位须经过对应表解码；未以相同裸数字推定语义。

尚缺/未核验：采集职业、物品等级、地图坐标和限时/隐藏条件逐项验证。

## gathering — 黄昏苔藓 (17559)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/17559.json)，revision 2194408。

实体集合：match；本地独有 []；Wiki独有 []。

- 采集物品等级/星级：match；按 GatheringItemLevelConvertTable 转换；只比等级集合，未以摘要数目推定职业集合。
- 采集等级/职业摘要及点位：unverified；原始等级引用与地图点位须经过对应表解码；未以相同裸数字推定语义。

尚缺/未核验：采集职业、物品等级、地图坐标和限时/隐藏条件逐项验证。

## gathering — 魅惑猫咪必需品的素材 (41069)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/41069.json)，revision 2217150。

实体集合：match；本地独有 []；Wiki独有 []。

- 采集物品等级/星级：match；按 GatheringItemLevelConvertTable 转换；只比等级集合，未以摘要数目推定职业集合。
- 采集等级/职业摘要及点位：unverified；原始等级引用与地图点位须经过对应表解码；未以相同裸数字推定语义。

尚缺/未核验：采集职业、物品等级、地图坐标和限时/隐藏条件逐项验证。

## heaven_on_high — 东方午餐组合：荞麦面 (17968)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/17968.json)，revision 2194812。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## heaven_on_high — 俾斯麦之形 (20547)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/20547.json)，revision 2330567。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## heaven_on_high — 生命之仪 (17616)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/17616.json)，revision 2194465。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## hydatos — 咏唱魔晶石伍型 (5723)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5723.json)，revision 2182945。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## hydatos — 战技魔晶石陆型 (18028)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/18028.json)，revision 2194872。

实体集合：mismatch；本地独有 ["Item:23224"]；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## hydatos — 武略魔晶石陆型 (18019)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/18019.json)，revision 2194863。

实体集合：mismatch；本地独有 ["Item:23224"]；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## leve — 冰之碎晶 (3)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/3.json)，revision 2177287。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 理符来源数量摘要：match；只比较数量，不证明任务身份/奖励组一致。
- 奖励分组/数量/组概率：unverified

尚缺/未核验：Wiki 理符身份及奖励分组、数量、HQ。

## leve — 盗龙革手环 (4153)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/4153.json)，revision 2365692。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 理符来源数量摘要：match；只比较数量，不证明任务身份/奖励组一致。
- 奖励分组/数量/组概率：unverified

尚缺/未核验：Wiki 理符身份及奖励分组、数量、HQ。

## leve — 铋金锭 (36170)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36170.json)，revision 2228113。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 理符来源数量摘要：match；只比较数量，不证明任务身份/奖励组一致。
- 奖励分组/数量/组概率：unverified

尚缺/未核验：Wiki 理符身份及奖励分组、数量、HQ。

## logogram — 失传魔泉 (30914)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/30914.json)，revision 2207291。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## logogram — 光之幕帘 (33784)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/33784.json)，revision 2210111。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## logogram — 文理复活 (24038)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/24038.json)，revision 2200783。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## loot — 赛加羚羊革魔导典 (34391)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/34391.json)，revision 2210714。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## loot — 伊甸之律制敌腿甲 (29064)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/29064.json)，revision 2205447。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## loot — 精骑锁甲靴 (6053)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/6053.json)，revision 2294064。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## mob_drop — 跳蜥蛋 (4774)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/4774.json)，revision 2181995。

实体集合：match；本地独有 []；Wiki独有 []。

- 共享怪物ID的名称校验：match；作为 Wiki BASE_ID -> BNpcName 的本次样本证据。
- 怪物分布：unverified；本地 TerritoryType/坐标与 Wiki AreaID/等级分布不是同一维度；保留原值而不伪造位置等价。

尚缺/未核验：分布区域命名空间与等级/坐标对齐；数量、掉率、特殊出现条件。

## mob_drop — 未鉴定的攻势文理碎晶 (24010)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/24010.json)，revision 2200755。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 共享怪物ID的名称校验：unverified；作为 Wiki BASE_ID -> BNpcName 的本次样本证据。
- 怪物分布：unverified；本地 TerritoryType/坐标与 Wiki AreaID/等级分布不是同一维度；保留原值而不伪造位置等价。

尚缺/未核验：分布区域命名空间与等级/坐标对齐；数量、掉率、特殊出现条件。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## mob_drop — 锤头鳄的粗皮 (44054)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/44054.json)，revision 2376676。

实体集合：match；本地独有 []；Wiki独有 []。

- 共享怪物ID的名称校验：match；作为 Wiki BASE_ID -> BNpcName 的本次样本证据。
- 怪物分布：unverified；本地 TerritoryType/坐标与 Wiki AreaID/等级分布不是同一维度；保留原值而不伪造位置等价。

尚缺/未核验：分布区域命名空间与等级/坐标对齐；数量、掉率、特殊出现条件。

## oizys — 演技教材·吃面包 (30110)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/30110.json)，revision 2240421。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## oizys — 黄金鳗鱼派 (46254)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/46254.json)，revision 2331843。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## oizys — 达识魔晶石拾壹型 (41762)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/41762.json)，revision 2331620。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pagos — 雄略魔晶石陆型 (18020)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/18020.json)，revision 2194864。

实体集合：mismatch；本地独有 ["Item:23224"]；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pagos — 刚柔魔晶石伍型 (5683)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5683.json)，revision 2182905。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pagos — 花花公子鞣革 (23378)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/23378.json)，revision 2200123。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## palace_of_the_dead — 萨维奈舞裙 (10393)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/10393.json)，revision 2366849。

实体集合：mismatch；本地独有 []；Wiki独有 ["Item:16171"]。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## palace_of_the_dead — 厚土大斧 (8374)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/8374.json)，revision 2185561。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## palace_of_the_dead — 萨维奈包头巾 (10387)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/10387.json)，revision 2366843。

实体集合：mismatch；本地独有 []；Wiki独有 ["Item:16171"]。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pilgrims_traverse — 蓝色大丽花头花 (23099)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/23099.json)，revision 2369095。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pilgrims_traverse — 梦羽妖灵王利爪 (38542)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/38542.json)，revision 2214680。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pilgrims_traverse — 沙龙服务员打底裤 (39311)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/39311.json)，revision 2370680。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pyros — 亚拉戈白金币 (5827)

判定：**存在差异**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5827.json)，revision 2425814。

实体集合：mismatch；本地独有 ["Item:16170","Item:16171"]；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pyros — 小长颈驼 (24001)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/24001.json)，revision 2200745。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## pyros — 神眼魔晶石伍型 (5668)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5668.json)，revision 2182890。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## quest — 乌尔卡卦利神锤 (2404)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/2404.json)，revision 2293901。

实体集合：match；本地独有 []；Wiki独有 []。

- 任务奖励数量/固定或择一/重复性：unverified；Item Data 任务来源对象未必含奖励数量和选择模式，需任务数据补证。

尚缺/未核验：任务奖励数量、HQ、选择模式、领取地点和条件。

## quest — 深红木手臂装备箱（品级663） (43499)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/43499.json)，revision 2219518。

实体集合：match；本地独有 []；Wiki独有 []。

- 任务奖励数量/固定或择一/重复性：unverified；Item Data 任务来源对象未必含奖励数量和选择模式，需任务数据补证。

尚缺/未核验：任务奖励数量、HQ、选择模式、领取地点和条件。

## quest — 豆腐煎饼 (22445)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/22445.json)，revision 2199196。

实体集合：match；本地独有 []；Wiki独有 []。

- 任务奖励数量/固定或择一/重复性：unverified；Item Data 任务来源对象未必含奖励数量和选择模式，需任务数据补证。

尚缺/未核验：任务奖励数量、HQ、选择模式、领取地点和条件。

## recipe — 民兵手链 (4173)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/4173.json)，revision 2365711。

实体集合：match；本地独有 []；Wiki独有 []。

- 配方等级/职业等级/星级摘要：match；保留多条配方的数量；职业等级读取 RecipeLevelTable.ClassJobLevel，非直接使用 row ID。
- Recipe:1484/craftType：match
- Recipe:1484/recipeLevelTable：match
- Recipe:1484/level：match
- Recipe:1484/stars：match
- Recipe:1484/outputItemId：match
- Recipe:1484/outputQuantity：match
- Recipe:1484/全部直接材料和水晶：match；保留重复材料项，仅使用 Recipe Data 顶层材料/水晶，不把递归展示的上游材料重复计入当前配方成本。
- Recipe:1484/RequiredCraftsmanship：match
- Recipe:1484/RequiredControl：match
- Recipe:1484/IsSpecializationRequired：match
- Recipe:1484/CanHq：match
- Recipe:1484/IsExpert：match
- Recipe:1484/秘籍解锁物品：match；SecretRecipeBook ID 与 Item ID 分开，经 SecretRecipeBook.Item 映射。

尚缺/未核验：Wiki 完整配方集合、任务/场景触发与上游材料路线未穷举。

Recipe:1484 Wiki revision 2276997，2026-05-04T18:46:57Z。

## recipe — 夏季靛蓝衬衫 (27941)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/27941.json)，revision 2369572。

实体集合：match；本地独有 []；Wiki独有 []。

- 配方等级/职业等级/星级摘要：match；保留多条配方的数量；职业等级读取 RecipeLevelTable.ClassJobLevel，非直接使用 row ID。
- Recipe:33442/craftType：match
- Recipe:33442/recipeLevelTable：match
- Recipe:33442/level：match
- Recipe:33442/stars：match
- Recipe:33442/outputItemId：match
- Recipe:33442/outputQuantity：match
- Recipe:33442/全部直接材料和水晶：match；保留重复材料项，仅使用 Recipe Data 顶层材料/水晶，不把递归展示的上游材料重复计入当前配方成本。
- Recipe:33442/RequiredCraftsmanship：match
- Recipe:33442/RequiredControl：match
- Recipe:33442/IsSpecializationRequired：match
- Recipe:33442/CanHq：match
- Recipe:33442/IsExpert：match
- Recipe:33442/秘籍解锁物品：match；SecretRecipeBook ID 与 Item ID 分开，经 SecretRecipeBook.Item 映射。

尚缺/未核验：Wiki 完整配方集合、任务/场景触发与上游材料路线未穷举。

Recipe:33442 Wiki revision 2284736，2026-05-04T19:03:30Z。

## recipe — 宇宙探索用的开心粉 (49972)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/49972.json)，revision 2225805。

实体集合：match；本地独有 []；Wiki独有 []。

- 配方等级/职业等级/星级摘要：match；保留多条配方的数量；职业等级读取 RecipeLevelTable.ClassJobLevel，非直接使用 row ID。
- Recipe:37735/craftType：match
- Recipe:37735/recipeLevelTable：match
- Recipe:37735/level：match
- Recipe:37735/stars：match
- Recipe:37735/outputItemId：match
- Recipe:37735/outputQuantity：match
- Recipe:37735/全部直接材料和水晶：match；保留重复材料项，仅使用 Recipe Data 顶层材料/水晶，不把递归展示的上游材料重复计入当前配方成本。
- Recipe:37735/RequiredCraftsmanship：match
- Recipe:37735/RequiredControl：match
- Recipe:37735/IsSpecializationRequired：match
- Recipe:37735/CanHq：match
- Recipe:37735/IsExpert：match
- Recipe:37735/秘籍解锁物品：match；SecretRecipeBook ID 与 Item ID 分开，经 SecretRecipeBook.Item 映射。

尚缺/未核验：Wiki 完整配方集合、任务/场景触发与上游材料路线未穷举。

Recipe:37735 Wiki revision 2288924，2026-05-04T19:12:46Z。

## reduction — 冰之水晶 (9)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/9.json)，revision 2376636。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## reduction — 黄金灵砂 (44035)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/44035.json)，revision 2361396。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## reduction — 高浓度火成精油 (41418)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/41418.json)，revision 2217492。

实体集合：match；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

## retainer_normal — 库尔札斯胡萝卜种子 (7717)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/7717.json)，revision 2184912。

实体集合：match；本地独有 []；Wiki独有 []。

- RetainerTask:563/ClassJobCategory：match
- RetainerTask:563/RetainerLevel：match
- RetainerTask:563/VentureCost：match
- RetainerTask:563/MaxTimemin：match
- RetainerTask:563/Experience：match
- RetainerTask:563/quantities：match
- RetainerTask:563/属性需求档位：match；首项是 RequiredGathering 采集力门槛，后四项来自 PerceptionDoL/FSH 鉴别力数量档位；数组不可排序，也不是单一属性单调递增序列。

尚缺/未核验：雇员任务实际解锁/物品发现条件未与 Wiki 展开页面核验。

## retainer_normal — 泽梅尔番茄 (6148)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/6148.json)，revision 2183369。

实体集合：match；本地独有 []；Wiki独有 []。

- RetainerTask:568/ClassJobCategory：match
- RetainerTask:568/RetainerLevel：match
- RetainerTask:568/VentureCost：match
- RetainerTask:568/MaxTimemin：match
- RetainerTask:568/Experience：match
- RetainerTask:568/quantities：match
- RetainerTask:568/属性需求档位：match；首项是 RequiredGathering 采集力门槛，后四项来自 PerceptionDoL/FSH 鉴别力数量档位；数组不可排序，也不是单一属性单调递增序列。

尚缺/未核验：雇员任务实际解锁/物品发现条件未与 Wiki 展开页面核验。

## retainer_normal — 冰神鱼 (12765)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/12765.json)，revision 2293878。

实体集合：match；本地独有 []；Wiki独有 []。

- RetainerTask:490/ClassJobCategory：match
- RetainerTask:490/RetainerLevel：match
- RetainerTask:490/VentureCost：match
- RetainerTask:490/MaxTimemin：match
- RetainerTask:490/Experience：match
- RetainerTask:490/quantities：match
- RetainerTask:490/属性需求档位：match；首项是 RequiredGathering 采集力门槛，后四项来自 PerceptionDoL/FSH 鉴别力数量档位；数组不可排序，也不是单一属性单调递增序列。

尚缺/未核验：雇员任务实际解锁/物品发现条件未与 Wiki 展开页面核验。

## retainer_random — 棕榈糖浆 (36086)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36086.json)，revision 2212308。

实体集合：mismatch；本地独有 ["RetainerTask:884"]；Wiki独有 []。

- 随机任务等级/职业/耗时/需求：unverified

尚缺/未核验：随机探索物品数量/概率及完整职业/装备条件逐项核验。

Wiki 有雇员探险键，但本样本全部为普通筹集任务，没有列出 Supplemental 的随机探索任务。

## retainer_random — 星点石英原石 (36178)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36178.json)，revision 2212400。

实体集合：mismatch；本地独有 ["RetainerTask:883","RetainerTask:962"]；Wiki独有 []。

- 随机任务等级/职业/耗时/需求：unverified

尚缺/未核验：随机探索物品数量/概率及完整职业/装备条件逐项核验。

Wiki 有雇员探险键，但本样本全部为普通筹集任务，没有列出 Supplemental 的随机探索任务。

## retainer_random — 白梣木原木 (27685)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/27685.json)，revision 2204142。

实体集合：mismatch；本地独有 ["RetainerTask:765"]；Wiki独有 []。

- 随机任务等级/职业/耗时/需求：unverified

尚缺/未核验：随机探索物品数量/概率及完整职业/装备条件逐项核验。

Wiki 有雇员探险键，但本样本全部为普通筹集任务，没有列出 Supplemental 的随机探索任务。

## skybuilder_handin — 第四期重建用的欧洛浦肯（检） (32919)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/32919.json)，revision 2209266。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本比较器尚未建立该机制与 Wiki 的语义映射；类别存在与否无法判定。

这是检验前物品到检验后物品的转换；本轮 Wiki Item Data 未提供结构化同类来源，未强行归到鉴定。

## skybuilder_handin — 第四期重建用的最高级灵青岩（检） (31990)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/31990.json)，revision 2208360。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本比较器尚未建立该机制与 Wiki 的语义映射；类别存在与否无法判定。

这是检验前物品到检验后物品的转换；本轮 Wiki Item Data 未提供结构化同类来源，未强行归到鉴定。

## skybuilder_handin — 第三期重建用的特供棉花（检） (31264)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/31264.json)，revision 2207641。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 转化数量范围/概率/条件：unverified；本轮 Wiki Item Data 没有同维度 Min/Max/Probability 字段；空值不能作 0，社区观测概率不能作官方掉率。

尚缺/未核验：来源物品获取链、转化条件与数量/概率。

本比较器尚未建立该机制与 Wiki 的语义映射；类别存在与否无法判定。

这是检验前物品到检验后物品的转换；本轮 Wiki Item Data 未提供结构化同类来源，未强行归到鉴定。

## spearfishing — 毒鲉 (20167)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/20167.json)，revision 2196954。

实体集合：match；本地独有 []；Wiki独有 []。

- 刺鱼物品等级/星级：match；物品等级由 ConvertTable 解码，与 Notebook 节点等级分开。
- 刺鱼关联及条件：unverified

尚缺/未核验：刺鱼水域/物品等级/鱼群条件与地图坐标。

## spearfishing — 萨维奈海参 (36522)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36522.json)，revision 2212717。

实体集合：match；本地独有 []；Wiki独有 []。

- 刺鱼物品等级/星级：match；物品等级由 ConvertTable 解码，与 Notebook 节点等级分开。
- 刺鱼关联及条件：unverified

尚缺/未核验：刺鱼水域/物品等级/鱼群条件与地图坐标。

## spearfishing — 萨维奈鳗鱼 (36524)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36524.json)，revision 2212719。

实体集合：match；本地独有 []；Wiki独有 []。

- 刺鱼物品等级/星级：match；物品等级由 ConvertTable 解码，与 Notebook 节点等级分开。
- 刺鱼关联及条件：unverified

尚缺/未核验：刺鱼水域/物品等级/鱼群条件与地图坐标。

## special_vendor — 木工秘籍第十二卷 (46314)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/46314.json)，revision 2222224。

实体集合：match；本地独有 []；Wiki独有 []。

- SpecialShop:1770627:16/Wiki条件组:0/全部输出数量HQ：match
- SpecialShop:1770627:16/Wiki条件组:0/AND成本物品数量收藏值：unverified；UseCurrencyType=16 未验证解析，不把成本原码当 Item ID。
- SpecialShop:1770627:16/Wiki条件组:0/成本HQ：unverified；当前表无独立 CostHq 字段，CostType 语义未证实，不能虚构成本 HQ。
- SpecialShop:1770627:16/Wiki条件组:0/单行任务：match
- SpecialShop:1770627:16/Wiki条件组:0/商店任务：match
- SpecialShop:1770627:16/Wiki条件组:0/其他条件与NPC地点：unverified；相同报价/商店条件的多个 NPC 合并检查；本比较未恢复 NPC 路由/地图位置，其他条件仍需独立解释。
- SpecialShop:1770874:16/Wiki条件组:0/全部输出数量HQ：match
- SpecialShop:1770874:16/Wiki条件组:0/AND成本物品数量收藏值：unverified；UseCurrencyType=16 未验证解析，不把成本原码当 Item ID。
- SpecialShop:1770874:16/Wiki条件组:0/成本HQ：unverified；当前表无独立 CostHq 字段，CostType 语义未证实，不能虚构成本 HQ。
- SpecialShop:1770874:16/Wiki条件组:0/单行任务：match
- SpecialShop:1770874:16/Wiki条件组:0/商店任务：match
- SpecialShop:1770874:16/Wiki条件组:0/其他条件与NPC地点：unverified；相同报价/商店条件的多个 NPC 合并检查；本比较未恢复 NPC 路由/地图位置，其他条件仍需独立解释。

尚缺/未核验：SpecialShop:1770627 货币模式 16 解析；SpecialShop:1770874 货币模式 16 解析；NPC/菜单/坐标及非任务条件。

## special_vendor — 龙须拳·优雅 (41680)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/41680.json)，revision 2217735。

实体集合：match；本地独有 []；Wiki独有 []。

- SpecialShop:1770733:1/Wiki条件组:0/全部输出数量HQ：match
- SpecialShop:1770733:1/Wiki条件组:0/AND成本物品数量收藏值：match；只对 UseCurrencyType=2、CostType=0 的原始物品编码与 Wiki 直接对照；不覆盖其他货币模式。
- SpecialShop:1770733:1/Wiki条件组:0/成本HQ：unverified；当前表无独立 CostHq 字段，CostType 语义未证实，不能虚构成本 HQ。
- SpecialShop:1770733:1/Wiki条件组:0/单行任务：match
- SpecialShop:1770733:1/Wiki条件组:0/商店任务：match
- SpecialShop:1770733:1/Wiki条件组:0/其他条件与NPC地点：unverified；相同报价/商店条件的多个 NPC 合并检查；本比较未恢复 NPC 路由/地图位置，其他条件仍需独立解释。

尚缺/未核验：NPC/菜单/坐标及非任务条件。

## special_vendor — 戈耳狄原型强袭角盔 (11450)

判定：**部分对齐**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/11450.json)，revision 2367055。

实体集合：match；本地独有 []；Wiki独有 []。

- SpecialShop:1769579:2/Wiki条件组:0/全部输出数量HQ：match
- SpecialShop:1769579:2/Wiki条件组:0/AND成本物品数量收藏值：match；只对 UseCurrencyType=2、CostType=0 的原始物品编码与 Wiki 直接对照；不覆盖其他货币模式。
- SpecialShop:1769579:2/Wiki条件组:0/成本HQ：unverified；当前表无独立 CostHq 字段，CostType 语义未证实，不能虚构成本 HQ。
- SpecialShop:1769579:2/Wiki条件组:0/单行任务：match
- SpecialShop:1769579:2/Wiki条件组:0/商店任务：match
- SpecialShop:1769579:2/Wiki条件组:0/其他条件与NPC地点：unverified；相同报价/商店条件的多个 NPC 合并检查；本比较未恢复 NPC 路由/地图位置，其他条件仍需独立解释。
- SpecialShop:1770125:0/Wiki条件组:0/全部输出数量HQ：match
- SpecialShop:1770125:0/Wiki条件组:0/AND成本物品数量收藏值：unverified；UseCurrencyType=16 未验证解析，不把成本原码当 Item ID。
- SpecialShop:1770125:0/Wiki条件组:0/成本HQ：unverified；当前表无独立 CostHq 字段，CostType 语义未证实，不能虚构成本 HQ。
- SpecialShop:1770125:0/Wiki条件组:0/单行任务：match
- SpecialShop:1770125:0/Wiki条件组:0/商店任务：match
- SpecialShop:1770125:0/Wiki条件组:0/其他条件与NPC地点：unverified；相同报价/商店条件的多个 NPC 合并检查；本比较未恢复 NPC 路由/地图位置，其他条件仍需独立解释。

尚缺/未核验：SpecialShop:1770125 货币模式 16 解析；NPC/菜单/坐标及非任务条件。

## store — 巫女护腿 (33753)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/33753.json)，revision 2370186。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 商城价格/套装物品/当前销售状态：unverified；PriceCentsUSD 不是国服价格；固定 CSV 不能证明当前上架状态。

尚缺/未核验：跨区商品对应关系、国服价格、套装数量及有效期。

## store — 特制女仆腕带 (20491)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/20491.json)，revision 2368814。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 商城价格/套装物品/当前销售状态：unverified；PriceCentsUSD 不是国服价格；固定 CSV 不能证明当前上架状态。

尚缺/未核验：跨区商品对应关系、国服价格、套装数量及有效期。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## store — 欧米茄M耳夹 (36338)

判定：**无法比较**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/36338.json)，revision 2425998。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 商城价格/套装物品/当前销售状态：unverified；PriceCentsUSD 不是国服价格；固定 CSV 不能证明当前上架状态。

尚缺/未核验：跨区商品对应关系、国服价格、套装数量及有效期。

## submarine — 神眼魔晶石伍型 (5668)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/5668.json)，revision 2182890。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 潜艇战利品档位/数量范围/解锁：unverified；Wiki Item Data 航区摘要没有 Supplemental 的 Normal/Poor/Optimal 数量范围；未读航区详情。

尚缺/未核验：航区名称、解锁路线、能力门槛及按档位数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## submarine — 钯金沙 (19956)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/19956.json)，revision 2196744。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 潜艇战利品档位/数量范围/解锁：unverified；Wiki Item Data 航区摘要没有 Supplemental 的 Normal/Poor/Optimal 数量范围；未读航区详情。

尚缺/未核验：航区名称、解锁路线、能力门槛及按档位数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## submarine — 榉木原木 (19933)

判定：**Wiki Data 未列该机制**。 [Wiki Data](https://ff14.huijiwiki.com/wiki/Data:Item/19933.json)，revision 2196721。

实体集合：unverified；本地独有 []；Wiki独有 []。

- 潜艇战利品档位/数量范围/解锁：unverified；Wiki Item Data 航区摘要没有 Supplemental 的 Normal/Poor/Optimal 数量范围；未读航区详情。

尚缺/未核验：航区名称、解锁路线、能力门槛及按档位数量/概率。

本样本 Wiki Item Data 未列出该机制；这不是物品无法通过该机制获得的证明。

## 证据与重跑

- manifest.json：固定抽样和全部本地引用。
- inputs/：MCP 表快照、固定依赖 CSV 数据、Wiki 原始 Data 页与修订。
- details/：样本所需完整行/关联实体。
- results.json：字段级本地/Wiki值、差集和判定。

`node tmp/item-source-probe/probe.mjs compare` 可离线重跑。选择新样本运行 `select`，然后必须重新抓取 Wiki 和导出所需 MCP 明细。
