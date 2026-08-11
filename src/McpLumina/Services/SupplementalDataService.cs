using Lumina.Data;
using Lumina.Excel;
using Lumina.Excel.Sheets;
using LuminaSupplemental.Excel;
using LuminaSupplemental.Excel.Model;
using LuminaSupplemental.Excel.Services;
using Microsoft.Extensions.Logging;

namespace McpLumina.Services;

/// <summary>
/// Loads supplemental game data from LuminaSupplemental.Excel CSV assets at startup.
/// Pre-builds per-language name indices from Lumina sheets and ItemId-keyed reverse
/// maps so tool queries can resolve an item's provenance without rescanning on every call.
/// </summary>
public sealed class SupplementalDataService
{
    private readonly IReadOnlyList<MobDrop> _mobDrops;

    // ── ItemId → sources (reverse maps consumed by get_item_sources) ──────────
    private readonly ILookup<uint, uint> _mobsByItem;                 // itemId → BNpcNameId
    private readonly ILookup<uint, ItemSupplement> _derivationByItem; // itemId → derivation (desynth/reduction/…)
    private readonly ILookup<uint, DungeonChestItem> _chestByItem;    // itemId → dungeon coffer entry
    private readonly IReadOnlyDictionary<uint, DungeonChest> _chestById; // chest RowId → chest (for CFC)
    private readonly ILookup<uint, DungeonBossDrop> _bossDropByItem;
    private readonly ILookup<uint, DungeonBossChest> _bossChestByItem;
    private readonly ILookup<uint, DungeonDrop> _dungeonDropByItem;
    private readonly ILookup<uint, uint> _fatesByItem;                // itemId → FateId
    private readonly ILookup<uint, uint> _venturesByItem;             // itemId → RetainerTaskRandomId
    private readonly ILookup<uint, SubmarineDrop> _submarineByItem;
    private readonly ILookup<uint, uint> _airshipByItem;              // itemId → AirshipExplorationPointId
    private readonly ILookup<uint, QuestRequiredItem> _questUseByItem;

    // Vendors: itemId → shop RowIds (gil vs special kept apart), plus shop metadata.
    private readonly ILookup<uint, uint> _gilShopsByItem;             // itemId → gil shop RowId
    private readonly ILookup<uint, SpecialShopOffer> _specialShopsByItem; // itemId → special shop offer (+ cost)
    private readonly IReadOnlyDictionary<uint, string> _shopLabel;    // shop RowId → descriptive name
    private readonly ILookup<uint, uint> _npcsByShop;                 // shop RowId → ENpcResidentId

    // ── lang → id → name ─────────────────────────────────────────────────────
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _bnpcNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _itemNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _dutyNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _fateNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _npcNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _questNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _submarineNames;
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> _airshipNames;

