import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered, loadSystemsData } from "../data/loader.js";
import type { Planet } from "../data/types.js";

export function registerPlanetTools(server: McpServer) {
  server.registerTool(
    "list_planets",
    {
      description:
        "List TI4 planets, optionally filtered by trait or tech specialty.",
      inputSchema: z.object({
        expansions: ExpansionsParam,
        trait: z
          .enum(["cultural", "industrial", "hazardous"])
          .optional()
          .describe("Filter by planet trait"),
        tech_specialty: z
          .enum(["blue", "red", "yellow", "green"])
          .optional()
          .describe("Filter by tech specialty"),
      }),
    },
    async ({ expansions, trait, tech_specialty }) => {
      const exps = resolveExpansionsWithContext(expansions);
      let planets = loadFiltered<Planet>("planets.json", { expansions: exps });
      if (trait) planets = planets.filter((p) => p.trait === trait);
      if (tech_specialty)
        planets = planets.filter((p) => p.techSpecialty === tech_specialty);
      const summary = planets.map((p) => ({
        id: p.id,
        name: p.name,
        resources: p.resources,
        influence: p.influence,
        trait: p.trait ?? null,
        techSpecialty: p.techSpecialty ?? null,
        legendary: p.legendary ?? false,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_planet",
    {
      description: "Get detailed information about a TI4 planet by ID.",
      inputSchema: z.object({
        planet_id: z.string().describe("Planet identifier, e.g. 'mecatol-rex', 'jord'"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ planet_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const planets = loadFiltered<Planet>("planets.json", {
        expansions: exps,
      });
      const planet = planets.find((p) => p.id === planet_id);
      if (!planet) {
        return {
          content: [
            { type: "text", text: `Planet '${planet_id}' not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(planet, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_system",
    {
      description:
        "Get a TI4 system tile by tile number. Returns planets, wormholes, anomalies, and faction if home system.",
      inputSchema: z.object({
        tile_number: z
          .string()
          .describe("System tile number, e.g. '1', '18', '42'"),
      }),
    },
    async ({ tile_number }) => {
      const systems = loadSystemsData();
      const system = systems[tile_number];
      if (!system) {
        return {
          content: [
            {
              type: "text",
              text: `System tile '${tile_number}' not found.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ tileNumber: tile_number, ...system }, null, 2),
          },
        ],
      };
    },
  );
}
