import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSystemsData } from "../data/loader.js";
import { getGameContext } from "../state.js";

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function registerMapTools(server: McpServer) {
  server.registerTool(
    "suggest_map",
    {
      description:
        "Suggest a random map tile selection for a given player count. Returns blue and red tiles randomly selected from the available pool. For proper draft-based maps, use Milty Draft and then analyze_slices.",
      inputSchema: z.object({
        player_count: z
          .number()
          .min(3)
          .max(8)
          .optional()
          .describe("Number of players. Defaults to game context if set."),
      }),
    },
    async ({ player_count }) => {
      const ctx = getGameContext();
      const effectivePlayerCount = player_count ?? ctx?.playerCount;
      if (!effectivePlayerCount) {
        return {
          content: [
            { type: "text", text: "player_count is required (no game context set)." },
          ],
          isError: true,
        };
      }
      const systems = loadSystemsData();

      const blueTiles: { tileId: string; planets: string[] }[] = [];
      const redTiles: { tileId: string; anomaly?: string | null; wormhole?: string | null }[] = [];

      for (const [tileId, tile] of Object.entries(systems)) {
        if (tile.nonDraftable) continue;
        if (tile.type === "blue") {
          blueTiles.push({
            tileId,
            planets: tile.planets.map((p) => p.name),
          });
        } else if (tile.type === "red") {
          redTiles.push({ tileId, anomaly: tile.anomaly, wormhole: tile.wormhole });
        }
      }

      if (blueTiles.length === 0 && redTiles.length === 0) {
        return {
          content: [
            { type: "text", text: "No system tile data available." },
          ],
          isError: true,
        };
      }

      const shuffledBlue = shuffle(blueTiles);
      const shuffledRed = shuffle(redTiles);

      const tileNeeds: Record<number, { blue: number; red: number }> = {
        3: { blue: 15, red: 3 },
        4: { blue: 16, red: 4 },
        5: { blue: 18, red: 4 },
        6: { blue: 18, red: 6 },
        7: { blue: 21, red: 6 },
        8: { blue: 24, red: 6 },
      };

      const needs = tileNeeds[effectivePlayerCount] ?? { blue: 18, red: 6 };

      const result = {
        playerCount: effectivePlayerCount,
        blueTiles: shuffledBlue.slice(0, needs.blue),
        redTiles: shuffledRed.slice(0, needs.red),
        note: "Tiles are randomly selected. For balanced draft-based maps, use Milty Draft and then the analyze_slices tool.",
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