    public SupplementalDataService(
        GameDataService gameData,
        ILogger<SupplementalDataService> logger)
    {
        var raw = gameData.Raw;

        _mobDrops = Load<MobDrop>(CsvLoader.MobDropResourceName, raw, logger);

        var derivations  = Load<ItemSupplement>(CsvLoader.ItemSupplementResourceName, raw, logger);
        var chests       = Load<DungeonChest>(CsvLoader.DungeonChestResourceName, raw, logger);
        var chestItems   = Load<DungeonChestItem>(CsvLoader.DungeonChestItemResourceName, raw, logger);
        var bossDrops    = Load<DungeonBossDrop>(CsvLoader.DungeonBossDropResourceName, raw, logger);
        var bossChests   = Load<DungeonBossChest>(CsvLoader.DungeonBossChestResourceName, raw, logger);
        var dungeonDrops = Load<DungeonDrop>(CsvLoader.DungeonDropItemResourceName, raw, logger);
        var fateItems    = Load<FateItem>(CsvLoader.FateItemResourceName, raw, logger);
        var ventures     = Load<RetainerVentureItem>(CsvLoader.RetainerVentureItemResourceName, raw, logger);
        var subDrops     = Load<SubmarineDrop>(CsvLoader.SubmarineDropResourceName, raw, logger);
        var airDrops     = Load<AirshipDrop>(CsvLoader.AirshipDropResourceName, raw, logger);
        var questItems   = Load<QuestRequiredItem>(CsvLoader.QuestRequiredItemResourceName, raw, logger);

        _mobsByItem       = _mobDrops.ToLookup(d => d.ItemId, d => d.BNpcNameId);
        _derivationByItem = derivations.ToLookup(d => d.ItemId);
        _chestByItem      = chestItems.ToLookup(c => c.ItemId);
        _chestById        = chests.GroupBy(c => c.RowId).ToDictionary(g => g.Key, g => g.First());
        _bossDropByItem   = bossDrops.ToLookup(d => d.ItemId);
        _bossChestByItem  = bossChests.ToLookup(d => d.ItemId);
        _dungeonDropByItem = dungeonDrops.ToLookup(d => d.ItemId);
        _fatesByItem      = fateItems.ToLookup(f => f.ItemId, f => f.FateId);
        _venturesByItem   = ventures.ToLookup(v => v.ItemId, v => v.RetainerTaskRandomId);
        _submarineByItem  = subDrops.ToLookup(d => d.ItemId);
        _airshipByItem    = airDrops.ToLookup(d => d.ItemId, d => d.AirshipExplorationPointId);
        _questUseByItem   = questItems.ToLookup(q => q.ItemId);

        (_gilShopsByItem, _specialShopsByItem, _shopLabel, _npcsByShop) = BuildVendorIndex(raw, logger);

        _bnpcNames  = BuildNameIndices<BNpcName>(gameData, r => r.Singular.ToString(), logger, "BNpcName");
        _itemNames  = BuildNameIndices<Item>(gameData, r => r.Name.ToString(), logger, "Item");
        _dutyNames  = BuildNameIndices<ContentFinderCondition>(gameData, r => r.Name.ToString(), logger, "ContentFinderCondition");
        _fateNames  = BuildNameIndices<Fate>(gameData, r => r.Name.ToString(), logger, "Fate");
        _npcNames   = BuildNameIndices<ENpcResident>(gameData, r => r.Singular.ToString(), logger, "ENpcResident");
        _questNames = BuildNameIndices<Quest>(gameData, r => r.Name.ToString(), logger, "Quest");
        _submarineNames = BuildNameIndices<SubmarineExploration>(gameData, r => r.Destination.ToString(), logger, "SubmarineExploration");
        _airshipNames   = BuildNameIndices<AirshipExplorationPoint>(gameData, r => r.Name.ToString(), logger, "AirshipExplorationPoint");

        logger.LogInformation(
            "SupplementalDataService ready. MobDrops={Drops}, Derivations={Der}, Vendors={Shops}, langs={Langs}",
            _mobDrops.Count, derivations.Count, _shopLabel.Count, string.Join(",", _bnpcNames.Keys));
    }

    // ── get_mob_drops surface (unchanged) ─────────────────────────────────────

    public IReadOnlyList<MobDrop> MobDrops => _mobDrops;

    public IReadOnlyDictionary<uint, string> GetBNpcNames(string lang) => Pick(_bnpcNames, lang);
    public IReadOnlyDictionary<uint, string> GetItemNames(string lang) => Pick(_itemNames, lang);

    // ── get_item_sources surface ──────────────────────────────────────────────

    public IEnumerable<uint> GetMobsDropping(uint itemId)          => _mobsByItem[itemId];
    public IEnumerable<ItemSupplement> GetDerivations(uint itemId) => _derivationByItem[itemId];
    public IEnumerable<DungeonBossDrop> GetBossDrops(uint itemId)  => _bossDropByItem[itemId];
    public IEnumerable<DungeonBossChest> GetBossChests(uint itemId) => _bossChestByItem[itemId];
    public IEnumerable<DungeonDrop> GetDungeonDrops(uint itemId)   => _dungeonDropByItem[itemId];
    public IEnumerable<uint> GetFates(uint itemId)                 => _fatesByItem[itemId];
    public IEnumerable<uint> GetRetainerVentures(uint itemId)      => _venturesByItem[itemId];
    public IEnumerable<SubmarineDrop> GetSubmarineDrops(uint itemId) => _submarineByItem[itemId];
    public IEnumerable<uint> GetAirshipDrops(uint itemId)          => _airshipByItem[itemId];
    public IEnumerable<QuestRequiredItem> GetQuestUses(uint itemId) => _questUseByItem[itemId];

