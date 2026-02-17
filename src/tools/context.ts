import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionSchema } from "../config.js";
import { resolveExpansions } from "../config.js";
import {
  getGameContext,
  setGameContext,
  clearGameContext,
} from "../state.js";

export function registerContextTools(server: McpServer) {
  server.registerTool(
    "set_game_context",
    {
      description:
        "Set the current game setup context. Once set, tools like search, list_factions, get_tech_path etc. will automatically use these expansions and player count without needing to pass them explicitly.",
      inputSchema: z.object({
        expansions: z
          .array(ExpansionSchema)
          .describe("Active expansions for this game"),
        player_count: z.number().min(3).max(8).describe("Number of players"),
        players: z
          .array(
            z.object({
              seat: z.number().min(1).describe("1-based seat number"),
              faction_id: z.string().describe("Faction identifier"),
              slice_tile_ids: z
                .array(z.number())
                .optional()
                .describe("Tile IDs in this player's slice"),
            }),
          )
          .optional()
          .describe("Player faction assignments"),
        speaker: z
          .number()
          .optional()
          .describe("Seat number of the speaker"),
      }),
    },
    async ({ expansions, player_count, players, speaker }) => {
      const resolved = resolveExpansions(expansions);
      const ctx = {
        expansions: resolved,
        playerCount: player_count,
        players: (players ?? []).map((p) => ({
          seat: p.seat,
          factionId: p.faction_id,
          sliceTileIds: p.slice_tile_ids,
        })),
        speaker,
      };
      setGameContext(ctx);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(ctx, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "get_game_context",
    {
      description:
        "Get the current game setup context (expansions, player count, faction assignments, speaker).",
      inputSchema: z.object({}),
    },
    async () => {
      const ctx = getGameContext();
      if (!ctx) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No game context set. Use set_game_context to configure.",
            },
          ],
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(ctx, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "clear_game_context",
    {
      description: "Clear the current game setup context.",
      inputSchema: z.object({}),
    },
    async () => {
      clearGameContext();
      return {
        content: [
          { type: "text" as const, text: "Game context cleared." },
        ],
      };
    },
  );
}
