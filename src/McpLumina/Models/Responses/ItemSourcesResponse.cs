namespace McpLumina.Models.Responses;

/// <summary>
/// Aggregated "how do I obtain this item" response. Unifies every provenance the
/// LuminaSupplemental datasets and game shop sheets know about for a single item:
/// mob drops, crafting-material derivation, dungeon loot, FATEs, exploration
/// (ventures / submarine / airship), vendors (gil and special-currency), and the
/// quests that consume it.
/// </summary>
public sealed record ItemSourcesResponse : BaseResponse
{
    public uint ItemId                     { get; init; }
    public Dictionary<string, string> ItemName { get; init; } = new();
    public bool ItemFound                  { get; init; }

    /// <summary>The applied category filter, or null when all categories are returned.</summary>
    public string? Category                { get; init; }

    public string[] LanguagesRequested     { get; init; } = [];
    public string[] LanguagesReturned      { get; init; } = [];
    public bool FallbackUsed               { get; init; }

    /// <summary>Count of sources per coarse category (drop, crafting, dungeon, …), before paging.</summary>
    public Dictionary<string, int> CategoryCounts { get; init; } = new();

    public int TotalSources                { get; init; }
    public int Offset                      { get; init; }
    public int Limit                       { get; init; }
    public ItemSourceEntry[] Sources       { get; init; } = [];
}

/// <summary>
/// One way to obtain (or, for quests, one consumer of) the queried item.
/// A uniform shape keeps the many heterogeneous source datasets in a single list;
/// only the fields relevant to a given <see cref="SourceType"/> are populated.
/// </summary>
public sealed record ItemSourceEntry
{
    /// <summary>Fine-grained source, e.g. "mob_drop", "desynth", "dungeon_chest", "gil_vendor".</summary>
    public required string SourceType { get; init; }

    /// <summary>Coarse group for filtering: drop | crafting | dungeon | content | exploration | vendor | quest.</summary>
    public required string Category { get; init; }

    /// <summary>Row id of the joined entity (mob, source item, duty CFC, FATE, shop, quest), when applicable. For vendors this is the shop's row id (stable regardless of which NPC is named).</summary>
    public uint? SourceId { get; init; }

    /// <summary>For vendor sources, the specific merchant NPC (ENpcResident) row id, when one is known. Null otherwise.</summary>
    public uint? NpcId { get; init; }

    /// <summary>Localised display name of the source entity (mob / source item / duty / FATE / NPC / quest).</summary>
    public Dictionary<string, string>? SourceName { get; init; }

    /// <summary>Optional secondary context, e.g. the duty a coffer sits in, or a zone. Localised.</summary>
    public Dictionary<string, string>? Context { get; init; }

    /// <summary>Free-form specifics: drop probability, quantity, gil price, currency cost, etc.</summary>
    public string? Detail { get; init; }
}