    /// <summary>Dungeon coffer entries for an item, paired with the duty (ContentFinderCondition) they sit in.</summary>
    public IEnumerable<(DungeonChestItem Entry, uint CfcId)> GetDungeonChests(uint itemId)
    {
        foreach (var ci in _chestByItem[itemId])
        {
            var cfc = _chestById.TryGetValue(ci.ChestId, out var chest) ? chest.ContentFinderConditionId : 0u;
            yield return (ci, cfc);
        }
    }

    public IEnumerable<uint> GetGilShops(uint itemId)                => _gilShopsByItem[itemId];
    public IEnumerable<SpecialShopOffer> GetSpecialShops(uint itemId) => _specialShopsByItem[itemId];
    public string? GetShopLabel(uint shopId)                         => _shopLabel.TryGetValue(shopId, out var n) ? n : null;
    public IEnumerable<uint> GetShopNpcs(uint shopId)                => _npcsByShop[shopId];

    public IReadOnlyDictionary<uint, string> GetDutyNames(string lang)      => Pick(_dutyNames, lang);
    public IReadOnlyDictionary<uint, string> GetFateNames(string lang)      => Pick(_fateNames, lang);
    public IReadOnlyDictionary<uint, string> GetNpcNames(string lang)       => Pick(_npcNames, lang);
    public IReadOnlyDictionary<uint, string> GetQuestNames(string lang)     => Pick(_questNames, lang);
    public IReadOnlyDictionary<uint, string> GetSubmarineNames(string lang) => Pick(_submarineNames, lang);
    public IReadOnlyDictionary<uint, string> GetAirshipNames(string lang)   => Pick(_airshipNames, lang);

    // ── Private helpers ───────────────────────────────────────────────────────

    private static IReadOnlyDictionary<uint, string> Pick(
        IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> byLang, string lang) =>
        byLang.TryGetValue(lang, out var idx) ? idx
        : byLang.TryGetValue("en", out var en) ? en
        : new Dictionary<uint, string>();

    private static List<T> Load<T>(string resource, Lumina.GameData raw, ILogger logger)
        where T : ICsv, new()
    {
        try
        {
            var rows = CsvLoader.LoadResource<T>(resource, includesHeaders: true, out _, out _, raw, Language.English);
            logger.LogInformation("Loaded {Count} {Type} rows from LuminaSupplemental", rows.Count, typeof(T).Name);
            return rows;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to load {Resource}; that source will be unavailable", resource);
            return [];
        }
    }

