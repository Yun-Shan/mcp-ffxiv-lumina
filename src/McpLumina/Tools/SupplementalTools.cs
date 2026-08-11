using System.ComponentModel;
using System.Globalization;
using Lumina.Excel.Sheets;
using LuminaSupplemental.Excel.Model;
using McpLumina.Models;
using McpLumina.Models.Responses;
using McpLumina.Services;
using McpLumina.Validators;
using ModelContextProtocol.Server;

namespace McpLumina.Tools;

/// <summary>
/// Tools backed by LuminaSupplemental.Excel — community-maintained CSV data that augments
/// the base FFXIV game sheets with drop tables, spawn positions, NPC locations, and more.
/// All supplemental data is loaded eagerly at startup from embedded CSV assets.
/// </summary>
[McpServerToolType]
public sealed class SupplementalTools(SupplementalDataService supplemental, GameDataService gameData)
{
    // ── get_mob_drops ─────────────────────────────────────────────────────

    [McpServerTool(Name = "get_mob_drops")]
    [Description(
        "Returns monster drop data from the community-maintained LuminaSupplemental dataset " +
        "(2,644 mob→item pairs). Each entry links a monster (BNpcNameId) to an item it can drop (ItemId). " +
        "Note: no drop rate or quantity data is available — pairs only. " +
        "Filter by monster name with monsterQuery, by item name with itemQuery, or omit both to list all. " +
        "Use limit and offset for pagination.")]
    public string GetMobDrops(
        [Description("Monster name substring to filter by (case-insensitive).")] string? monsterQuery = null,
        [Description("Item name substring to filter by (case-insensitive).")] string? itemQuery = null,
        [Description("Maximum number of results (1–200). Default 50.")] int? limit = null,
        [Description("Number of results to skip for pagination. Default 0.")] int? offset = null,
        [Description("Comma-separated language codes, e.g. 'en,ja'. Defaults to server default.")] string? languages = null) =>
        ToolHelper.Execute(() =>
        {
            var lim   = InputValidator.ValidateLimit(limit);
            var off   = InputValidator.ValidateOffset(offset);
            var langs = gameData.Languages.Resolve(InputValidator.ParseLanguages(languages));
            return ToolHelper.Ok(BuildMobDropsResponse(monsterQuery, itemQuery, lim, off, langs));
        });

    // ── Builder ───────────────────────────────────────────────────────────

    private MobDropsResponse BuildMobDropsResponse(
        string? monsterQuery, string? itemQuery,
        int limit, int offset, string[] langs)
    {
        var (returned, fallback) = gameData.Languages.ApplyFallback(langs);
        var primaryLang = returned.Contains(gameData.Languages.DefaultLanguage) ? gameData.Languages.DefaultLanguage : returned[0];

        var bnpcPrimary = supplemental.GetBNpcNames(primaryLang);
        var itemPrimary = supplemental.GetItemNames(primaryLang);

        var allMatches = new List<(uint BNpcNameId, string MobName, uint ItemId, string ItemName)>();

        foreach (var drop in supplemental.MobDrops)
        {
            if (!bnpcPrimary.TryGetValue(drop.BNpcNameId, out var mobName)) continue;
            if (!itemPrimary.TryGetValue(drop.ItemId, out var itemName)) continue;

            if (monsterQuery is not null &&
                !mobName.Contains(monsterQuery, StringComparison.OrdinalIgnoreCase)) continue;
            if (itemQuery is not null &&
                !itemName.Contains(itemQuery, StringComparison.OrdinalIgnoreCase)) continue;

            allMatches.Add((drop.BNpcNameId, mobName, drop.ItemId, itemName));
        }

        var totalMatches = allMatches.Count;
        var page         = allMatches.Skip(offset).Take(limit).ToList();

        // Build secondary-language name maps for only the paged rows
        var pageMonsterIds = new HashSet<uint>(page.Select(x => x.BNpcNameId));
        var pageItemIds    = new HashSet<uint>(page.Select(x => x.ItemId));

        var secMobNames = returned
            .Where(l => l != primaryLang)
            .ToDictionary(
                l => l,
                l =>
                {
                    var idx = supplemental.GetBNpcNames(l);
                    return pageMonsterIds
                        .Where(idx.ContainsKey)
                        .ToDictionary(id => id, id => idx[id]);
                });

        var secItemNames = returned
            .Where(l => l != primaryLang)
            .ToDictionary(
                l => l,
                l =>
                {
                    var idx = supplemental.GetItemNames(l);
                    return pageItemIds
                        .Where(idx.ContainsKey)
                        .ToDictionary(id => id, id => idx[id]);
                });

        var entries = page.Select(d =>
        {
            var mobNameMap  = new Dictionary<string, string> { [primaryLang] = d.MobName };
            var itemNameMap = new Dictionary<string, string> { [primaryLang] = d.ItemName };

            foreach (var (lang, idx) in secMobNames)
                if (idx.TryGetValue(d.BNpcNameId, out var n)) mobNameMap[lang]  = n;
            foreach (var (lang, idx) in secItemNames)
                if (idx.TryGetValue(d.ItemId, out var n))     itemNameMap[lang] = n;

            return new MobDropEntry(d.BNpcNameId, mobNameMap, d.ItemId, itemNameMap);
        }).ToArray();

        return new MobDropsResponse
        {
            MonsterQuery       = monsterQuery,
            ItemQuery          = itemQuery,
            LanguagesRequested = langs,
            LanguagesReturned  = returned,
            FallbackUsed       = fallback,
            TotalMatches       = totalMatches,
            Offset             = offset,
            Limit              = limit,
            Drops              = entries,
            GameVersion        = gameData.GameVersion,
            Timestamp          = DateTimeOffset.UtcNow.ToString("O"),
        };
    }

