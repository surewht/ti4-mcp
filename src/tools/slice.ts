import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadSystemsData } from "../data/loader.js";

interface SliceAnalysis {
  tileIds: number[];
  totalResources: number;
  totalInfluence: number;
  optimalValue: number;
  techSkips: string[];
  wormholes: string[];
  anomalies: string[];
  planets: { name: string; resources: number; influence: number; trait: string | string[] | null }[];
  legendaryPlanets: { name: string; ability: string }[];
  planetCount: number;
}

function analyzeSlice(tileIds: number[]): SliceAnalysis {
  const systems = loadSystemsData();
  let totalResources = 0;
  let totalInfluence = 0;
  const techSkips: string[] = [];
  const wormholes: string[] = [];
  const anomalies: string[] = [];
  const planets: SliceAnalysis["planets"] = [];
  const legendaryPlanets: SliceAnalysis["legendaryPlanets"] = [];

  for (const tileId of tileIds) {
    const tile = systems[String(tileId)];
    if (!tile) continue;

    if (tile.wormhole) wormholes.push(tile.wormhole);
    if (tile.anomaly) anomalies.push(tile.anomaly);

    for (const p of tile.planets) {
      totalResources += p.resources;
      totalInfluence += p.influence;
      planets.push({ name: p.name, resources: p.resources, influence: p.influence, trait: p.trait });
      if (p.specialties && p.specialties.length) techSkips.push(...p.specialties);
      if (p.legendary) {
        legendaryPlanets.push({
          name: p.name,
          ability: typeof p.legendary === "string" ? p.legendary : "yes",
        });
      }
    }

    if (tile.stations) {
      for (const s of tile.stations) {
        totalResources += s.resources;
        totalInfluence += s.influence;
      }
    }
  }

  return {
    tileIds,
    totalResources,
    totalInfluence,
    optimalValue: totalResources + totalInfluence,
    techSkips,
    wormholes,
    anomalies,
    planets,
    legendaryPlanets,
    planetCount: planets.length,
  };
}

export function registerSliceTools(server: McpServer) {
  server.registerTool(
    "analyze_slices",
    {
      description:
        "Analyze and compare Milty Draft slices. Each slice is an array of 5 tile IDs. Returns resource/influence totals, tech skips, wormholes, anomalies, legendary planets, and a ranking from best to worst.",
      inputSchema: z.object({
        slices: z
          .array(z.array(z.number()))
          .describe("Array of slices. Each slice is an array of tile IDs from Milty Draft (e.g. [[29,27,60,47,79], [32,73,20,48,68]])."),
      }),
    },
    async ({ slices }) => {
      if (slices.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No slices provided." }],
          isError: true,
        };
      }

      const analyses = slices.map((tileIds, index) => ({
        sliceIndex: index + 1,
        ...analyzeSlice(tileIds),
      }));

      // Rank slices: optimal value, then tech skips count, then planet count, then wormhole count
      const ranking = [...analyses].sort((a, b) => {
        if (b.optimalValue !== a.optimalValue) return b.optimalValue - a.optimalValue;
        if (b.techSkips.length !== a.techSkips.length) return b.techSkips.length - a.techSkips.length;
        if (b.planetCount !== a.planetCount) return b.planetCount - a.planetCount;
        return b.wormholes.length - a.wormholes.length;
      });

      const result = {
        slices: analyses,
        ranking: ranking.map((s) => ({
          sliceIndex: s.sliceIndex,
          optimalValue: s.optimalValue,
          summary: `${s.totalResources}R/${s.totalInfluence}I, ${s.techSkips.length} skip(s), ${s.planetCount} planet(s)${s.wormholes.length ? ", " + s.wormholes.join("+") + " wormhole(s)" : ""}${s.legendaryPlanets.length ? ", LEGENDARY" : ""}`,
        })),
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
