import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { Faction } from "../data/types.js";

export function registerFactionTools(server: McpServer) {
  server.registerTool(
    "list_factions",
    {
      description: "List all available TI4 factions for the active expansions.",
      inputSchema: z.object({ expansions: ExpansionsParam }),
    },
    async ({ expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const factions = loadFiltered<Faction>("factions.json", {
        expansions: exps,
      });
      const summary = factions.map((f) => ({
        id: f.id,
        name: f.name,
        source: f.source,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_faction",
    {
      description:
        "Get detailed information about a TI4 faction including abilities, starting tech, units, leaders, and promissory note.",
      inputSchema: z.object({
        faction_id: z
          .string()
          .describe("Faction identifier, e.g. 'sol', 'hacan'"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ faction_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const factions = loadFiltered<Faction>("factions.json", {
        expansions: exps,
      });
      const faction = factions.find((f) => f.id === faction_id);
      if (!faction) {
        return {
          content: [
            { type: "text", text: `Faction '${faction_id}' not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(faction, null, 2) }],
      };
    },
  );
}
