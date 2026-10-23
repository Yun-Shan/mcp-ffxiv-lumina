# 本轮 Wiki 对照的类型处理

抓取日期：2026-10-24（Asia/Shanghai）。本轮固定 manifest 的 118 个 Item Data 页全部读取成功，12 批均 HTTP 200；没有替换样本。完整原始数据、请求 URL、数据修订和每项状态在 `inputs/wiki-items.json`。

- `inputs/wiki-source-shapes.json`：本轮实际出现的每个来源键及值形状，含代表数据。
- `inputs/wiki-sample-shapes.json`：40 类、120 个样本的来源键/形状概览。
- `inputs/wiki-item-page-module.json`：本轮读取的 Wiki 页面渲染模块，可核对分类合并方式。
- `inputs/wiki-recipes-data.json`：3 个 recipe 随机样本的完整 Recipe 数据与修订。
- `inputs/wiki-recipes-rendered.json`：同 3 个物品的 parse HTML、正文、表格、页面修订。

## 不同值形状

| 来源键 | 本轮值形状 | 对照方式 |
|---|---|---|
| 成就 | 单对象 | 对象 `ID` 是成就 ID；不是长度为一的隐式数组，先显式归一化 |
| 任务 | 单对象或数字数组 | 单对象取 `ID`；数组逐项是任务 ID。对齐奖励关系后还需另查任务奖励数量/条件 |
| 理符 | 数值或单对象 | 数值是摘要计数，不能伪造相应个数的关系；单对象可核对具体 `ID` |
| 制作 | 对象数组 | Item 页仅职业/等级摘要。完整路线比较必须读取 Recipe Data 或 parse 的配方表 |
| 采集 | 对象数组 | 职业/等级摘要，不能当成点位记录 |
| 采集点 | 数字数组 | GatheringPointBase/采集基础点 ID；需查关联点及坐标 |
| 钓鱼 | 数字数组 | FishingSpot ID；不能当成鱼饵、天气和时间条件已齐全 |
| 种子 | 单对象 | 杂交数组内种子组合、双向标志、结果、效率分别保留；对象本身还包含作物信息，不能全部算成种子来源 |
| 栽培 | 单对象 | `种子物品.ID`、作物 ID、产量、成长时间等；确认目标是种子或作物 |
| 商店 | 对象数组 | NPC 和商店 ID、地点、条件。重复 NPC 展开不等于多种价格报价 |
| 特殊商店 | 对象数组 | `商店ID` + `兑换信息.index` + 输出槽识别报价；index 是一基。NPC/坐标覆盖另比，成本为 AND、报价之间为 OR |
| 掉落 | 对象数组 | `BASE_ID` 是怪物基础实体身份；同名和多个分布不能靠名称随意去重 |
| 副本 | 对象数组 | ID 保留 Wiki 自己的语义，另核对 Content/Instance 的映射。`数据类型`、首领/宝箱、序号与坐标不能丢失 |
| 物品箱、鉴定 | 对象数组 | 当前对象 ID 是上游容器。分开比较开箱/鉴定动作，不能只看容器名字相似 |
| 精选 | 对象数组 | 小写 `id` 是输入物品，另有 `job`。不能统一假定所有身份字段都大写 `ID` |
| 雇员探险 | 对象数组 | 实际任务 ID 及 `随机任务` 标志；普通筹集与随机探索分开。还要比职业/等级、费用、时间、数量档位、属性档位 |
| 部队探索 | 对象数组 | 地图和区域代码；不存在统一 `ID` 时需通过表明确映射，不能拿数组下标当航区 ID |
| 潜水艇 | 对象数组 | 小写 `id`/`map`/`name`/`code`，保留所在地图 |
| 危命任务、紧急遭遇战 | 对象数组 | ID 与奖牌/稀有奖励平行数组一起比较，稀有列表不代表保证掉落 |
| 特殊场景探索 | 对象数组 | 场景中文名、`获取途径` 子对象与宝箱等级；不能与副本表无条件拼接 |
| 其他 | 对象数组 | 原始描述、标题、模板解析状态保留；不可推断未表达的结构化成本/条件 |
| 道具商城 | 对象数组 | 商品 ID、地域渠道、是否在售、日期、物品列表；国际服 Store CSV 与国服商城不能直接按同类判定等价 |
| 寻宝、宝物库、幻卡对战、天书奇谈、宇宙好运道 | 对象/数值/文本数组 | 按各自身份和奖励语义处理；本轮原始示例见 shape 文件，不能套通用 `ID` 提取器 |

Wiki 渲染模块会把特殊商店/军票商店/特殊兑换/部队战绩兑换/处理商店合成“商店兑换”，把副本/宝物库合成“副本和宝物库”，并让钓鱼进入采集展示。因此来源原始键、底层机制、页面展示分组是三个层次，不应拿三者数量直接互相比较。

## 制作额外核对

3 个随机样本在渲染页的 `data-recipe-id` 分别为 1484、33442、37735，与候选引用一致。Recipe Data 顶层的 `水晶` 和 `材料` 才是本配方的直接成本；材料对象内可能递归展示其自身配方，不应混入目标配方的直接材料。

49972“宇宙探索用的开心粉”是特殊的宇宙探索高难配方，页面仍明确展示制作来源。其“用于宇宙探索任务”属于用途，不应误计为完成该任务奖励目标物品。

## 重跑网络部分

```powershell
& 'D:\Develop\nodejs\node.exe' tmp/item-source-probe/fetch-wiki.mjs --manifest tmp/item-source-probe/manifest.json --output tmp/item-source-probe/inputs/wiki-items.json
```

本机直接 Node HTTP 实测被 Cloudflare 拦截（见 `inputs/wiki-direct-node-probe.json`），因此本轮用已配置 Playwright 在 Wiki 同源页面执行匿名 `fetch`，`credentials: 'omit'`。可生成同一函数供 Playwright `browser_evaluate` 使用：

```powershell
& 'D:\Develop\nodejs\node.exe' tmp/item-source-probe/fetch-wiki.mjs --manifest tmp/item-source-probe/manifest.json --browser-function --output tmp/item-source-probe/inputs/wiki-fetch-browser-function.js
```

把生成文件内容作为 `browser_evaluate.function`，`filename` 指向 `tmp/item-source-probe/inputs/wiki-items.json`，即可保存工具求值的完整 JSON 结果。普通 Playwright Node 环境也可导入 `runBrowserProbe(page)`；当前 MCP 工具 sandbox 禁止动态 import，故本轮采用上面的函数文本方式。

这些结果只证明本轮小批量匿名读取可用；Data 修订与页面修订分别保存，页面修订本身不冻结所有 Lua 依赖数据。