    // ── get_item_sources ──────────────────────────────────────────────────

    [McpServerTool(Name = "get_item_sources")]
    [Description(
        "Aggregates every known way to obtain a single item, across the LuminaSupplemental datasets " +
        "and the game's shop sheets: mob drops, crafting-material derivation (desynthesis, reduction, " +
        "gardening), dungeon loot (coffers and boss drops), FATE rewards, exploration (retainer ventures, " +
        "submarine/airship voyages), vendors (gil and special-currency), and the quests that consume it. " +
        "Identify the item by itemId (exact) or query (first item whose name contains the substring). " +
        "Each source carries a coarse 'category' (drop | crafting | dungeon | content | exploration | vendor | quest) " +
        "for filtering, plus a localised source name and free-form detail (drop rate, quantity, gil price). " +
        "Use limit and offset to page the source list.")]
    public string GetItemSources(
        [Description("Exact Item row ID to look up. Takes precedence over query.")] int? itemId = null,
        [Description("Item name substring; resolves to the first matching item (case-insensitive). Ignored if itemId is set.")] string? query = null,
        [Description("Maximum number of sources to return (1–200). Default 50.")] int? limit = null,
        [Description("Number of sources to skip for pagination. Default 0.")] int? offset = null,
        [Description("Comma-separated language codes, e.g. 'en,ja'. Defaults to server default.")] string? languages = null) =>
        ToolHelper.Execute(() =>
        {
            var lim   = InputValidator.ValidateLimit(limit);
            var off   = InputValidator.ValidateOffset(offset);
            var langs = gameData.Languages.Resolve(InputValidator.ParseLanguages(languages));

            if (itemId is < 0)
                throw new ValidationException("itemId must be >= 0.");
            if (itemId is null && string.IsNullOrWhiteSpace(query))
                throw new ValidationException("Provide either itemId or query to identify an item.");

            return ToolHelper.Ok(BuildItemSourcesResponse(itemId is null ? null : (uint)itemId.Value, query, lim, off, langs));
        });

