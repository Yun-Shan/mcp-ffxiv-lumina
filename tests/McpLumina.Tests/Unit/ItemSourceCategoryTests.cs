using LuminaSupplemental.Excel.Model;
using McpLumina.Tools;
using Xunit;

namespace McpLumina.Tests.Unit;

/// <summary>
/// Pure taxonomy checks for get_item_sources categories. These run without a game install,
/// so CI can catch a category that is emitted but not filterable (the gathering/gathering trap).
/// </summary>
public sealed class ItemSourceCategoryTests
{
    [Fact]
    public void EverySupplementSource_MapsToAFilterableCategory()
    {
        foreach (ItemSupplementSource source in Enum.GetValues<ItemSupplementSource>())
        {
            var (_, category) = SupplementalTools.MapSupplementSource(source);
            Assert.Contains(category, SupplementalTools.SourceCategories);
        }
    }

    [Fact]
    public void GardeningMapsToGathering_AndGatheringIsFilterable()
    {
        var (type, category) = SupplementalTools.MapSupplementSource(ItemSupplementSource.Gardening);

        Assert.Equal("gardening", type);
        Assert.Equal("gathering", category);
        Assert.Contains("gathering", SupplementalTools.SourceCategories);
    }
}
