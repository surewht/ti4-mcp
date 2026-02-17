import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { Faction, StrategyCard } from "../data/types.js";
import { getGameContext } from "../state.js";

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function registerGameSetupTools(server: McpServer) {
  server.registerTool(
    "setup_game",
    {
      description:
        "Generate a game setup for N players. Returns a random faction draft pool, strategy cards, and speaker order. The LLM can then reason about balance and strategy. Player count and expansions default to game context if set.",
      inputSchema: z.object({
        player_count: z
          .number()
          .min(3)
          .max(8)
          .optional()
          .describe("Number of players. Defaults to game context if set."),
        faction_pool_size: z
          .number()
          .optional()
          .describe(
            "How many factions in the draft pool. Default: player_count + 2",
          ),
        expansions: ExpansionsParam,
      }),
    },
    async ({ player_count, faction_pool_size, expansions }) => {
      const ctx = getGameContext();
      const effectivePlayerCount = player_count ?? ctx?.playerCount;
      if (!effectivePlayerCount) {
        return {
          content: [
            {
              type: "text",
              text: "player_count is required (no game context set).",
            },
          ],
          isError: true,
        };
      }

      const exps = resolveExpansionsWithContext(expansions);
      const factions = loadFiltered<Faction>("factions.json", {
        expansions: exps,
      });
      const strategyCards = loadFiltered<StrategyCard>("strategy-cards.json", {
        expansions: exps,
      });

      if (factions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No faction data available. Data files need to be populated.",
            },
          ],
        };
      }

      const poolSize = Math.min(
        faction_pool_size ?? effectivePlayerCount + 2,
        factions.length,
      );

      const shuffledFactions = shuffle(factions);
      const factionPool = shuffledFactions.slice(0, poolSize).map((f) => ({
        id: f.id,
        name: f.name,
        commodities: f.commodities,
        startingTech: f.startingTech,
        abilities: f.abilities.map((a) => a.name),
      }));

      const speakerOrder = shuffle(
        Array.from({ length: effectivePlayerCount }, (_, i) => `Player ${i + 1}`),
      );

      const result = {
        playerCount: effectivePlayerCount,
        factionPool,
        strategyCards: strategyCards.sort((a, b) => a.initiative - b.initiative),
        speakerOrder,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