    private ItemSourcesResponse BuildItemSourcesResponse(
        uint? itemId, string? query, int limit, int offset, string[] langs)
    {
        var (returned, fallback) = gameData.Languages.ApplyFallback(langs);
        var primaryLang = returned.Contains(gameData.Languages.DefaultLanguage)
            ? gameData.Languages.DefaultLanguage : returned[0];

        var itemPrimary = supplemental.GetItemNames(primaryLang);

        // Resolve the target item: explicit id wins, otherwise first name match ordered by id.
        uint id;
        if (itemId is { } explicitId)
        {
            id = explicitId;
        }
        else
        {
            var match = itemPrimary
                .Where(kv => kv.Value.Contains(query!, StringComparison.OrdinalIgnoreCase))
                .OrderBy(kv => kv.Key)
                .Select(kv => (uint?)kv.Key)
                .FirstOrDefault();
            if (match is null)
                throw new ValidationException($"No item matches query '{query}'.");
            id = match.Value;
        }

        // Localise a referenced entity id across the returned languages via a name-index getter.
        Dictionary<string, string>? Loc(uint entityId, Func<string, IReadOnlyDictionary<uint, string>> getter)
        {
            var d = new Dictionary<string, string>();
            foreach (var lang in returned)
                if (getter(lang).TryGetValue(entityId, out var n)) d[lang] = n;
            return d.Count > 0 ? d : null;
        }

        var itemName = Loc(id, supplemental.GetItemNames) ?? new Dictionary<string, string>();
        var gilPrice = gameData.Raw.Excel.GetSheet<Item>().GetRowOrDefault(id)?.PriceMid ?? 0u;

        var sources = new List<ItemSourceEntry>();

        // ── Drops ──
        foreach (var bnpcId in supplemental.GetMobsDropping(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "mob_drop", Category = "drop",
                SourceId = bnpcId, SourceName = Loc(bnpcId, supplemental.GetBNpcNames),
            });

        // ── Crafting / derivation (desynth, reduction, gardening, loot, exploration containers) ──
        foreach (var d in supplemental.GetDerivations(id))
        {
            var (type, cat) = MapSupplementSource(d.ItemSupplementSource);
            sources.Add(new ItemSourceEntry
            {
                SourceType = type, Category = cat,
                SourceId = d.SourceItemId, SourceName = Loc(d.SourceItemId, supplemental.GetItemNames),
                Detail = ChanceDetail(d.Min, d.Max, (double)(d.Probability ?? 0)),
            });
        }

        // ── Dungeon loot ──
        foreach (var (entry, cfc) in supplemental.GetDungeonChests(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "dungeon_chest", Category = "dungeon",
                SourceId = cfc, SourceName = Loc(cfc, supplemental.GetDutyNames),
                Detail = ChanceDetail(entry.Min, entry.Max, (double)(entry.Probability ?? 0)),
            });

        foreach (var d in supplemental.GetBossDrops(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "dungeon_boss", Category = "dungeon",
                SourceId = d.ContentFinderConditionId, SourceName = Loc(d.ContentFinderConditionId, supplemental.GetDutyNames),
                Detail = QuantityDetail(d.Quantity),
            });

        foreach (var d in supplemental.GetBossChests(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "dungeon_boss_chest", Category = "dungeon",
                SourceId = d.ContentFinderConditionId, SourceName = Loc(d.ContentFinderConditionId, supplemental.GetDutyNames),
                Detail = QuantityDetail(d.Quantity),
            });

        foreach (var d in supplemental.GetDungeonDrops(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "dungeon_drop", Category = "dungeon",
                SourceId = d.ContentFinderConditionId, SourceName = Loc(d.ContentFinderConditionId, supplemental.GetDutyNames),
            });

        // ── Content: FATEs ──
        foreach (var fateId in supplemental.GetFates(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "fate", Category = "content",
                SourceId = fateId, SourceName = Loc(fateId, supplemental.GetFateNames),
            });

        // ── Exploration: retainer ventures, submarine, airship ──
        foreach (var ventureId in supplemental.GetRetainerVentures(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "retainer_venture", Category = "exploration",
                SourceId = ventureId, Detail = $"venture table #{ventureId}",
            });

        foreach (var d in supplemental.GetSubmarineDrops(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "submarine", Category = "exploration",
                SourceId = d.SubmarineExplorationId, Detail = $"sector #{d.SubmarineExplorationId}",
            });

        foreach (var pointId in supplemental.GetAirshipDrops(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "airship", Category = "exploration",
                SourceId = pointId, Detail = $"sector #{pointId}",
            });

        // ── Vendors ──
        foreach (var shopId in supplemental.GetGilShops(id))
        {
            var (name, ctx) = VendorNames(shopId, primaryLang, Loc);
            sources.Add(new ItemSourceEntry
            {
                SourceType = "gil_vendor", Category = "vendor",
                SourceId = shopId, SourceName = name, Context = ctx,
                Detail = gilPrice > 0 ? $"{gilPrice.ToString("N0", CultureInfo.InvariantCulture)} gil" : null,
            });
        }

        foreach (var shopId in supplemental.GetSpecialShops(id))
        {
            var (name, ctx) = VendorNames(shopId, primaryLang, Loc);
            sources.Add(new ItemSourceEntry
            {
                SourceType = "special_vendor", Category = "vendor",
                SourceId = shopId, SourceName = name, Context = ctx,
                Detail = "special-currency exchange",
            });
        }

        // ── Quests that consume the item (obtained-for, not obtained-from) ──
        foreach (var q in supplemental.GetQuestUses(id))
            sources.Add(new ItemSourceEntry
            {
                SourceType = "quest_required", Category = "quest",
                SourceId = q.QuestId, SourceName = Loc(q.QuestId, supplemental.GetQuestNames),
                Detail = QuantityDetail(q.Quantity) is { } qd ? (q.IsHq ? qd + " HQ" : qd) : (q.IsHq ? "HQ" : null),
            });

        var categoryCounts = sources
            .GroupBy(s => s.Category)
            .ToDictionary(g => g.Key, g => g.Count());

        var total = sources.Count;
        var page  = sources.Skip(offset).Take(limit).ToArray();

        return new ItemSourcesResponse
        {
            ItemId             = id,
            ItemName           = itemName,
            ItemFound          = itemName.Count > 0,
            LanguagesRequested = langs,
            LanguagesReturned  = returned,
            FallbackUsed       = fallback,
            CategoryCounts     = categoryCounts,
            TotalSources       = total,
            Offset             = offset,
            Limit              = limit,
            Sources            = page,
            GameVersion        = gameData.GameVersion,
            Timestamp          = DateTimeOffset.UtcNow.ToString("O"),
        };
    }

