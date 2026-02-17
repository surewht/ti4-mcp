import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExpansionsParam, resolveExpansionsWithContext } from "../config.js";
import { loadFiltered } from "../data/loader.js";
import type { Technology, Faction } from "../data/types.js";

export function registerTechTools(server: McpServer) {
  server.registerTool(
    "get_tech",
    {
      description: "Get details about a specific technology.",
      inputSchema: z.object({
        tech_id: z.string().describe("Technology identifier"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ tech_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const techs = loadFiltered<Technology>("technologies.json", {
        expansions: exps,
      });
      const tech = techs.find((t) => t.id === tech_id);
      if (!tech) {
        return {
          content: [
            { type: "text", text: `Technology '${tech_id}' not found.` },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(tech, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_tech_path",
    {
      description:
        "Get all available technologies for a faction organized by color and showing prerequisite chains. Includes both generic and faction-specific techs.",
      inputSchema: z.object({
        faction_id: z
          .string()
          .describe("Faction identifier to include faction-specific techs"),
        expansions: ExpansionsParam,
      }),
    },
    async ({ faction_id, expansions }) => {
      const exps = resolveExpansionsWithContext(expansions);
      const allTechs = loadFiltered<Technology>("technologies.json", {
        expansions: exps,
      });
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

      const availableTechs = allTechs.filter(
        (t) => !t.faction || t.faction === faction_id,
      );

      const byColor: Record<string, Technology[]> = {
        blue: [],
        red: [],
        yellow: [],
        green: [],
        faction: [],
        "unit-upgrade": [],
      };

      for (const tech of availableTechs) {
        if (tech.type === "faction") {
          byColor.faction.push(tech);
        } else if (tech.type === "unit-upgrade") {
          byColor["unit-upgrade"].push(tech);
        } else if (tech.color) {
          byColor[tech.color].push(tech);
        }
      }

      const result = {
        faction: faction.name,
        startingTech: faction.startingTech,
        techTree: byColor,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
