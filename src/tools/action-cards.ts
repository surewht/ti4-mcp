import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { ActionCard } from "../data/types.js";

export function registerActionCardTools(server: McpServer) {
  server.registerTool(
    "list_action_cards",
    {
      description:
        "List TI4 action cards, optionally filtered by play timing keyword.",
      inputSchema: z.object({
        expansions: ExpansionsParam,
        timing_keyword: z
          .string()
          .optional()
          .describe(
            "Filter by play timing keyword (e.g. 'combat', 'agenda', 'tactical')",
          ),
      }),
    },
    async ({ expansions, timing_keyword }) => {
      const exps = resolveExpansionsWithContext(expansions);
      let cards = loadFiltered<ActionCard>("action-cards.json", {
        expansions: exps,
      });
      if (timing_keyword) {
        const kw = timing_keyword.toLowerCase();
        cards = cards.filter(
          (c) =>
            c.playTiming.toLowerCase().includes(kw) ||
            c.description.toLowerCase().includes(kw),
        );
      }
      return {
        content: [{ type: "text", text: JSON.stringify(cards, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_action_card",
    {
      description: "Get a specific TI4 action card by ID.",
      inputSchema: z.object({
        card_id: z.string().describe("Action card identifier"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ card_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const cards = loadFiltered<ActionCard>("action-cards.json", {
        expansions: exps,
      });
      const card = cards.find((c) => c.id === card_id);
      if (!card) {
        return {
          content: [
            { type: "text", text: `Action card '${card_id}' not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
    },
  );
}
