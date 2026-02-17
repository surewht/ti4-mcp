import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered, loadSystemsData } from "../data/loader.js";
import type {
  Faction,
  Technology,
  Objective,
} from "../data/types.js";

export function registerStrategyTools(server: McpServer) {
  server.registerTool(
    "get_strategy_notes",
    {
      description:
        "Get structured data to help reason about faction strategy. Returns starting position analysis, key technologies, home system economy, and objectives that align with the faction's strengths.",
      inputSchema: z.object({
        faction_id: z.string().describe("Faction identifier"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ faction_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const config = { expansions: exps };

      const factions = loadFiltered<Faction>("factions.json", config);
      const faction = factions.find((f) => f.id === faction_id);
      if (!faction) {
        return {
          content: [
            { type: "text", text: `Faction '${faction_id}' not found.` },
          ],
          isError: true,
        };
      }

      const techs = loadFiltered<Technology>("technologies.json", config);
      const objectives = loadFiltered<Objective>("objectives.json", config);
      const systems = loadSystemsData();

      // Find home system tile by faction name
      const homeEntry = Object.entries(systems).find(
        ([, tile]) => tile.faction && tile.faction.toLowerCase().includes(faction.name.toLowerCase().split(" ").pop()!),
      );
      const homePlanets = homeEntry ? homeEntry[1].planets : [];
      const totalResources = homePlanets.reduce(
        (sum, p) => sum + p.resources,
        0,
      );
      const totalInfluence = homePlanets.reduce(
        (sum, p) => sum + p.influence,
        0,
      );

      const startingTechDetails = techs.filter((t) =>
        faction.startingTech.includes(t.id),
      );
      const startingColors = startingTechDetails
        .filter((t) => t.color)
        .map((t) => t.color!);

      const factionTechs = techs.filter((t) => t.faction === faction_id);

      const totalUnits = Object.values(faction.startingUnits).reduce(
        (sum, count) => sum + count,
        0,
      );

      const stage1 = objectives.filter((o) => o.type === "public" && o.stage === 1);
      const stage2 = objectives.filter((o) => o.type === "public" && o.stage === 2);

      const result = {
        faction: {
          name: faction.name,
          id: faction.id,
          commodities: faction.commodities,
          abilities: faction.abilities,
        },
        homeSystem: {
          totalResources,
          totalInfluence,
          planets: homePlanets.map((p) => ({
            name: p.name,
            resources: p.resources,
            influence: p.influence,
            techSpecialty: p.specialties,
          })),
        },
        startingPosition: {
          techCount: faction.startingTech.length,
          startingTech: startingTechDetails.map((t) => ({
            name: t.name,
            color: t.color,
          })),
          techColorAdvantage: startingColors,
          totalUnits,
          unitBreakdown: faction.startingUnits,
        },
        factionTechs: factionTechs.map((t) => ({
          name: t.name,
          prerequisites: t.prerequisites,
          description: t.description,
        })),
        leaders: faction.leaders ?? [],
        mech: faction.mech ?? null,
        objectivePool: {
          stage1Count: stage1.length,
          stage2Count: stage2.length,
          stage1: stage1.map((o) => ({
            name: o.name,
            description: o.description,
          })),
          stage2: stage2.map((o) => ({
            name: o.name,
            description: o.description,
          })),
        },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
