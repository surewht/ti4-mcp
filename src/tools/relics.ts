import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { Relic, ExploreCard } from "../data/types.js";

export function registerRelicTools(server: McpServer) {
  server.registerTool(
    "list_relics",
    {
      description: "List all TI4 relics for the active expansions.",
      inputSchema: z.object({ expansions: ExpansionsParam }),
    },
    async ({ expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const relics = loadFiltered<Relic>("relics.json", { expansions: exps });
      return {
        content: [{ type: "text", text: JSON.stringify(relics, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_relic",
    {
      description: "Get a specific TI4 relic by ID.",
      inputSchema: z.object({
        relic_id: z.string().describe("Relic identifier"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ relic_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const relics = loadFiltered<Relic>("relics.json", { expansions: exps });
      const relic = relics.find((r) => r.id === relic_id);
      if (!relic) {
        return {
          content: [
            { type: "text", text: `Relic '${relic_id}' not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(relic, null, 2) }],
      };
    },
  );

  server.registerTool(
    "list_explore_cards",
    {
      description:
        "List TI4 exploration cards, optionally filtered by trait (cultural/industrial/hazardous/frontier).",
      inputSchema: z.object({
        expansions: ExpansionsParam,
        trait: z
          .enum(["cultural", "industrial", "hazardous", "frontier"])
          .optional()
          .describe("Filter by exploration trait"),
      }),
    },
    async ({ expansions, trait }) => {
      const exps = resolveExpansionsWithContext(expansions);
      let cards = loadFiltered<ExploreCard>("explores.json", {
        expansions: exps,
      });
      if (trait) cards = cards.filter((c) => c.trait === trait);
      return {
        content: [{ type: "text", text: JSON.stringify(cards, null, 2) }],
      };
    },
  );
}
