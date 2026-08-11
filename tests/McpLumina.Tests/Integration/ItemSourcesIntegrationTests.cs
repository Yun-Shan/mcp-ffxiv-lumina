using System.Text.Json;
using McpLumina.Models.Responses;
using McpLumina.Services;
using McpLumina.Tools;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace McpLumina.Tests.Integration;

[Trait("Category", "Integration")]
public sealed class ItemSourcesIntegrationTests : IntegrationTestBase
{
    // Stable fixtures verified against patch 7.55 data:
    private const int GrenadeAshItemId = 5526;  // dropped by "napalm" (BNpcName 1749)
    private const int NapalmBNpcNameId = 1749;
    private const int PotionItemId     = 4551;  // sold by gil vendors (priceMid 28)
    private const int WolfMarkItemId   = 25;    // offered by a special (currency) shop
    private const int ForagerHatItemId = 7522;  // has several distinct exchanges in one special shop
    private const int SparklerItemId   = 5893;  // a special exchange grants a stack (ReceiveCount > 1)
    private const int ZoniItemId       = 4680;  // sold by shops that carry a ShopName label + multiple NPCs

    private static readonly JsonSerializerOptions DeserializeOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly SupplementalDataService? _supplemental;
    private readonly SupplementalTools?       _tools;

    public ItemSourcesIntegrationTests()
    {
        if (ShouldSkip) return;

        _supplemental = new SupplementalDataService(GameData, NullLogger<SupplementalDataService>.Instance);
        _tools        = new SupplementalTools(_supplemental, GameData);
    }

