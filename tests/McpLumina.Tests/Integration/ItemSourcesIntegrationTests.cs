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