    private (Dictionary<string, string>? Name, Dictionary<string, string>? Context) VendorNames(
        uint shopId, string primaryLang, Func<uint, Func<string, IReadOnlyDictionary<uint, string>>, Dictionary<string, string>?> loc)
    {
        var npcIds  = supplemental.GetShopNpcs(shopId).ToList();
        var npcName = npcIds.Count > 0 ? loc(npcIds[0], supplemental.GetNpcNames) : null;

        var label = supplemental.GetShopLabel(shopId);
        var shopName = label is not null
            ? new Dictionary<string, string> { [primaryLang] = label }
            : null;

        // Prefer the descriptive shop label as the name and the NPC as context;
        // fall back to the NPC name when no label exists.
        return shopName is not null ? (shopName, npcName) : (npcName, null);
    }

    private static (string Type, string Category) MapSupplementSource(ItemSupplementSource source) => source switch
    {
        ItemSupplementSource.Desynth          => ("desynth", "crafting"),
        ItemSupplementSource.Reduction        => ("reduction", "crafting"),
        ItemSupplementSource.Gardening        => ("gardening", "gathering"),
        ItemSupplementSource.SkybuilderHandIn => ("skybuilder", "crafting"),
        ItemSupplementSource.Loot             => ("loot", "content"),
        ItemSupplementSource.CardPacks        => ("card_pack", "content"),
        ItemSupplementSource.Coffer           => ("coffer", "content"),
        ItemSupplementSource.PalaceOfTheDead
            or ItemSupplementSource.HeavenOnHigh
            or ItemSupplementSource.EurekaOrthos => ("deep_dungeon", "exploration"),
        ItemSupplementSource.Anemos
            or ItemSupplementSource.Pagos
            or ItemSupplementSource.Pyros
            or ItemSupplementSource.Hydatos    => ("eureka", "exploration"),
        ItemSupplementSource.Bozja
            or ItemSupplementSource.Logogram
            or ItemSupplementSource.PilgrimsTraverse => ("bozja", "exploration"),
        ItemSupplementSource.Oizys
            or ItemSupplementSource.Auxesia    => ("occult_crescent", "exploration"),
        _                                      => ("other", "crafting"),
    };

    private static string? ChanceDetail(uint? min, uint? max, double probability)
    {
        var qty  = QuantityRange(min, max);
        var prob = probability is > 0 and < 100 ? $"{probability.ToString("0.##", CultureInfo.InvariantCulture)}%" : null;
        return (qty, prob) switch
        {
            (null, null) => null,
            (not null, null) => qty,
            (null, not null) => prob,
            _ => $"{qty} ({prob})",
        };
    }

    private static string? QuantityDetail(uint quantity) => quantity > 1 ? $"x{quantity}" : null;

    private static string? QuantityRange(uint? min, uint? max)
    {
        var lo = min ?? 0u;
        var hi = max ?? 0u;
        if (lo == 0 && hi == 0) return null;
        return lo == hi ? (hi > 1 ? $"x{hi}" : null) : $"x{lo}-{hi}";
    }
}