    [SkippableFact]
    public void ByItemId_GrenadeAsh_ContainsNapalmMobDrop()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: GrenadeAshItemId);

        Assert.True(response.ItemFound, "Grenade Ash should resolve.");
        Assert.Contains("grenade ash", response.ItemName["en"], StringComparison.OrdinalIgnoreCase);

        var mobDrop = Assert.Single(response.Sources,
            s => s.SourceType == "mob_drop" && s.SourceId == NapalmBNpcNameId);
        Assert.Equal("drop", mobDrop.Category);
        Assert.Equal("napalm", mobDrop.SourceName!["en"], ignoreCase: true);
    }

    [SkippableFact]
    public void ByItemId_Potion_ContainsGilVendor()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: PotionItemId, limit: 200);

        Assert.True(response.ItemFound);
        var vendor = Assert.Single(response.Sources.Where(s => s.SourceType == "gil_vendor").Take(1));
        Assert.Equal("vendor", vendor.Category);
        Assert.NotNull(vendor.Detail);
        Assert.Contains("gil", vendor.Detail!, StringComparison.OrdinalIgnoreCase);
    }

    [SkippableFact]
    public void ByQuery_ResolvesFirstMatchingItem()
    {
        SkipIfNoGamePath();

        var response = Sources(query: "grenade ash");

        Assert.True(response.ItemFound);
        Assert.Contains("grenade ash", response.ItemName["en"], StringComparison.OrdinalIgnoreCase);
    }

    [SkippableFact]
    public void MissingIdentifier_ReturnsValidationError()
    {
        SkipIfNoGamePath();

        var json = _tools!.GetItemSources(null, null, null, null, null);

        Assert.Contains("ValidationError", json, StringComparison.OrdinalIgnoreCase);
    }

    [SkippableFact]
    public void UnknownItemId_ReturnsEmptySources()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: 99_999_999);

        Assert.False(response.ItemFound);
        Assert.Equal(0, response.TotalSources);
        Assert.Empty(response.Sources);
    }

    [SkippableFact]
    public void CategoryCounts_SumToTotalSources()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: PotionItemId, limit: 1);

        Assert.Equal(response.TotalSources, response.CategoryCounts.Values.Sum());
    }

    [SkippableFact]
    public void Pagination_TotalStable_PageBounded()
    {
        SkipIfNoGamePath();

        var page0 = Sources(itemId: PotionItemId, limit: 3, offset: 0);
        var page1 = Sources(itemId: PotionItemId, limit: 3, offset: 3);

        Assert.Equal(page0.TotalSources, page1.TotalSources);
        Assert.True(page0.Sources.Length <= 3);
        Assert.True(page1.Sources.Length <= 3);
    }

    [SkippableFact]
    public void MultiLanguage_LocalisesItemAndSourceNames()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: GrenadeAshItemId, langs: ["en", "ja"]);

        Assert.True(response.ItemName.ContainsKey("ja"), "Item name should include Japanese.");

        var mobDrop = Assert.Single(response.Sources,
            s => s.SourceType == "mob_drop" && s.SourceId == NapalmBNpcNameId);
        Assert.True(mobDrop.SourceName!.ContainsKey("ja"), "Mob name should include Japanese.");
        Assert.False(string.IsNullOrWhiteSpace(mobDrop.SourceName["ja"]));
    }

    [SkippableFact]
    public void SpecialVendor_CarriesFormattedCurrencyCost()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: WolfMarkItemId, limit: 200);

        var special = Assert.Single(response.Sources.Where(s => s.SourceType == "special_vendor").Take(1));
        Assert.Equal("vendor", special.Category);
        // Cost is rendered as "<count>x <currency name>", e.g. "1x Wolf Collar".
        Assert.NotNull(special.Detail);
        Assert.Matches(@"\d+x \S", special.Detail!);
    }

    [SkippableFact]
    public void SpecialVendor_PreservesDistinctOffersInSameShop()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: ForagerHatItemId, limit: 200);

        // Multiple distinct exchanges of the same item in one shop must survive (not collapsed to one).
        var specialDetails = response.Sources
            .Where(s => s.SourceType == "special_vendor")
            .GroupBy(s => s.SourceId)
            .Select(g => g.Select(x => x.Detail).Distinct().Count())
            .DefaultIfEmpty(0)
            .Max();

        Assert.True(specialDetails >= 2,
            $"Expected a shop with multiple distinct exchanges, saw at most {specialDetails}.");
    }

    [SkippableFact]
    public void SpecialVendor_ReportsReceivedQuantity()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: SparklerItemId, limit: 200);

        // A stack-granting exchange renders as "x<n> for <cost>".
        Assert.Contains(response.Sources,
            s => s.SourceType == "special_vendor" && s.Detail is not null &&
                 System.Text.RegularExpressions.Regex.IsMatch(s.Detail, @"^x\d+ for "));
    }

    [SkippableFact]
    public void Vendor_ShopLabel_IsExposedAsEnglishContextOnly()
    {
        SkipIfNoGamePath();

        // Request Japanese: the shop's English descriptive label must still sit under the "en" key,
        // never mislabelled as the requested primary language.
        var response = Sources(itemId: ZoniItemId, category: "vendor", langs: ["ja"], limit: 200);

        var contexts = response.Sources
            .Where(s => s.Context is not null)
            .Select(s => s.Context!)
            .ToArray();

        Assert.NotEmpty(contexts);  // guard against a vacuous pass
        Assert.All(contexts, ctx => Assert.Equal(new[] { "en" }, ctx.Keys.ToArray()));
    }

    [SkippableFact]
    public void Vendor_MultiNpcShop_ExposesStableShopIdWithDistinctNpcIds()
    {
        SkipIfNoGamePath();

        var response = Sources(itemId: ZoniItemId, category: "vendor", limit: 200);

        // A shop staffed by several NPCs yields several entries sharing one sourceId (the shop),
        // each with its own npcId.
        var multi = response.Sources
            .Where(s => s.SourceId is not null && s.NpcId is not null)
            .GroupBy(s => s.SourceId)
            .FirstOrDefault(g => g.Select(s => s.NpcId).Distinct().Count() >= 2);

        Assert.NotNull(multi);
    }

    [SkippableFact]
    public void ExplorationNameIndices_ResolveDestinations()
    {
        SkipIfNoGamePath();

        // Submarine/airship sector ids resolve to localised destination names.
        var subNames = _supplemental!.GetSubmarineNames("en");
        Assert.NotEmpty(subNames);
        Assert.Contains(subNames, kv => !string.IsNullOrWhiteSpace(kv.Value));

        var airNames = _supplemental.GetAirshipNames("en");
        Assert.NotEmpty(airNames);
    }

    [SkippableFact]
    public void CategoryFilter_RestrictsSources_ButKeepsFullBreakdown()
    {
        SkipIfNoGamePath();

        var all      = Sources(itemId: GrenadeAshItemId, limit: 200);
        var dropOnly = Sources(itemId: GrenadeAshItemId, category: "drop", limit: 200);

        Assert.Equal("drop", dropOnly.Category);
        Assert.All(dropOnly.Sources, s => Assert.Equal("drop", s.Category));
        // Filtered total equals the drop count; categoryCounts still reports every category.
        Assert.Equal(all.CategoryCounts["drop"], dropOnly.TotalSources);
        Assert.Equal(all.CategoryCounts, dropOnly.CategoryCounts);
        Assert.True(dropOnly.CategoryCounts.Count > 1, "Full breakdown should survive filtering.");
    }

    [SkippableFact]
    public void CategoryFilter_Invalid_ReturnsValidationError()
    {
        SkipIfNoGamePath();

        var json = _tools!.GetItemSources(GrenadeAshItemId, null, "bogus", null, null, null);

        Assert.Contains("ValidationError", json, StringComparison.OrdinalIgnoreCase);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private ItemSourcesResponse Sources(
        int? itemId = null, string? query = null, string? category = null,
        string[]? langs = null, int? limit = null, int? offset = null)
    {
        var json = _tools!.GetItemSources(
            itemId, query, category, limit, offset,
            langs is null ? null : string.Join(",", langs));
        return JsonSerializer.Deserialize<ItemSourcesResponse>(json, DeserializeOpts)!;
    }
}