    /// <summary>
    /// Scans the game's gil shops and special (currency) shops to map every purchasable item
    /// to the shops that sell it, then joins shop display names and vendor NPCs from the
    /// LuminaSupplemental ShopName / ENpcShop datasets. Best-effort: guarded so a schema
    /// surprise degrades vendor coverage rather than failing startup.
    /// </summary>
    private static (ILookup<uint, uint>, ILookup<uint, SpecialShopOffer>, IReadOnlyDictionary<uint, string>, ILookup<uint, uint>) BuildVendorIndex(
        Lumina.GameData raw, ILogger logger)
    {
        var gil     = new List<(uint ItemId, uint ShopId)>();
        var special = new List<(uint ItemId, SpecialShopOffer Offer)>();

        try
        {
            foreach (var shop in raw.Excel.GetSubrowSheet<GilShopItem>())
                foreach (var gi in shop)
                    if (gi.Item.RowId != 0)
                        gil.Add((gi.Item.RowId, shop.RowId));
        }
        catch (Exception ex) { logger.LogWarning(ex, "GilShopItem scan failed; gil vendors unavailable"); }

        try
        {
            foreach (var shop in raw.Excel.GetSheet<SpecialShop>())
                foreach (var entry in shop.Item)
                {
                    // Each entry pairs the items you receive with the items you give (the cost).
                    var cost = new List<CostItem>();
                    foreach (var give in entry.ItemCosts)
                        if (give.ItemCost.RowId != 0 && give.CurrencyCost > 0)
                            cost.Add(new CostItem(give.ItemCost.RowId, give.CurrencyCost));

                    var offer = new SpecialShopOffer(shop.RowId, cost);
                    foreach (var recv in entry.ReceiveItems)
                        if (recv.Item.RowId != 0)
                            special.Add((recv.Item.RowId, offer));
                }
        }
        catch (Exception ex) { logger.LogWarning(ex, "SpecialShop scan failed; special vendors unavailable"); }

        var gilByItem     = gil.Distinct().ToLookup(x => x.ItemId, x => x.ShopId);
        var specialByItem = special.ToLookup(x => x.ItemId, x => x.Offer);

        var shopLabel = new Dictionary<uint, string>();
        foreach (var sn in Load<ShopName>(CsvLoader.ShopNameResourceName, raw, logger))
            shopLabel.TryAdd(sn.ShopId, sn.Name);

        // Resolve which NPC(s) offer each shop. The authoritative source is the game's
        // ENpcBase sheet, whose ENpcData references point at shop rows; we keep only refs
        // that match a shop we actually indexed. Merge in the curated LuminaSupplemental
        // ENpcShop dataset for anything ENpcBase does not cover.
        var shopIds = new HashSet<uint>(gil.Select(x => x.ShopId).Concat(special.Select(x => x.Offer.ShopId)));
        var npcShop = new List<(uint ShopId, uint NpcId)>();

        try
        {
            foreach (var enpc in raw.Excel.GetSheet<ENpcBase>())
                foreach (var dataRef in enpc.ENpcData)
                    if (dataRef.RowId != 0 && shopIds.Contains(dataRef.RowId))
                        npcShop.Add((dataRef.RowId, enpc.RowId));
        }
        catch (Exception ex) { logger.LogWarning(ex, "ENpcBase shop scan failed; vendor NPC names limited"); }

        foreach (var e in Load<ENpcShop>(CsvLoader.ENpcShopResourceName, raw, logger))
            npcShop.Add((e.ShopId, e.ENpcResidentId));

        var npcsByShop = npcShop.Distinct().ToLookup(x => x.ShopId, x => x.NpcId);

        return (gilByItem, specialByItem, shopLabel, npcsByShop);
    }

    private static IReadOnlyDictionary<string, IReadOnlyDictionary<uint, string>> BuildNameIndices<T>(
        GameDataService gameData,
        Func<T, string> nameSelector,
        ILogger logger,
        string sheetLabel)
        where T : struct, IExcelRow<T>
    {
        var result = new Dictionary<string, IReadOnlyDictionary<uint, string>>();

        foreach (var langCode in gameData.Languages.AvailableLanguages)
        {
            var lumLang = LanguageService.ToLuminaLanguage(langCode);
            var idx     = new Dictionary<uint, string>();

            try
            {
                foreach (var row in gameData.Raw.Excel.GetSheet<T>(lumLang))
                {
                    var name = nameSelector(row);
                    if (!string.IsNullOrWhiteSpace(name))
                        idx[row.RowId] = name;
                }
                result[langCode] = idx;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not build {Sheet} index for language {Lang}", sheetLabel, langCode);
            }
        }

        return result;
    }
}

/// <summary>An item and quantity that must be given to complete a special-shop exchange.</summary>
public sealed record CostItem(uint ItemId, uint Count);

/// <summary>A special (currency) shop that offers an item, along with what it costs.</summary>
public sealed record SpecialShopOffer(uint ShopId, IReadOnlyList<CostItem> Cost);
